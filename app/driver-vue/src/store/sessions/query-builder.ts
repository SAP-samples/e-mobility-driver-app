// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseQuery } from '../../utils/odata';

import type { Session } from './types';

export class SessionQuery extends BaseQuery<Session> {
  // Session-specific search fields
  getSearchableFields(): string[] {
    return [
      'sessionId',
      'siteName',
      'siteAreaName',
      'badgeAuthenticationId',
      'badgeVisualBadgeId',
      'chargingStationName',
      'emi3Id',
      'evseCode',
    ];
  }

  buildSearchFilter(): string | undefined {
    if (!this._search) return undefined;
    const searchTerm = this.escapeOData(this._search.toLowerCase());

    return this.getSearchableFields()
      .map((field) => `contains(tolower(${field}),'${searchTerm}')`)
      .join(' or ');
  }

  // Session-specific filters
  inProgress(): this {
    this.filters.push("status eq 'InProgress'");
    return this;
  }

  completed(): this {
    this.filters.push("status ne 'InProgress'");
    return this;
  }

  byStatus(status: string): this {
    this.filters.push(`status eq '${this.escapeOData(status)}'`);
    return this;
  }

  byBadgeId(badgeId: string): this {
    this.filters.push(`badgeVisualBadgeId eq '${this.escapeOData(badgeId)}'`);
    return this;
  }

  byAuthenticationId(authId: string): this {
    this.filters.push(`badgeAuthenticationId eq '${this.escapeOData(authId)}'`);
    return this;
  }

  bySite(siteName: string): this {
    this.filters.push(`siteName eq '${this.escapeOData(siteName)}'`);
    return this;
  }

  bySiteArea(siteArea: string): this {
    this.filters.push(`siteAreaName eq '${this.escapeOData(siteArea)}'`);
    return this;
  }

  byChargingStation(stationName: string): this {
    this.filters.push(`chargingStationName eq '${this.escapeOData(stationName)}'`);
    return this;
  }

  minDuration(minutes: number): this {
    this.filters.push(`totalDuration ge ${minutes}`);
    return this;
  }

  maxDuration(minutes: number): this {
    this.filters.push(`totalDuration le ${minutes}`);
    return this;
  }

  minEnergy(kwh: number): this {
    this.filters.push(`totalEnergyDelivered ge ${kwh}`);
    return this;
  }

  maxEnergy(kwh: number): this {
    this.filters.push(`totalEnergyDelivered le ${kwh}`);
    return this;
  }

  minPrice(amount: number): this {
    this.filters.push(`cumulatedPrice ge ${amount}`);
    return this;
  }

  maxPrice(amount: number): this {
    this.filters.push(`cumulatedPrice le ${amount}`);
    return this;
  }

  // Date range filters
  since(date: string): this {
    this.filters.push(`timestamp ge '${date}'`);
    return this;
  }

  until(date: string): this {
    this.filters.push(`timestamp le '${date}'`);
    return this;
  }

  // Session-specific sorting methods
  orderByTimestamp(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('timestamp', direction);
  }

  orderBySessionId(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('sessionId', direction);
  }

  orderBySiteName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('siteName', direction);
  }

  orderByDuration(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('totalDuration', direction);
  }

  orderByEnergy(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('totalEnergyDelivered', direction);
  }

  orderByPrice(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('cumulatedPrice', direction);
  }

  orderByStatus(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('status', direction);
  }

  // Clone method
  clone(): this {
    const cloned = new SessionQuery() as this;
    cloned.filters = [...this.filters];
    cloned._search = this._search;
    cloned._location = this._location ? { ...this._location } : undefined;
    cloned._page = this._page;
    cloned._pageSize = this._pageSize;
    cloned._orderBy = [...this._orderBy];
    return cloned;
  }
}
