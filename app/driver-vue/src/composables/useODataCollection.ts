// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { computed, ref } from 'vue';

import type { BaseApi, BaseQuery } from '@/utils/odata';

/**
 * Composable for managing OData collection state and operations
 *
 * This composable encapsulates all technical concerns related to data fetching:
 * - Loading states
 * - Error handling
 * - Pagination state
 * - Data management
 *
 * Page Size Behavior:
 * - If query defines a page size → use it and track it for loadMore
 * - If query doesn't specify pageSize → use defaultPageSize (100)
 * - pageSize tracks the actual page size being used for queries (not result count)
 * - defaultPageSize remains constant at the collection's default (100)
 * - setData() preserves pageSize for consistent pagination logic
 *
 * Usage in stores:
 * ```typescript
 * const inProgressCollection = useODataCollection(api);
 * await inProgressCollection.load(SessionPresets.inProgress());
 * const sessions = inProgressCollection.data.value;
 * const currentPageSize = inProgressCollection.pageSize.value; // Actual page size in use
 * const defaultPageSize = inProgressCollection.defaultPageSize.value; // Always 100
 *
 * // For special cases like location-based queries, use the provided methods:
 * inProgressCollection.setData(locationResults, totalCount);
 * inProgressCollection.setLoading(true);
 * inProgressCollection.setError('Something went wrong');
 * // Note: setData preserves pageSize for consistent pagination behavior
 * ```
 */
export function useODataCollection<T, Q extends BaseQuery<T>>(api: BaseApi<T, Q>) {
  // Core reactive state
  const data = ref<T[]>([]);
  const total = ref(0);
  const currentPage = ref(1);
  const defaultPageSize = ref(100); // Default page size for the collection
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Store the last query for loadMore functionality
  const lastQuery = ref<Q | null>(null);

  // Track the actual page size used for the current data (for pagination and hasMorePages calculation)
  const pageSize = ref(100);

  // Computed properties for UI
  const hasMorePages = computed(() => currentPage.value * pageSize.value < total.value);
  const hasData = computed(() => data.value.length > 0);
  const isEmpty = computed(() => !loading.value && data.value.length === 0);

  /**
   * Load data using a query (replaces current data)
   */
  async function load(query: Q): Promise<T[]> {
    loading.value = true;
    error.value = null;
    lastQuery.value = query;

    try {
      // Use the query's page size if explicitly set, otherwise use default
      const queryPageSize = query.getPageSize();
      const actualPageSize =
        queryPageSize !== defaultPageSize.value ? queryPageSize : defaultPageSize.value;

      // Set pagination to start from beginning
      const paginatedQuery = query.clone().page(1, actualPageSize);

      const result = await api.fetch(paginatedQuery);
      data.value = result.data;
      total.value = result.total;
      currentPage.value = 1; // Always start at page 1 for new loads
      pageSize.value = actualPageSize; // Track the actual page size used

      return result.data;
    } catch (e) {
      error.value = (e as Error).message || 'Failed to fetch data';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load more data and append to existing data
   */
  async function loadMore(): Promise<T[]> {
    if (!hasMorePages.value || !lastQuery.value || loading.value) {
      return [];
    }

    loading.value = true;
    error.value = null;

    try {
      const nextPage = currentPage.value + 1;

      // Use the current page size that was established in the load() call
      const actualPageSize = pageSize.value;

      // Use the last query with updated pagination
      const paginatedQuery = lastQuery.value.clone().page(nextPage, actualPageSize);

      const result = await api.fetch(paginatedQuery);

      // Append new data to existing data
      data.value = [...data.value, ...result.data] as T[];
      currentPage.value = nextPage;

      return result.data;
    } catch (e) {
      error.value = (e as Error).message || 'Failed to load more data';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear all data and reset state
   */
  function clear() {
    data.value = [];
    total.value = 0;
    currentPage.value = 1;
    pageSize.value = defaultPageSize.value;
    error.value = null;
    lastQuery.value = null;
  }

  /**
   * Clear only error state
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Manually set collection data (for special cases like location-based queries)
   */
  function setData(newData: T[], newTotal: number, resetPage = true) {
    data.value = newData;
    total.value = newTotal;
    if (resetPage) {
      currentPage.value = 1;
    }
  }

  /**
   * Set loading state
   */
  function setLoading(isLoading: boolean) {
    loading.value = isLoading;
  }

  /**
   * Set error state
   */
  function setError(errorMessage: string | null) {
    error.value = errorMessage;
  }

  return {
    // Reactive state (direct refs for consistent access)
    data,
    total,
    currentPage,
    pageSize,
    defaultPageSize,
    loading,
    error,

    // Computed properties
    hasMorePages,
    hasData,
    isEmpty,

    // Methods
    load,
    loadMore,
    clear,
    clearError,
    setData,
    setLoading,
    setError,
  };
}
