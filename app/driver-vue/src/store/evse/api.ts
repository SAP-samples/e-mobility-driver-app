// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseApi } from '../../utils/odata';

import { EvseQuery } from './query-builder';
import type { Evse } from './types';

export class EvseApi extends BaseApi<Evse, EvseQuery> {
  getEntityName(): string {
    return 'ChargePoints';
  }

  getExpandFields(): string[] {
    return [
      'location($expand=coordinates,address)',
      'connectors',
      'chargingStation($select=id,lastSeenAt,disabled,registrationStatus,siteName,siteAreaName)',
    ];
  }

  /**
   * Find EVSE by its code
   */
  async findByCode(evseCode: string): Promise<Evse | null> {
    try {
      const query = new EvseQuery();
      query.filters.push(`code eq '${query.escapeOData(evseCode)}'`);
      query.page(1, 1); // 1st page, 1 result only

      const result = await this.fetch(query);

      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('Failed to find EVSE by code:', error);
      return null;
    }
  }

  /**
   * Find EVSE by its charging station ID (UUID)
   */
  async findByChargingStationId(chargingStationId: string): Promise<Evse | null> {
    try {
      const query = new EvseQuery();
      query.filters.push(`chargingStationId eq '${query.escapeOData(chargingStationId)}'`);
      query.page(1, 1); // 1st page, 1 result only

      const result = await this.fetch(query);

      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('Failed to find EVSE by charging station ID:', error);
      return null;
    }
  }
}
