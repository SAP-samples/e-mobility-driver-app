// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseQuery } from '../../utils/odata';

import type { Evse } from './types';

export class EvseQuery extends BaseQuery<Evse> {
  // EVSE-specific search fields
  getSearchableFields(): string[] {
    return [
      'name',
      'code',
      'emi3Id',
      'chargingStationName',
      'location/siteAreaName',
      'location/address/city',
    ];
  }

  buildSearchFilter(): string | undefined {
    if (!this._search) return undefined;
    const s = this.escapeOData(this._search.toLowerCase());
    return `contains(tolower(name),'${s}') or contains(tolower(code),'${s}') or contains(tolower(emi3Id),'${s}') or contains(tolower(chargingStationName),'${s}') or contains(tolower(location/siteAreaName),'${s}') or contains(tolower(location/address/city),'${s}')`;
  }

  // EVSE-specific filters
  availableOnly(): this {
    this.filters.push("connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')");
    return this;
  }

  fastChargingOnly(): this {
    this.filters.push("connectors/any(c:c/currentType eq 'DC' and c/maximumPower ge 50)");
    return this;
  }

  inCity(city: string): this {
    this.filters.push(`location/address/city eq '${this.escapeOData(city)}'`);
    return this;
  }

  inSiteArea(area: string): this {
    this.filters.push(`location/siteAreaName eq '${this.escapeOData(area)}'`);
    return this;
  }

  // Station connectivity filters
  connected(thresholdMinutes: number = 3): this {
    const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const isoString = thresholdTime.toISOString();
    this.filters.push(`chargingStation/lastSeenAt gt ${isoString}`);
    return this;
  }

  disconnected(thresholdMinutes: number = 3): this {
    const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const isoString = thresholdTime.toISOString();
    this.filters.push(
      `(chargingStation/lastSeenAt le ${isoString} or chargingStation/lastSeenAt eq null)`,
    );
    return this;
  }

  // EVSE-specific sorting methods
  orderByName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('name', direction);
  }

  orderByCode(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('code', direction);
  }

  orderByChargingStationName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('chargingStationName', direction);
  }

  orderBySiteAreaName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('location/siteAreaName', direction);
  }

  orderBySiteName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('location/siteName', direction);
  }

  orderByCity(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('location/address/city', direction);
  }

  // Clear location (useful for fetching without geolocation filtering)
  clearLocation(): this {
    this._location = undefined;
    return this;
  }

  // Clone method
  clone(): this {
    const cloned = new EvseQuery();
    cloned.filters = [...this.filters];
    cloned._search = this._search;
    cloned._location = this._location ? { ...this._location } : undefined;
    cloned._page = this._page;
    cloned._pageSize = this._pageSize;
    cloned._orderBy = [...this._orderBy];
    return cloned as this;
  }
}
