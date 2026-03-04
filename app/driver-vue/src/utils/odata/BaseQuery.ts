// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import type { ODataFilter } from '@/utils/odata/odataFetch';

export interface IPagination {
  page: number;
  pageSize: number;
}

export interface ILocation {
  lat: number;
  lon: number;
  radius: number;
}

export abstract class BaseQuery<T = unknown> {
  public filters: string[] = [];
  protected _search?: string;
  protected _location?: ILocation;
  protected _page = 1;
  protected _pageSize = 100;
  protected _orderBy: string[] = [];

  // Common search methods
  search(text: string): this {
    this._search = text?.trim() || undefined;
    return this;
  }

  // Location methods
  nearLocation(lat: number, lon: number, radiusMeters: number): this {
    this._location = { lat, lon, radius: radiusMeters };
    return this;
  }

  // Pagination methods
  page(pageNum: number, size = 100): this {
    this._page = Math.max(1, pageNum);
    this._pageSize = Math.max(1, size);
    return this;
  }

  // Sorting methods
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    const orderClause = direction === 'desc' ? `${field} desc` : `${field} asc`;
    this._orderBy.push(orderClause);
    return this;
  }

  setOrderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this._orderBy = [];
    return this.orderBy(field, direction);
  }

  // Abstract methods that must be implemented by subclasses
  abstract buildSearchFilter(): string | undefined;
  abstract getSearchableFields(): string[];

  // Common builder methods
  buildFilter(): ODataFilter<T> | undefined {
    const uniqueFilters = [...new Set(this.filters)];
    const allFilters = [...uniqueFilters];

    const searchFilter = this.buildSearchFilter();
    if (searchFilter) allFilters.push(`(${searchFilter})`);

    return allFilters.length > 0 ? allFilters.join(' and ') : undefined;
  }

  getLocation(): ILocation | undefined {
    return this._location;
  }

  getPage(): number {
    return this._page;
  }

  getPageSize(): number {
    return this._pageSize;
  }

  getOrderBy(): string | undefined {
    return this._orderBy.length > 0 ? this._orderBy.join(', ') : undefined;
  }

  // Reset method
  clear(): this {
    this.filters = [];
    this._search = undefined;
    this._location = undefined;
    this._page = 1;
    this._pageSize = 100;
    this._orderBy = [];
    return this;
  }

  // Utility methods
  escapeOData(value: string): string {
    return value.replace(/'/g, "''");
  }

  // Abstract clone method
  abstract clone(): this;
}
