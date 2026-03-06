// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { type Ref, computed, ref } from 'vue';

import { isWithinRadius } from '@/store/utils/geo';

/**
 * Entity with geolocation coordinates
 */
export interface GeoEntity {
  location?: {
    coordinates?: {
      latitude?: string | number;
      longitude?: string | number;
    };
  };
  [key: string]: any;
}

/**
 * Geolocation filter parameters
 */
export interface GeoLocation {
  lat: number;
  lon: number;
  radius: number;
}

/**
 * Options for loading geolocation-filtered data
 */
export interface GeoLoadOptions<Q> {
  query: Q; // Query object containing filters, location, sorting, pagination
}

/**
 * Composable for managing geolocation-filtered collection with client-side pagination
 *
 * This composable provides the same interface as useODataCollection but handles
 * geolocation filtering, sorting, and pagination entirely client-side.
 *
 * Use case: When backend doesn't support geolocation filtering natively, this composable:
 * 1. Fetches all raw data via a fetcher function (with query filters)
 * 2. Filters by radius client-side (if location in query)
 * 3. Sorts the filtered results
 * 4. Stores ALL filtered results (for map display)
 * 5. Applies virtual pagination (for list display)
 *
 * Interface compatibility with useODataCollection:
 * - Same reactive state properties (data, total, loading, error, etc.)
 * - Same async methods (load, loadMore, clear)
 * - Same computed properties (hasMorePages, isEmpty, hasData)
 *
 * Usage in stores:
 * ```typescript
 * const geoCollection = useGeolocationCollection<Evse, EvseQuery>(
 *   async (query) => {
 *     const fetchQuery = query.clone();
 *     fetchQuery.clearLocation();
 *     fetchQuery.page(1, 1000);
 *     const result = await api.fetch(fetchQuery);
 *     return result.data;
 *   }
 * );
 *
 * await geoCollection.load({
 *   query: evseQuery  // Contains filters, location, sorting, pagination
 * });
 *
 * const allResults = geoCollection.allData.value; // For map
 * const paginatedResults = geoCollection.data.value; // For list
 * ```
 */
export function useGeolocationCollection<T extends GeoEntity, Q>(
  fetcher: (query: Q) => Promise<T[]>,
) {
  // Core reactive state (same as useODataCollection)
  const data = ref<T[]>([]) as Ref<T[]>;
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(100);
  const defaultPageSize = ref(100);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Additional state for geolocation mode
  const allData = ref<T[]>([]) as Ref<T[]>; // All filtered results (for map)
  const lastQueryHadLocation = ref(false); // Track if last query had location

  // Computed properties (same as useODataCollection)
  const hasMorePages = computed(() => data.value.length < total.value);
  const hasData = computed(() => allData.value.length > 0);
  const isEmpty = computed(() => !loading.value && data.value.length === 0);

  /**
   * Filter items by geolocation radius
   */
  function filterByLocation(items: T[], location: GeoLocation): T[] {
    return items.filter((item) => {
      const coords = item.location?.coordinates;
      if (!coords?.latitude || !coords?.longitude) {
        return false;
      }

      const lat = Number(coords.latitude);
      const lon = Number(coords.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        return false;
      }

      return isWithinRadius(location.lat, location.lon, lat, lon, location.radius);
    });
  }

  /**
   * Sort items by field and direction
   */
  function sortItems(items: T[], sortOrder?: string): T[] {
    if (!sortOrder) return items;

    const [field, direction = 'asc'] = sortOrder.split(' ');
    const isDescending = direction === 'desc';

    return [...items].sort((a, b) => {
      const aValue = getFieldValue(a, field);
      const bValue = getFieldValue(b, field);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return isDescending ? 1 : -1;
      if (bValue == null) return isDescending ? -1 : 1;

      // Compare values
      const comparison = compareValues(aValue, bValue);
      return isDescending ? -comparison : comparison;
    });
  }

  /**
   * Get field value from entity (supports nested paths)
   */
  function getFieldValue(entity: T, field: string): unknown {
    // Handle nested paths like 'location/address/city'
    const parts = field.split('/');
    let value: any = entity;

    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }

    return value;
  }

  /**
   * Compare two values for sorting
   */
  function compareValues(a: unknown, b: unknown): number {
    // Handle numbers directly
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // Convert to strings and compare
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();
    return aStr.localeCompare(bStr);
  }

  /**
   * Paginate items
   */
  function paginateItems(items: T[], page: number, size: number): T[] {
    const start = (page - 1) * size;
    const end = start + size;
    return items.slice(start, end);
  }

  /**
   * Load data with geolocation filtering (replaces current data)
   * Interface compatible with useODataCollection.load()
   */
  async function load(options: GeoLoadOptions<Q>): Promise<T[]> {
    loading.value = true;
    error.value = null;

    try {
      const query = options.query;

      // 1. Fetch raw data with query (filters applied by backend)
      const rawData = await fetcher(query);

      // 2. Extract location from query (if it has getLocation method)
      const location = (query as any).getLocation?.();

      // Track if this query had a location
      lastQueryHadLocation.value = !!location;

      // 3. Filter by location if present
      const filtered = location ? filterByLocation(rawData, location) : rawData;

      // 4. Extract sort order from query (if it has getOrderBy method)
      const sortOrder = (query as any).getOrderBy?.();
      const sorted = sortItems(filtered, sortOrder);

      // 5. Store all filtered results (for map)
      allData.value = sorted;
      total.value = sorted.length;

      // 6. Extract pagination from query (if it has getPage/getPageSize methods)
      const page = (query as any).getPage?.() || 1;
      const size = (query as any).getPageSize?.() || defaultPageSize.value;
      const paginated = paginateItems(sorted, page, size);

      data.value = paginated;
      currentPage.value = page;
      pageSize.value = size;

      return paginated;
    } catch (e) {
      error.value = (e as Error).message || 'Failed to load geolocation data';
      allData.value = [];
      data.value = [];
      total.value = 0;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load more data and append to existing data
   * Interface compatible with useODataCollection.loadMore()
   */
  async function loadMore(): Promise<T[]> {
    if (!hasMorePages.value || loading.value) {
      return [];
    }

    const nextPage = currentPage.value + 1;
    const nextData = paginateItems(allData.value, nextPage, pageSize.value);

    // Append to existing data
    data.value = [...data.value, ...nextData];
    currentPage.value = nextPage;

    return nextData;
  }

  /**
   * Clear all data and reset state
   * Interface compatible with useODataCollection.clear()
   */
  function clear() {
    data.value = [];
    allData.value = [];
    total.value = 0;
    currentPage.value = 1;
    pageSize.value = defaultPageSize.value;
    error.value = null;
    lastQueryHadLocation.value = false; // Reset location tracking
  }

  /**
   * Clear only error state
   * Interface compatible with useODataCollection.clearError()
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Manually set collection data (for special cases)
   * Interface compatible with useODataCollection.setData()
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
   * Interface compatible with useODataCollection.setLoading()
   */
  function setLoading(isLoading: boolean) {
    loading.value = isLoading;
  }

  /**
   * Set error state
   * Interface compatible with useODataCollection.setError()
   */
  function setError(errorMessage: string | null) {
    error.value = errorMessage;
  }

  return {
    // Reactive state (same as useODataCollection)
    data,
    total,
    currentPage,
    pageSize,
    defaultPageSize,
    loading,
    error,

    // Additional state for geolocation mode
    allData, // All filtered results (for map display)

    // Computed properties (same as useODataCollection)
    hasMorePages,
    hasData,
    isEmpty,
    hasLocationQuery: computed(() => lastQueryHadLocation.value), // Track if last query had location

    // Methods (same interface as useODataCollection)
    load,
    loadMore,
    clear,
    clearError,
    setData,
    setLoading,
    setError,
  };
}
