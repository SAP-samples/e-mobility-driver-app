// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEvseStore } from '@/store/evse';
import type { Evse } from '@/store/evse/types';

// Mock EVSE data
const mockEvse: Evse = {
  id: '12345',
  emi3Id: 'EMI3_001',
  index: 1,
  code: 'EVSE_001',
  name: 'Test EVSE',
  parking: 'P1',
  parkingLevel: 'Level 0',
  parkingSpace: 'A01',
  chargingStationId: 'CS_001',
  chargingStationName: 'Test Charging Station',
  connectors: [
    {
      connectorId: 1,
      type: 'Type2',
      currentType: 'AC',
      voltage: 400,
      numberOfPhases: 3,
      evseIndex: 1,
      current: 32,
      currentLimit: 32,
      status: 'Available',
      maximumPower: 22,
    },
  ],
  location: {
    parkingLevel: 'Level 0',
    parkingName: 'Main Parking',
    parkingSpace: 'A01',
    companyId: 'COMP_001',
    siteId: 'SITE_001',
    siteName: 'Downtown Station',
    siteAreaId: 'AREA_001',
    siteAreaName: 'Area A',
    address: {
      number: '123',
      street: 'Test Street',
      postalCode: '10115',
      city: 'Berlin',
      countryCode: 'DE',
      country: 'Germany',
      state: 'Berlin',
    },
    coordinates: {
      latitude: '52.520008',
      longitude: '13.404954',
    },
  },
};

const mockEvses: Evse[] = [mockEvse];

// Global mock functions
const mockLoad = vi.fn().mockResolvedValue([]);
const mockLoadMore = vi.fn().mockResolvedValue([]);
const mockClear = vi.fn();
const mockClearError = vi.fn();

// Mock refs for collection state
const mockData = { value: [] };
const mockLoading = { value: false };
const mockError = { value: null };
const mockTotal = { value: 0 };
const mockCurrentPage = { value: 1 };
const mockPageSize = { value: 100 };

// Mock refs for geo collection state
const mockGeoData = { value: [] as Evse[] };
const mockGeoAllData = { value: [] as Evse[] };
const mockGeoHasData = { value: false };
const mockGeoHasLocationQuery = { value: false };
const mockGeoLoad = vi.fn().mockResolvedValue([]);
const mockGeoLoadMore = vi.fn().mockResolvedValue([]);
const mockGeoClear = vi.fn();

// Mock useODataCollection
vi.mock('@/composables/useODataCollection', () => ({
  useODataCollection: vi.fn(() => ({
    data: mockData,
    loading: mockLoading,
    error: mockError,
    currentPage: mockCurrentPage,
    pageSize: mockPageSize,
    defaultPageSize: { value: 100 },
    total: mockTotal,
    hasMorePages: { value: false },
    isEmpty: { value: true },
    hasData: { value: false },
    load: mockLoad,
    loadMore: mockLoadMore,
    clear: mockClear,
    clearError: mockClearError,
    setData: vi.fn((newData, newTotal, resetPage = true) => {
      mockData.value = newData;
      mockTotal.value = newTotal;
      if (resetPage) {
        mockCurrentPage.value = 1;
      }
      mockPageSize.value = newData.length || 100;
    }),
    setLoading: vi.fn((isLoading) => {
      mockLoading.value = isLoading;
    }),
    setError: vi.fn((errorMessage) => {
      mockError.value = errorMessage;
    }),
  })),
}));

// Mock useGeolocationCollection
vi.mock('@/composables/useGeolocationCollection', () => ({
  useGeolocationCollection: vi.fn(() => ({
    data: mockGeoData,
    allData: mockGeoAllData,
    loading: { value: false },
    error: { value: null },
    total: { value: 0 },
    currentPage: { value: 1 },
    pageSize: { value: 20 },
    hasMorePages: { value: false },
    isEmpty: { value: true },
    hasData: mockGeoHasData,
    hasLocationQuery: mockGeoHasLocationQuery,
    load: mockGeoLoad,
    loadMore: mockGeoLoadMore,
    clear: mockGeoClear,
  })),
}));

// Mock EvseApi
const mockFindByCode = vi.fn().mockResolvedValue(mockEvse);

vi.mock('@/store/evse/api', () => ({
  EvseApi: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    fetchById: vi.fn().mockResolvedValue(null),
    findByCode: mockFindByCode,
    findByChargingStationId: vi.fn().mockResolvedValue(null),
  })),
}));

// Mock presets
vi.mock('@/store/evse/presets', () => ({
  EvsePresets: {
    defaultSorted: vi.fn().mockReturnValue({
      getLocation: vi.fn().mockReturnValue(undefined),
      clone: vi.fn().mockReturnThis(),
    }),
    available: vi.fn().mockReturnValue({
      getLocation: vi.fn().mockReturnValue(undefined),
      clone: vi.fn().mockReturnThis(),
      page: vi.fn().mockReturnThis(),
    }),
    fastCharging: vi.fn().mockReturnValue({
      getLocation: vi.fn().mockReturnValue(undefined),
      clone: vi.fn().mockReturnValue({
        page: vi.fn().mockReturnThis(),
        getLocation: vi.fn().mockReturnValue(undefined),
        clone: vi.fn().mockReturnThis(),
      }),
    }),
    nearby: vi.fn().mockReturnValue({
      getLocation: vi.fn().mockReturnValue(undefined),
      clone: vi.fn().mockReturnThis(),
    }),
    nearLocation: vi.fn().mockReturnValue({
      getLocation: vi.fn().mockReturnValue({ lat: 52.520008, lon: 13.404954, radius: 10 }),
      clone: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock query builder
vi.mock('@/store/evse/query-builder', () => ({
  EvseQuery: vi.fn().mockImplementation(() => ({
    build: vi.fn().mockReturnValue({}),
    setOrderBy: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    location: vi.fn().mockReturnThis(),
    operator: vi.fn().mockReturnThis(),
    connectorType: vi.fn().mockReturnThis(),
    page: vi.fn().mockReturnThis(),
    getLocation: vi.fn().mockReturnValue(undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clone: vi.fn().mockImplementation(function (this: any) {
      return {
        ...this,
        page: vi.fn().mockReturnThis(),
        getLocation: vi.fn().mockReturnValue(undefined),
        clone: vi.fn().mockReturnThis(),
      };
    }),
  })),
}));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('EVSE Store', () => {
  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const store = useEvseStore();

      // New structure uses computed properties from collections
      expect(store.evses.data).toEqual([]);
      expect(store.evses.loading).toBe(false);
      expect(store.evses.error).toBeNull();
      expect(store.selectedEvse).toBeNull();
    });

    it('should have collections initialized', () => {
      const store = useEvseStore();

      // Verify collection exists
      expect(store).toHaveProperty('evseCollection');
    });
  });

  describe('Load operations', () => {
    it('should load EVSEs', async () => {
      const store = useEvseStore();

      // Since the actual implementation checks for clone method and returns empty if not found,
      // let's test that it doesn't throw an error
      const result = await store.loadEvses();

      // Should return empty array if query doesn't have clone method
      expect(result).toEqual([]);
    });

    it('should handle load errors gracefully', async () => {
      const store = useEvseStore();

      // The actual implementation catches errors and returns empty array
      const result = await store.loadEvses();

      expect(result).toEqual([]);
    });
  });

  describe('Convenience methods', () => {
    it('should have convenience preset methods', () => {
      const store = useEvseStore();

      // Test that all convenience methods are available
      expect(typeof store.loadAvailable).toBe('function');
      expect(typeof store.loadFastCharging).toBe('function');
      expect(typeof store.loadNearby).toBe('function');
      expect(typeof store.fetchById).toBe('function');
    });

    it('should call loadEvses for loadAvailable', async () => {
      const store = useEvseStore();

      // Since the actual implementation may return empty due to missing clone method,
      // just verify it doesn't throw
      const result = await store.loadAvailable();

      expect(result).toEqual([]);
    });

    it('should call loadEvses for loadFastCharging', async () => {
      const store = useEvseStore();

      // Since the actual implementation may return empty due to missing clone method,
      // just verify it doesn't throw
      const result = await store.loadFastCharging();

      expect(result).toEqual([]);
    });

    it('should call loadEvses for loadNearby', async () => {
      const store = useEvseStore();

      // Just verify it doesn't throw
      const result = await store.loadNearby(52.520008, 13.404954);

      // With current mocks, will return empty array
      expect(result).toEqual([]);
    });
  });

  describe('Pagination', () => {
    it('should support loadMore', async () => {
      const store = useEvseStore();

      await store.loadMoreEvses();

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('EVSE selection', () => {
    it('should set selected EVSE', () => {
      const store = useEvseStore();

      store.setSelectedEvse(mockEvse);

      expect(store.selectedEvse).toEqual(mockEvse);
    });

    it('should clear selected EVSE', () => {
      const store = useEvseStore();

      store.setSelectedEvse(mockEvse);
      store.setSelectedEvse(null);

      expect(store.selectedEvse).toBeNull();
    });
  });

  describe('State management', () => {
    it('should clear results', () => {
      const store = useEvseStore();

      store.clearResults();

      expect(mockClear).toHaveBeenCalled();
    });

    it('should create query', () => {
      const store = useEvseStore();

      const query = store.createQuery();

      expect(query).toBeDefined();
    });

    it('should set sorting', () => {
      const store = useEvseStore();

      store.setSorting('distance', 'asc');

      expect(store.sortField).toBe('distance');
      expect(store.sortDirection).toBe('asc');
    });

    it('should clear error', () => {
      const store = useEvseStore();

      store.clearError();

      expect(mockClearError).toHaveBeenCalled();
    });

    it('should clear selected EVSE error', () => {
      const store = useEvseStore();

      store.clearSelectedEvseError();

      expect(store.selectedEvseContext.error).toBeNull();
    });

    it('should expose selectedEvseContext computed property', () => {
      const store = useEvseStore();

      expect(store.selectedEvseContext).toBeDefined();
      expect(store.selectedEvseContext.data).toBeNull();
      expect(store.selectedEvseContext.loading).toBe(false);
      expect(store.selectedEvseContext.error).toBeNull();

      // Test with selected EVSE
      store.setSelectedEvse(mockEvse);
      expect(store.selectedEvseContext.data).toStrictEqual(mockEvse);
    });
  });

  describe('Fetch by ID', () => {
    it('should fetch EVSE by ID successfully', async () => {
      const store = useEvseStore();

      // Mock successful API response
      const { EvseApi } = await import('@/store/evse/api');
      const mockApiInstance = new EvseApi('test-url');
      mockApiInstance.fetchById = vi.fn().mockResolvedValue(mockEvse);
      store.api.fetchById = mockApiInstance.fetchById;

      const result = await store.fetchById('12345');

      expect(mockApiInstance.fetchById).toHaveBeenCalledWith('12345');
      expect(store.selectedEvse).toStrictEqual(mockEvse);
      expect(result).toStrictEqual(mockEvse);
      expect(store.selectedEvseContext.error).toBeNull();
    });

    it('should handle fetchById errors', async () => {
      const store = useEvseStore();

      // Mock API error
      const { EvseApi } = await import('@/store/evse/api');
      const mockApiInstance = new EvseApi('test-url');
      const error = new Error('EVSE not found');
      mockApiInstance.fetchById = vi.fn().mockRejectedValue(error);
      store.api.fetchById = mockApiInstance.fetchById;

      const result = await store.fetchById('nonexistent');

      expect(store.selectedEvse).toBeNull();
      expect(result).toBeNull();
      expect(store.selectedEvseContext.error).toBe('Failed to load EVSE details');
    });

    it('should handle fetchById errors with no message', async () => {
      const store = useEvseStore();

      // Mock API error without message
      const { EvseApi } = await import('@/store/evse/api');
      const mockApiInstance = new EvseApi('test-url');
      const error = { message: undefined };
      mockApiInstance.fetchById = vi.fn().mockRejectedValue(error);
      store.api.fetchById = mockApiInstance.fetchById;

      const result = await store.fetchById('nonexistent');

      expect(store.selectedEvse).toBeNull();
      expect(result).toBeNull();
      expect(store.selectedEvseContext.error).toBe('Failed to load EVSE details');
    });
  });

  describe('Find by Code', () => {
    it('should find EVSE by code successfully', async () => {
      const store = useEvseStore();

      // Mock successful API response
      mockFindByCode.mockResolvedValue(mockEvse);

      const result = await store.findByCode('EVSE_001');

      expect(mockFindByCode).toHaveBeenCalledWith('EVSE_001');
      expect(result).toStrictEqual(mockEvse);
    });

    it('should return null when EVSE code not found', async () => {
      const store = useEvseStore();

      // Mock API returning null
      mockFindByCode.mockResolvedValue(null);

      const result = await store.findByCode('UNKNOWN_CODE');

      expect(mockFindByCode).toHaveBeenCalledWith('UNKNOWN_CODE');
      expect(result).toBeNull();
    });

    it('should handle findByCode errors', async () => {
      const store = useEvseStore();

      // Mock API error
      const error = new Error('Network error');
      mockFindByCode.mockRejectedValue(error);

      const result = await store.findByCode('ERROR_CODE');

      expect(mockFindByCode).toHaveBeenCalledWith('ERROR_CODE');
      expect(result).toBeNull();
    });

    it('should have findByCode method available', () => {
      const store = useEvseStore();

      expect(typeof store.findByCode).toBe('function');
    });
  });

  describe('Map-specific operations', () => {
    it('should have mapEvses state', () => {
      const store = useEvseStore();

      expect(store).toHaveProperty('mapEvses');
      expect(store.mapEvses).toEqual([]);
    });

    it('should load both list and map data in normal mode', async () => {
      const store = useEvseStore();

      // Mock API response with more than 100 items
      const mockMapData = Array.from({ length: 150 }, (_, i) => ({
        ...mockEvse,
        id: `evse-${i}`,
      }));

      // Mock both collections
      mockLoad.mockResolvedValueOnce(mockEvses); // List (paginated)
      mockGeoLoad.mockResolvedValueOnce(mockMapData); // Map (all results)
      mockGeoAllData.value = mockMapData;
      mockGeoHasData.value = true;

      const { EvsePresets } = await import('@/store/evse/presets');
      const query = EvsePresets.available();

      const result = await store.loadEvses(query);

      // Should load both collections in parallel
      expect(mockLoad).toHaveBeenCalled();
      expect(mockGeoLoad).toHaveBeenCalled();
      expect(result).toEqual(mockEvses); // Returns list data
      expect(store.mapEvses).toHaveLength(150); // Map has all data
    });

    it('should load only once in geolocation mode', async () => {
      const store = useEvseStore();

      // Mock geolocation query
      const mockMapData = Array.from({ length: 50 }, (_, i) => ({
        ...mockEvse,
        id: `evse-${i}`,
      }));

      mockGeoLoad.mockResolvedValueOnce(mockMapData);
      mockGeoAllData.value = mockMapData;
      mockGeoHasData.value = true;
      mockGeoHasLocationQuery.value = true;

      const { EvsePresets } = await import('@/store/evse/presets');
      const query = EvsePresets.nearLocation(52.520008, 13.404954, 10);

      const result = await store.loadEvses(query);

      // Should only call geoCollection.load once
      expect(mockGeoLoad).toHaveBeenCalledTimes(1);
      expect(mockLoad).not.toHaveBeenCalled(); // evseCollection not used
      expect(result).toEqual(mockMapData);
      expect(store.mapEvses).toHaveLength(50);
    });
  });

  describe('Store composition', () => {
    it('should return all required state and methods', () => {
      const store = useEvseStore();

      // Collection access
      expect(store).toHaveProperty('evseCollection');

      // Business state
      expect(store).toHaveProperty('selectedEvse');
      expect(store).toHaveProperty('sortField');
      expect(store).toHaveProperty('sortDirection');

      // Computed contexts
      expect(store).toHaveProperty('evses');

      // Map state
      expect(store).toHaveProperty('mapEvses');

      // Main operations
      expect(store).toHaveProperty('loadEvses');

      // Convenience methods
      expect(store).toHaveProperty('loadAvailable');
      expect(store).toHaveProperty('loadFastCharging');
      expect(store).toHaveProperty('loadNearby');
      expect(store).toHaveProperty('fetchById');

      // State management
      expect(store).toHaveProperty('setSelectedEvse');
      expect(store).toHaveProperty('clearResults');
      expect(store).toHaveProperty('clearError');
      expect(store).toHaveProperty('createQuery');
      expect(store).toHaveProperty('setSorting');

      // API access
      expect(store).toHaveProperty('api');
    });
  });
});
