// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { EvseApi } from './api';
import { MAX_EVSE_RESULTS } from './constants';
import { EvsePresets } from './presets';
import { EvseQuery } from './query-builder';
import type { Evse } from './types';

import { useGeolocationCollection } from '@/composables/useGeolocationCollection';
import { useODataCollection } from '@/composables/useODataCollection';

const BASE_URL = import.meta.env.VITE_BACKEND_URL + 'odata/v4/charge-point/';

/**
 * EVSE (Electric Vehicle Supply Equipment) Store
 *
 * Manages charging station/EVSE data, including:
 * - Search and filtering
 * - Pagination
 * - Sorting (by name, code, charging station name, site area, site, city)
 * - Location-based queries
 *
 * Default sorting: Alphabetical by charge point name (ascending)
 */
export const useEvseStore = defineStore('evses', () => {
  // API Instance
  const api = new EvseApi(BASE_URL);

  // Collection context using composable for technical concerns
  const evseCollection = useODataCollection(api);

  // Geolocation collection for client-side filtering and pagination
  const geoCollection = useGeolocationCollection<Evse, EvseQuery>(async (query: EvseQuery) => {
    // Fetcher: retrieve raw data with filters but without geolocation
    const fetchQuery = query.clone();
    fetchQuery.clearLocation(); // Remove location (backend doesn't support it)
    fetchQuery.page(1, MAX_EVSE_RESULTS); // Fetch up to 1000 results
    const result = await api.fetch(fetchQuery);
    return result.data;
  });

  // Business state
  const selectedEvse = ref<Evse | null>(null);
  const selectedEvseLoading = ref<boolean>(false);
  const selectedEvseError = ref<string | null>(null);

  // Map-specific state
  const mapEvses = computed(() => {
    // Use geoCollection data if available (automatically by loadEvses())
    if (geoCollection.hasData.value) {
      return geoCollection.allData.value;
    }
    // Fallback to evseCollection
    return evseCollection.data.value as Evse[];
  });

  // Sorting state
  const sortField = ref<string>('name');
  const sortDirection = ref<'asc' | 'desc'>('asc');

  // ===== BUSINESS OPERATIONS =====

  // Main search method with location support
  // Automatically loads both list (paginated) and map data (all results)
  async function loadEvses(query?: EvseQuery): Promise<Evse[]> {
    const searchQuery = query || EvsePresets.available();
    const location = searchQuery?.getLocation?.();

    if (location) {
      // Geolocation mode: 1 request loads everything (list + map)
      return await geoCollection.load({ query: searchQuery });
    } else {
      // 2 parallel requests
      // - evseCollection: paginated list for UI
      // - geoCollection: all results for map
      geoCollection.clear();

      const mapQuery = searchQuery.clone();
      mapQuery.page(1, MAX_EVSE_RESULTS); // Load up to 1000 for the map

      const [listData] = await Promise.all([
        evseCollection.load(searchQuery), // Paginated list
        geoCollection.load({ query: mapQuery }), // All results for map
      ]);

      return listData;
    }
  }

  async function fetchById(evseId: string): Promise<Evse | null> {
    try {
      selectedEvseLoading.value = true;
      selectedEvseError.value = null;

      const evse = await api.fetchById(evseId);
      selectedEvse.value = evse;

      return evse;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('EVSE fetchById failed:', e);
      selectedEvse.value = null;
      selectedEvseError.value = 'Failed to load EVSE details';
      return null;
    } finally {
      selectedEvseLoading.value = false;
    }
  }

  async function findByCode(evseCode: string): Promise<Evse | null> {
    try {
      return await api.findByCode(evseCode);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('EVSE findByCode failed:', e);
      return null;
    }
  }

  async function findByChargingStationId(chargingStationId: string): Promise<Evse | null> {
    try {
      return await api.findByChargingStationId(chargingStationId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('EVSE findByChargingStationId failed:', e);
      return null;
    }
  }

  // Count EVSEs matching a query (optimized - doesn't load data)
  async function countEvses(query?: EvseQuery): Promise<number> {
    try {
      return await api.count(query || EvsePresets.available());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('EVSE count failed:', e);
      return 0;
    }
  }

  // Convenience methods using presets (updated to use new method)
  async function loadAvailable(): Promise<Evse[]> {
    return loadEvses(EvsePresets.available());
  }

  async function loadFastCharging(): Promise<Evse[]> {
    return loadEvses(EvsePresets.fastCharging());
  }

  async function loadNearby(lat: number, lon: number, radiusKm = 10): Promise<Evse[]> {
    return loadEvses(EvsePresets.nearLocation(lat, lon, radiusKm));
  }

  // State management
  function setSelectedEvse(evse: Evse | null) {
    selectedEvse.value = evse;
  }

  function clearResults() {
    evseCollection.clear();
    evseCollection.clearError();
  }

  function clearError() {
    evseCollection.clearError();
  }

  function clearSelectedEvseError() {
    selectedEvseError.value = null;
  }

  function createQuery(): EvseQuery {
    const query = new EvseQuery();

    // Apply current sorting
    if (sortField.value) {
      query.setOrderBy(sortField.value, sortDirection.value);
    }

    return query;
  }

  // Sorting methods
  function setSorting(field: string, direction: 'asc' | 'desc') {
    sortField.value = field;
    sortDirection.value = direction;
  }

  // ===== COMPUTED CONTEXT FOR UI =====
  const evses = computed(() => {
    // Use geoCollection if last query had a location, otherwise use evseCollection
    const activeCollection = geoCollection.hasLocationQuery.value ? geoCollection : evseCollection;

    return {
      data: activeCollection.data.value as Evse[],
      loading: activeCollection.loading.value,
      hasMore: activeCollection.hasMorePages.value,
      isEmpty: activeCollection.isEmpty.value,
      total: activeCollection.total.value,
      error: activeCollection.error.value,
    };
  });

  // Selected EVSE context for detail page
  const selectedEvseContext = computed(() => ({
    data: selectedEvse.value,
    loading: selectedEvseLoading.value,
    error: selectedEvseError.value,
  }));

  // ===== PAGINATION METHODS =====
  async function loadMoreEvses(): Promise<Evse[]> {
    // Check if we're in geolocation mode using hasLocationQuery
    if (geoCollection.hasLocationQuery.value) {
      // Geolocation mode: virtual pagination from in-memory results
      return await geoCollection.loadMore();
    } else {
      // Normal mode: real OData pagination
      return await evseCollection.loadMore();
    }
  }

  return {
    // ===== COLLECTION ACCESS =====
    // Direct access to collection with all technical state
    evseCollection,

    // ===== BUSINESS STATE =====
    selectedEvse,
    selectedEvseContext,
    sortField,
    sortDirection,

    // ===== COMPUTED CONTEXT FOR UI =====
    evses,

    // ===== MAP STATE =====
    mapEvses,

    // ===== BUSINESS OPERATIONS =====
    // Main loading method (loads both list and map data automatically)
    loadEvses,
    countEvses,

    // Convenience preset methods
    fetchById,
    findByCode,
    findByChargingStationId,
    loadAvailable,
    loadFastCharging,
    loadNearby,

    // Pagination
    loadMoreEvses,

    // State management
    setSelectedEvse,
    clearResults,
    clearError,
    clearSelectedEvseError,
    createQuery,
    setSorting,

    // Direct API access
    api,
  };
});

export { EvseQuery } from './query-builder';
export { EvsePresets } from './presets';
export type { Evse, Connector, EvseLocation } from './types';
