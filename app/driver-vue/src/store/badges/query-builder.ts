// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseQuery } from '../../utils/odata';

import type { Badge } from './types';

export class BadgeQuery extends BaseQuery<Badge> {
  // Badge-specific search fields
  getSearchableFields(): string[] {
    return [
      'visualBadgeId',
      'authenticationId',
      'description',
      'firstName',
      'lastName',
      'licensePlate',
    ];
  }

  buildSearchFilter(): string | undefined {
    if (!this._search) return undefined;
    const searchTerm = this.escapeOData(this._search.toLowerCase());

    return this.getSearchableFields()
      .map((field) => `contains(tolower(${field}),'${searchTerm}')`)
      .join(' or ');
  }

  // Badge-specific filters
  activeOnly(): this {
    this.filters.push('active eq true');
    return this;
  }

  inactiveOnly(): this {
    this.filters.push('active eq false');
    return this;
  }

  withLicensePlate(): this {
    this.filters.push('licensePlate ne null');
    return this;
  }

  byVisualBadgeId(badgeId: string): this {
    this.filters.push(`visualBadgeId eq '${this.escapeOData(badgeId)}'`);
    return this;
  }

  byAuthenticationId(authId: string): this {
    this.filters.push(`authenticationId eq '${this.escapeOData(authId)}'`);
    return this;
  }

  // Badge-specific sorting methods
  orderByVisualBadgeId(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('visualBadgeId', direction);
  }

  orderByDescription(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('description', direction);
  }

  orderByFirstName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('firstName', direction);
  }

  orderByLastName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('lastName', direction);
  }

  orderByLicensePlate(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('licensePlate', direction);
  }

  orderByActive(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('active', direction);
  }

  // Clone method
  clone(): this {
    const cloned = new BadgeQuery() as this;
    cloned.filters = [...this.filters];
    cloned._search = this._search;
    cloned._location = this._location ? { ...this._location } : undefined;
    cloned._page = this._page;
    cloned._pageSize = this._pageSize;
    cloned._orderBy = [...this._orderBy];
    return cloned;
  }
}
