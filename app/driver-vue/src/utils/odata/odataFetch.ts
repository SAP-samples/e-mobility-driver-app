// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import odataQuery from 'odata-query';

import useAuthFetch from '@/composables/useAuthFetch.ts';

// OData filter types for type-safe filtering
export type ODataPrimitive = string | number | boolean;
export type ODataComparison = {
  eq?: ODataPrimitive;
  ne?: ODataPrimitive;
  gt?: ODataPrimitive;
  ge?: ODataPrimitive;
  lt?: ODataPrimitive;
  le?: ODataPrimitive;
  in?: ODataPrimitive[];
};
export type ODataFieldFilter = ODataPrimitive | ODataComparison;
export type ODataLogical<T> = {
  and?: ODataFilter<T>[];
  or?: ODataFilter<T>[];
  not?: ODataFilter<T>;
};
export type ODataFilter<T> =
  | (Partial<Record<keyof T, ODataFieldFilter>> &
      Partial<ODataLogical<T>> & { [key: string]: ODataFieldFilter | undefined })
  | string;

export interface ODataFetchOptions<TFilter = Record<string, unknown>> {
  baseUrl: string;
  entity: string;
  expand?: string[];
  filter?: TFilter;
  search?: string;
  top?: number;
  skip?: number;
  orderBy?: string;
  id?: string;
  extraParams?: Record<string, string | number | boolean>;
  searchMode?: 'search' | 'filter'; // allow user to choose $search or $filter
}

export interface ODataFetchResult<T> {
  value: T[];
  '@odata.count'?: number;
}

export async function odataFetch<T, TFilter = Record<string, unknown>>(
  options: ODataFetchOptions<TFilter>,
): Promise<ODataFetchResult<T>> {
  const { baseUrl, entity, expand, filter, top, skip, orderBy, id, extraParams } = options;

  const query: Record<string, unknown> = {};
  if (expand) query.expand = expand;
  if (filter) query.filter = filter;
  if (top !== undefined) query.top = top;
  if (skip !== undefined) query.skip = skip;
  if (orderBy) query.orderBy = orderBy;

  let url = baseUrl + entity;
  if (id) url += `(${encodeURIComponent(id)})`;
  const queryString = odataQuery(query);
  url += queryString;

  // Append extraParams as standard query params (not handled by odata-query)
  if (extraParams && Object.keys(extraParams).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams)) {
      searchParams.append(key, String(value));
    }
    // If url already has ?, append with &
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  // Only add search filter if search is a non-empty string

  const response = await useAuthFetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`OData fetch failed: ${response.statusText}`);
  }
  return await response.json();
}
