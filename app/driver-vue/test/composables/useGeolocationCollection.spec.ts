// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GeoEntity, GeoLocation } from '@/composables/useGeolocationCollection';
import { useGeolocationCollection } from '@/composables/useGeolocationCollection';

// Mock isWithinRadius utility
vi.mock('@/store/utils/geo', () => ({
  isWithinRadius: vi.fn(
    (lat1: number, lon1: number, lat2: number, lon2: number, radius: number) => {
      // Simple mock: check if coordinates are within a square box
      const latDiff = Math.abs(lat1 - lat2);
      const lonDiff = Math.abs(lon1 - lon2);
      const maxDiff = radius / 111; // Rough conversion: 1 degree ≈ 111 km
      return latDiff <= maxDiff && lonDiff <= maxDiff;
    },
  ),
}));

// Test entity type
interface TestEntity extends GeoEntity {
  id: string;
  name: string;
  location?: {
    coordinates?: {
      latitude?: string | number;
      longitude?: string | number;
    };
    city?: string;
  };
}

// Mock query type
interface TestQuery {
  getLocation?: () => GeoLocation | undefined;
  getOrderBy?: () => string | undefined;
  getPage?: () => number;
  getPageSize?: () => number;
}

describe('useGeolocationCollection', () => {
  let mockFetcher: ReturnType<typeof vi.fn>;
  let mockEntities: TestEntity[];

  beforeEach(() => {
    mockEntities = [
      {
        id: '1',
        name: 'Entity A',
        location: {
          coordinates: { latitude: '52.520008', longitude: '13.404954' },
          city: 'Berlin',
        },
      },
      {
        id: '2',
        name: 'Entity B',
        location: {
          coordinates: { latitude: '48.856614', longitude: '2.352222' },
          city: 'Paris',
        },
      },
      {
        id: '3',
        name: 'Entity C',
        location: {
          coordinates: { latitude: '51.507351', longitude: '-0.127758' },
          city: 'London',
        },
      },
      {
        id: '4',
        name: 'Entity D',
        // No coordinates
      },
      {
        id: '5',
        name: 'Entity E',
        location: {
          coordinates: { latitude: 'invalid', longitude: 'invalid' },
          city: 'Invalid',
        },
      },
    ];

    mockFetcher = vi.fn().mockResolvedValue(mockEntities);
  });

  describe('Initial state', () => {
    it('should initialize with empty state', () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      expect(collection.data.value).toEqual([]);
      expect(collection.allData.value).toEqual([]);
      expect(collection.total.value).toBe(0);
      expect(collection.currentPage.value).toBe(1);
      expect(collection.pageSize.value).toBe(100);
      expect(collection.loading.value).toBe(false);
      expect(collection.error.value).toBeNull();
      expect(collection.hasData.value).toBe(false);
      expect(collection.isEmpty.value).toBe(true);
      expect(collection.hasMorePages.value).toBe(false);
      expect(collection.hasLocationQuery.value).toBe(false);
    });
  });

  describe('load() without geolocation', () => {
    it('should load all data without filtering', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      const result = await collection.load({ query });

      expect(mockFetcher).toHaveBeenCalledWith(query);
      expect(result).toHaveLength(5);
      expect(collection.data.value).toHaveLength(5);
      expect(collection.allData.value).toHaveLength(5);
      expect(collection.total.value).toBe(5);
      expect(collection.hasLocationQuery.value).toBe(false);
    });

    it('should apply pagination', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 2,
      };

      await collection.load({ query });

      expect(collection.data.value).toHaveLength(2);
      expect(collection.allData.value).toHaveLength(5);
      expect(collection.total.value).toBe(5);
      expect(collection.currentPage.value).toBe(1);
      expect(collection.pageSize.value).toBe(2);
      expect(collection.hasMorePages.value).toBe(true);
    });

    it('should apply sorting', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getOrderBy: () => 'name desc',
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      expect(collection.data.value[0].name).toBe('Entity E');
      expect(collection.data.value[4].name).toBe('Entity A');
    });
  });

  describe('load() with geolocation', () => {
    it('should filter by location radius', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => ({ lat: 52.520008, lon: 13.404954, radius: 10 }),
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      // Only Entity A should be within radius (Berlin coordinates)
      expect(collection.allData.value.length).toBeGreaterThan(0);
      expect(collection.hasLocationQuery.value).toBe(true);
    });

    it('should exclude entities without coordinates', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => ({ lat: 52.520008, lon: 13.404954, radius: 1000 }),
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      // Entity D (no coordinates) and Entity E (invalid coordinates) should be excluded
      const hasEntityD = collection.allData.value.some((e) => e.id === '4');
      const hasEntityE = collection.allData.value.some((e) => e.id === '5');

      expect(hasEntityD).toBe(false);
      expect(hasEntityE).toBe(false);
    });

    it('should apply sorting after filtering', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => ({ lat: 50, lon: 10, radius: 1000 }),
        getOrderBy: () => 'name asc',
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      // Check that results are sorted
      const names = collection.allData.value.map((e) => e.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('Sorting', () => {
    it('should sort by nested field', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getOrderBy: () => 'location/city asc',
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      // Entities without city should be at the end
      const cities = collection.data.value.map((e) => e.location?.city).filter(Boolean);
      const sortedCities = [...cities].sort();
      expect(cities).toEqual(sortedCities);
    });

    it('should handle null values in sorting', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getOrderBy: () => 'location/city desc',
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      // Should not throw error
      expect(collection.data.value).toHaveLength(5);
    });

    it('should sort numbers correctly', async () => {
      const numericEntities: TestEntity[] = [
        { id: '1', name: 'Item 10', location: {} },
        { id: '2', name: 'Item 2', location: {} },
        { id: '3', name: 'Item 1', location: {} },
      ];

      const numericFetcher = vi.fn().mockResolvedValue(numericEntities);
      const collection = useGeolocationCollection<TestEntity, TestQuery>(numericFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getOrderBy: () => 'name asc',
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      // String comparison: "Item 1", "Item 10", "Item 2"
      expect(collection.data.value[0].name).toBe('Item 1');
      expect(collection.data.value[1].name).toBe('Item 10');
      expect(collection.data.value[2].name).toBe('Item 2');
    });
  });

  describe('loadMore()', () => {
    it('should load next page', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 2,
      };

      await collection.load({ query });
      expect(collection.data.value).toHaveLength(2);

      const moreData = await collection.loadMore();

      expect(moreData).toHaveLength(2);
      expect(collection.data.value).toHaveLength(4);
      expect(collection.currentPage.value).toBe(2);
    });

    it('should not load more if no more pages', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      const moreData = await collection.loadMore();

      expect(moreData).toEqual([]);
      expect(collection.data.value).toHaveLength(5);
    });

    it('should not load more if already loading', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 2,
      };

      await collection.load({ query });

      collection.setLoading(true);
      const moreData = await collection.loadMore();

      expect(moreData).toEqual([]);
      collection.setLoading(false);
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors', async () => {
      const errorFetcher = vi.fn().mockRejectedValue(new Error('Network error'));
      const collection = useGeolocationCollection<TestEntity, TestQuery>(errorFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      const result = await collection.load({ query });

      expect(result).toEqual([]);
      expect(collection.data.value).toEqual([]);
      expect(collection.allData.value).toEqual([]);
      expect(collection.error.value).toBe('Network error');
      expect(collection.loading.value).toBe(false);
    });

    it('should handle errors without message', async () => {
      const errorFetcher = vi.fn().mockRejectedValue({});
      const collection = useGeolocationCollection<TestEntity, TestQuery>(errorFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      expect(collection.error.value).toBe('Failed to load geolocation data');
    });
  });

  describe('Utility methods', () => {
    it('should clear all data', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => ({ lat: 52.520008, lon: 13.404954, radius: 100 }),
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });
      // With a large radius, at least Entity A (Berlin) should be included
      expect(collection.allData.value.length).toBeGreaterThanOrEqual(1);
      expect(collection.hasLocationQuery.value).toBe(true);

      collection.clear();

      expect(collection.data.value).toEqual([]);
      expect(collection.allData.value).toEqual([]);
      expect(collection.total.value).toBe(0);
      expect(collection.currentPage.value).toBe(1);
      expect(collection.error.value).toBeNull();
      expect(collection.hasLocationQuery.value).toBe(false);
    });

    it('should clear only error', async () => {
      const errorFetcher = vi.fn().mockRejectedValue(new Error('Test error'));
      const collection = useGeolocationCollection<TestEntity, TestQuery>(errorFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });
      expect(collection.error.value).toBeTruthy();

      collection.clearError();

      expect(collection.error.value).toBeNull();
      expect(collection.data.value).toEqual([]);
    });

    it('should set data manually', () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const newData = [mockEntities[0], mockEntities[1]];
      collection.setData(newData, 2);

      expect(collection.data.value).toEqual(newData);
      expect(collection.total.value).toBe(2);
      expect(collection.currentPage.value).toBe(1);
    });

    it('should set data without resetting page', () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      collection.setData([], 0);
      collection.setData([mockEntities[0]], 1, false);

      expect(collection.currentPage.value).toBe(1);
    });

    it('should set loading state', () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      collection.setLoading(true);
      expect(collection.loading.value).toBe(true);

      collection.setLoading(false);
      expect(collection.loading.value).toBe(false);
    });

    it('should set error state', () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      collection.setError('Custom error');
      expect(collection.error.value).toBe('Custom error');

      collection.setError(null);
      expect(collection.error.value).toBeNull();
    });
  });

  describe('Computed properties', () => {
    it('should compute hasMorePages correctly', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 2,
      };

      await collection.load({ query });

      expect(collection.hasMorePages.value).toBe(true);

      await collection.loadMore();
      await collection.loadMore();

      expect(collection.hasMorePages.value).toBe(false);
    });

    it('should compute isEmpty correctly', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      expect(collection.isEmpty.value).toBe(true);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      expect(collection.isEmpty.value).toBe(false);
    });

    it('should compute hasData correctly', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      expect(collection.hasData.value).toBe(false);

      const query: TestQuery = {
        getLocation: () => undefined,
        getPage: () => 1,
        getPageSize: () => 10,
      };

      await collection.load({ query });

      expect(collection.hasData.value).toBe(true);
    });
  });

  describe('Default values', () => {
    it('should use default page size when not provided', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
      };

      await collection.load({ query });

      expect(collection.pageSize.value).toBe(100);
    });

    it('should use page 1 when not provided', async () => {
      const collection = useGeolocationCollection<TestEntity, TestQuery>(mockFetcher);

      const query: TestQuery = {
        getLocation: () => undefined,
      };

      await collection.load({ query });

      expect(collection.currentPage.value).toBe(1);
    });
  });
});
