// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { CdsSelectQuery } from 'types/cds-query';
import { CdsRequestWithContext } from 'types/cds-request';

import cds, { ApplicationService, Query, Request, Service } from '@sap/cds';

import {
  getActiveUserBadge,
  getCurrentUserBadges,
  hasUserBadge,
  requireBadgeAccess,
} from './utils/badge-validator';
import { addFilterToQuery, buildBadgeFilter } from './utils/request-filter';

import { Connector } from '#cds-models/ChargePointService';

function isCdsSelectQuery(query: unknown): query is CdsSelectQuery {
  return (
    typeof query === 'object' &&
    query !== null &&
    'SELECT' in query &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (query as any).SELECT !== undefined
  );
}

export class SessionService extends ApplicationService {
  private readonly logger = cds.log('SessionService');
  private chargingSessionService!: Service;
  private chargingStationService!: Service;

  async init() {
    this.chargingSessionService = await cds.connect.to('ChargingSessionService');
    this.chargingStationService = await cds.connect.to('ChargingStationService');
    this.on('READ', 'ChargingSessions', this.onReadChargingSessions.bind(this));
    this.on('stopChargingSession', this.onStopChargingSessions.bind(this));
    this.on('startChargingSession', this.onStartChargingSessions.bind(this));
    this.on(
      'READ',
      'ChargingSessionMonthlyStats',
      this.onReadChargingSessionMonthlyStats.bind(this),
    );
    await super.init();
  }

  private getFirstDayOfMonth(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString();
  }

  private async onReadChargingSessionMonthlyStats(request: CdsRequestWithContext) {
    try {
      // Ensure user has badge access using centralized system
      await requireBadgeAccess(request as Request);

      // Get user badges from context (cached, fast)
      const badgeAuthIds = await getCurrentUserBadges();
      const badgeFilter = badgeAuthIds
        .map((badge) => `badgeAuthenticationId eq '${badge.authenticationId}'`)
        .join(' or ');
      const filter = `(${badgeFilter}) and timestamp ge '${this.getFirstDayOfMonth()}'`;
      const apply = `filter(${filter})/aggregate(id with countdistinct as totalSessions,totalEnergyDelivered with sum as totalKwh,cumulatedPrice with sum as totalAmount)`;
      const url = `/ChargingSessions?$apply=${encodeURIComponent(apply)}`;
      const result = await this.chargingSessionService.send({ path: url, method: 'GET' });
      return result.value || result;
    } catch (error) {
      this.logger.error('Error while connecting to SessionService: ', JSON.stringify(error));
      request.reply([]);
    }
  }

  private async onReadChargingSessions(request: CdsRequestWithContext) {
    try {
      if (isCdsSelectQuery(request.query)) {
        // Ensure user has badge access using centralized system
        await requireBadgeAccess(request as Request);

        // Get user badges from context (cached, fast)
        const badgeAuthIds = await getCurrentUserBadges();
        const badgeFilter = buildBadgeFilter(badgeAuthIds);
        addFilterToQuery(request as Request, badgeFilter);
        return await this.chargingSessionService.run(request.query as unknown as Query);
      }
      return [];
    } catch (error) {
      this.logger.error('Error while connecting to SessionService: ', JSON.stringify(error));
      request.reply([]);
    }
  }

  private async onStopChargingSessions(request: CdsRequestWithContext) {
    try {
      const { sessionId } = request.data;
      if (!sessionId) {
        throw new Error('Session ID is required to stop the charging session.');
      }

      // Ensure user has badge access using centralized system
      await requireBadgeAccess(request as Request);

      const { ChargingSessions } = this.chargingSessionService.entities;
      const session = await this.chargingSessionService.run(
        SELECT.one.from(ChargingSessions).where({ id: sessionId }),
      );

      if (!session) {
        throw new Error(`Charging session with ID ${sessionId} not found.`);
      }

      if (!(await hasUserBadge(session.badgeAuthenticationId))) {
        throw new Error(`Unauthorized to stop charging session with ID ${sessionId}.`);
      }

      const { Evses } = this.chargingStationService.entities;
      const evse = await this.chargingStationService.run(
        SELECT.one.from(Evses).where({ code: session.evseCode }),
      );

      if (!evse) {
        throw new Error(`Charging station with EVSE code ${session.evseCode} not found.`);
      }

      const response = await this.chargingStationService.send({
        path: `ChargingStations(id=${evse.chargingStationId})/Stop`,
        method: 'POST',
        data: {
          chargingSessionId: sessionId,
        },
      });
      return response.responseData ? response.responseData : response;
    } catch (error) {
      this.logger.error('Error while stopping charging session: ', JSON.stringify(error));
      request.error(error as Error);
    }
  }

  private async onStartChargingSessions(request: CdsRequestWithContext) {
    try {
      const { evseId } = request.data;
      if (!evseId) {
        throw new Error('EVSE Id is required to start the charging session.');
      }

      // Ensure user has badge access using centralized system
      await requireBadgeAccess(request as Request);

      const activeBadge = await getActiveUserBadge();

      if (!activeBadge) {
        throw new Error('No active badge authentication found for the user.');
      }

      // Get EVSE details with connectors using CAP DSL syntax
      const { Evses } = this.chargingStationService.entities;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      const evse = await this.chargingStationService.run(
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        SELECT.one
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(Evses, (e: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            e.id;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            e.chargingStationId;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            e.connectors((c: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              c.connectorId;
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              c.status;
            });
          })
          .where({ id: evseId }),
      );

      if (!evse) {
        throw new Error(`EVSE with ID ${evseId} not found.`);
      }

      // Find the best connector: PREPARING takes priority over Available
      const connectors = evse.connectors || [];
      const selectedConnector = connectors.reduce((selected: Connector, current: Connector) => {
        if (!current.connectorId || current.connectorId <= 0) return selected;

        const currentStatus = current.status?.toLowerCase();
        const selectedStatus = selected?.status?.toLowerCase();

        if (currentStatus === 'preparing') {
          return !selected || selectedStatus !== 'preparing' ? current : selected;
        }

        if (currentStatus === 'available' && !selected) {
          return current;
        }

        return selected;
      }, null);

      if (!selectedConnector) {
        throw new Error(`No available connectors found for EVSE ${evseId}.`);
      }

      const response = await this.chargingStationService.send({
        path: `ChargingStations(id=${evse.chargingStationId})/Start`,
        method: 'POST',
        data: {
          badgeAuthenticationId: activeBadge.authenticationId,
          connectorId: Number(selectedConnector.connectorId),
        },
      });
      return response.responseData ? response.responseData : response;
    } catch (error) {
      this.logger.error('Error while starting charging session: ', JSON.stringify(error));
      request.error(error as Error);
    }
  }
}
