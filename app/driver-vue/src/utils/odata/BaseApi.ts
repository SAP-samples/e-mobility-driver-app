// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseQuery, type ILocation } from './BaseQuery';

import type { ODataFetchResult, ODataFilter } from '@/utils/odata/odataFetch';
import { odataFetch } from '@/utils/odata/odataFetch';

export interface IApiResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export abstract class BaseApi<T, Q extends BaseQuery<T>> {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  abstract getEntityName(): string;
  abstract getExpandFields(): string[];

  async fetch(query: Q): Promise<IApiResult<T>> {
    const filter = query.buildFilter();
    const orderBy = query.getOrderBy();
    const page = query.getPage();
    const pageSize = query.getPageSize();
    const skip = (page - 1) * pageSize;

    const result: ODataFetchResult<T> = await odataFetch<T, ODataFilter<T>>({
      baseUrl: this.baseUrl,
      entity: this.getEntityName(),
      expand: this.getExpandFields(),
      top: pageSize,
      skip,
      filter,
      orderBy,
      extraParams: { $count: 'true' },
    });

    return {
      data: result.value ?? [],
      total: result['@odata.count'] ?? 0,
      page,
      pageSize,
    };
  }

  async fetchNearby(query: Q, _location: ILocation): Promise<IApiResult<T>> {
    // Default implementation - can be overridden for location-specific logic
    return this.fetch(query);
  }

  async fetchById(id: string): Promise<T | null> {
    try {
      const result = await odataFetch<T>({
        baseUrl: this.baseUrl,
        entity: this.getEntityName(),
        expand: this.getExpandFields(),
        id,
      });

      // When fetching by ID, OData returns the entity directly, not wrapped in { value: [...] }
      return (result as unknown as T) ?? null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch ${this.getEntityName()} by ID:`, error);
      return null;
    }
  }

  async count(query: Q): Promise<number> {
    const filter = query.buildFilter();

    const result: ODataFetchResult<T> = await odataFetch<T, ODataFilter<T>>({
      baseUrl: this.baseUrl,
      entity: this.getEntityName(),
      top: 0, // Don't load any data, just get the count
      filter,
      extraParams: { $count: 'true' },
    });

    return result['@odata.count'] ?? 0;
  }
}
