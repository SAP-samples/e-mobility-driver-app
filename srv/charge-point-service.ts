// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds, { ApplicationService, Request, Service } from '@sap/cds';

import { requireBadgeAccess } from './utils/badge-validator';

export class ChargePointService extends ApplicationService {
  private readonly logger = cds.log('ChargePointService');
  private chargingStationService!: Service;

  async init() {
    this.chargingStationService = await cds.connect.to('ChargingStationService');

    this.on('READ', 'ChargePoints', this.onReadChargePoints.bind(this));
    await super.init();
  }

  private async onReadChargePoints(request: Request) {
    try {
      // Ensure user has badge access using centralized system
      await requireBadgeAccess(request);

      // Get EVSE data from external service
      return await this.chargingStationService.run(request.query);
    } catch (error) {
      this.logger.error('Error during ChargePoints READ operation:', error);
      request.reply([]);
    }
  }
}
