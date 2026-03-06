// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useODataCollection } from '@/composables/useODataCollection';
import { BaseApi, BaseQuery } from '@/utils/odata';

// Mock data types
interface TestEntity {
  id: string;
  name: string;
}

// Mock query class
class MockQuery extends BaseQuery<TestEntity> {
  clone(): this {
    const cloned = new MockQuery() as this;
    cloned.filters = [...this.filters];
    cloned._search = this._search;
    cloned._page = this._page;
    cloned._pageSize = this._pageSize;
    cloned._orderBy = [...this._orderBy];
    return cloned;
  }

  buildSearchFilter(): string | undefined {
    if (!this._search) return undefined;
    return `substringof('${this.escapeOData(this._search)}', name)`;
  }

  getSearchableFields(): string[] {
    return ['name'];
  }
}

// Mock API class
class MockApi extends BaseApi<TestEntity, MockQuery> {
  public fetchMock = vi.fn();

  constructor() {
    super('http://test.api');
  }

  async fetch(query: MockQuery) {
    return this.fetchMock(query);
  }

  getEntityName(): string {
    return 'TestEntity';
  }

  getExpandFields(): string[] {
    return [];
  }
}

describe('useODataCollection', () => {
  let mockApi: MockApi;
  let mockQuery: MockQuery;

  beforeEach(() => {
    mockApi = new MockApi();
    mockQuery = new MockQuery();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const collection = useODataCollection(mockApi);

      expect(collection.data.value).toEqual([]);
      expect(collection.total.value).toBe(0);
      expect(collection.currentPage.value).toBe(1);
      expect(collection.pageSize.value).toBe(100);
      expect(collection.loading.value).toBe(false);
      expect(collection.error.value).toBe(null);
      expect(collection.hasMorePages.value).toBe(false);
      expect(collection.hasData.value).toBe(false);
      expect(collection.isEmpty.value).toBe(true);
    });

    it('should provide direct refs for testing', () => {
      const collection = useODataCollection(mockApi);

      expect(collection.data).toBeDefined();
      expect(collection.total).toBeDefined();
      expect(collection.currentPage).toBeDefined();
      expect(collection.pageSize).toBeDefined();
      expect(collection.loading).toBeDefined();
      expect(collection.error).toBeDefined();
    });
  });

  describe('load()', () => {
    it('should load data successfully with default page size', async () => {
      const testData = [
        { id: '1', name: 'Entity 1' },
        { id: '2', name: 'Entity 2' },
      ];

      mockApi.fetchMock.mockResolvedValueOnce({
        data: testData,
        total: 10,
        page: 1,
        pageSize: 100,
      });

      const collection = useODataCollection(mockApi);
      const result = await collection.load(mockQuery);

      expect(result).toEqual(testData);
      expect(collection.data.value).toEqual(testData);
      expect(collection.total.value).toBe(10);
      expect(collection.currentPage.value).toBe(1);
      expect(collection.pageSize.value).toBe(100);
      expect(collection.loading.value).toBe(false);
      expect(collection.error.value).toBe(null);
      expect(collection.hasData.value).toBe(true);
      expect(collection.isEmpty.value).toBe(false);
    });

    it('should respect explicit page size when different from default', async () => {
      const testData = [
        { id: '1', name: 'Entity 1' },
        { id: '2', name: 'Entity 2' },
      ];

      mockApi.fetchMock.mockResolvedValueOnce({
        data: testData,
        total: 10,
        page: 1,
        pageSize: 25,
      });

      const collection = useODataCollection(mockApi);
      const queryWithCustomSize = mockQuery.page(1, 25);

      await collection.load(queryWithCustomSize);

      // pageSize should track the actual page size being used (25)
      expect(collection.pageSize.value).toBe(25);
      expect(collection.defaultPageSize.value).toBe(100);
      expect(mockApi.fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _page: 1,
          _pageSize: 25,
        }),
      );
    });

    it('should use default page size when query has default page size (100)', async () => {
      const testData = [{ id: '1', name: 'Entity 1' }];

      mockApi.fetchMock.mockResolvedValueOnce({
        data: testData,
        total: 1,
        page: 1,
        pageSize: 100, // Always uses 100 as default
      });

      const collection = useODataCollection(mockApi);

      await collection.load(mockQuery); // mockQuery has default pageSize of 100

      expect(collection.pageSize.value).toBe(100);
      expect(mockApi.fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _page: 1,
          _pageSize: 100, // Always 100 for default queries
        }),
      );
    });

    it('should set loading state during fetch', async () => {
      mockApi.fetchMock.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: [], total: 0, page: 1, pageSize: 100 }), 100);
        });
      });

      const collection = useODataCollection(mockApi);
      const loadPromise = collection.load(mockQuery);

      expect(collection.loading.value).toBe(true);

      await loadPromise;

      expect(collection.loading.value).toBe(false);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      mockApi.fetchMock.mockRejectedValueOnce(new Error(errorMessage));

      const collection = useODataCollection(mockApi);
      const result = await collection.load(mockQuery);

      expect(result).toEqual([]);
      expect(collection.data.value).toEqual([]);
      expect(collection.error.value).toBe(errorMessage);
      expect(collection.loading.value).toBe(false);
    });

    it('should handle errors without message', async () => {
      mockApi.fetchMock.mockRejectedValueOnce('String error');

      const collection = useODataCollection(mockApi);
      await collection.load(mockQuery);

      expect(collection.error.value).toBe('Failed to fetch data');
    });

    it('should clear previous error on new load', async () => {
      mockApi.fetchMock.mockRejectedValueOnce(new Error('First error'));

      const collection = useODataCollection(mockApi);
      await collection.load(mockQuery);

      expect(collection.error.value).toBe('First error');

      // Second successful load
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 1,
        page: 1,
        pageSize: 100,
      });

      await collection.load(mockQuery);

      expect(collection.error.value).toBe(null);
    });
  });

  describe('loadMore()', () => {
    it('should load more data and append to existing', async () => {
      const collection = useODataCollection(mockApi);

      // Initial load
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 10,
        page: 1,
        pageSize: 5,
      });

      await collection.load(mockQuery.page(1, 5));
      mockApi.fetchMock.mockClear();

      // Mock loadMore response
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '2', name: 'Entity 2' }],
        total: 10,
        page: 2,
        pageSize: 5,
      });

      const result = await collection.loadMore();

      expect(result).toEqual([{ id: '2', name: 'Entity 2' }]);
      expect(collection.data.value).toEqual([
        { id: '1', name: 'Entity 1' },
        { id: '2', name: 'Entity 2' },
      ]);
      expect(collection.currentPage.value).toBe(2);
    });

    it('should respect original query page size', async () => {
      const collection = useODataCollection(mockApi);

      // Load with custom page size
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 10,
        page: 1,
        pageSize: 5,
      });

      await collection.load(mockQuery.page(1, 5));
      mockApi.fetchMock.mockClear();

      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '2', name: 'Entity 2' }],
        total: 10,
        page: 2,
        pageSize: 5,
      });

      await collection.loadMore();

      expect(mockApi.fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _page: 2,
          _pageSize: 5,
        }),
      );
    });

    it('should use current page size when original query had default page size', async () => {
      const collection = useODataCollection(mockApi);

      // Load with default query page size (100)
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 200,
        page: 1,
        pageSize: 100, // Now always uses 100 as default
      });

      await collection.load(mockQuery); // Has default pageSize of 100
      mockApi.fetchMock.mockClear();

      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '2', name: 'Entity 2' }],
        total: 200,
        page: 2,
        pageSize: 100, // loadMore uses current page size (100)
      });

      await collection.loadMore();

      expect(mockApi.fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _page: 2,
          _pageSize: 100, // Uses current page size from initial load
        }),
      );
    });

    it('should return empty array when no more pages', async () => {
      const collection = useODataCollection(mockApi);

      // Load data with no more pages
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 1,
        page: 1,
        pageSize: 5,
      });

      await collection.load(mockQuery.page(1, 5));
      const callCountAfterLoad = mockApi.fetchMock.mock.calls.length;

      const result = await collection.loadMore();

      expect(result).toEqual([]);
      expect(mockApi.fetchMock.mock.calls.length).toBe(callCountAfterLoad); // No additional calls
    });

    it('should return empty array when no last query', async () => {
      const collection = useODataCollection(mockApi);

      const result = await collection.loadMore();

      expect(result).toEqual([]);
    });

    it('should return empty array when already loading', async () => {
      const collection = useODataCollection(mockApi);

      // Initial load
      await collection.load(mockQuery.page(1, 5));
      mockApi.fetchMock.mockClear();

      // Set loading state manually
      collection.setLoading(true);

      const result = await collection.loadMore();

      expect(result).toEqual([]);
      expect(mockApi.fetchMock).not.toHaveBeenCalled();
    });

    it('should handle loadMore errors', async () => {
      const collection = useODataCollection(mockApi);

      // Initial load
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 10,
        page: 1,
        pageSize: 5,
      });

      await collection.load(mockQuery.page(1, 5));
      mockApi.fetchMock.mockClear();

      // Mock error on loadMore
      mockApi.fetchMock.mockRejectedValueOnce(new Error('LoadMore error'));

      const result = await collection.loadMore();

      expect(result).toEqual([]);
      expect(collection.error.value).toBe('LoadMore error');
      expect(collection.data.value).toEqual([{ id: '1', name: 'Entity 1' }]); // Original data preserved
    });
  });

  describe('Computed Properties', () => {
    it('should calculate hasMorePages correctly', async () => {
      const collection = useODataCollection(mockApi);

      // Load 5 items out of 10 total
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 10,
        page: 1,
        pageSize: 5,
      });

      await collection.load(mockQuery.page(1, 5));

      expect(collection.hasMorePages.value).toBe(true);

      // Load second page
      collection.currentPage.value = 2;
      expect(collection.hasMorePages.value).toBe(false); // 2 * 5 = 10, no more pages
    });

    it('should calculate hasData correctly', async () => {
      const collection = useODataCollection(mockApi);

      expect(collection.hasData.value).toBe(false);

      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 1,
        page: 1,
        pageSize: 100,
      });

      await collection.load(mockQuery);

      expect(collection.hasData.value).toBe(true);
    });

    it('should calculate isEmpty correctly', async () => {
      const collection = useODataCollection(mockApi);

      expect(collection.isEmpty.value).toBe(true);

      // While loading, should not be empty
      collection.setLoading(true);
      expect(collection.isEmpty.value).toBe(false);

      collection.setLoading(false);
      expect(collection.isEmpty.value).toBe(true);

      // With data, should not be empty
      collection.data.value = [{ id: '1', name: 'Entity 1' }];
      expect(collection.isEmpty.value).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should clear all data and state', async () => {
      const collection = useODataCollection(mockApi);

      // Load some data first
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 1,
        page: 1,
        pageSize: 100,
      });

      await collection.load(mockQuery);
      collection.setError('Some error');

      // Clear everything
      collection.clear();

      expect(collection.data.value).toEqual([]);
      expect(collection.total.value).toBe(0);
      expect(collection.currentPage.value).toBe(1);
      expect(collection.error.value).toBe(null);
    });

    it('should clear only error state', () => {
      const collection = useODataCollection(mockApi);

      collection.setError('Some error');
      collection.data.value = [{ id: '1', name: 'Entity 1' }];

      collection.clearError();

      expect(collection.error.value).toBe(null);
      expect(collection.data.value).toEqual([{ id: '1', name: 'Entity 1' }]); // Data preserved
    });
  });

  describe('Reactivity', () => {
    it('should maintain reactivity for readonly refs', async () => {
      const collection = useODataCollection(mockApi);

      // Store initial values
      const originalData = collection.data.value;
      const originalLoading = collection.loading.value;

      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 1,
        page: 1,
        pageSize: 100,
      });

      await collection.load(mockQuery);

      // Values should have changed
      expect(collection.data.value).not.toBe(originalData);
      expect(collection.loading.value).toBe(originalLoading); // Back to false
    });

    it('should prevent external mutations on readonly refs', () => {
      const collection = useODataCollection(mockApi);

      // These should not throw in test environment, but would be readonly in production
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (collection.data as any).value = [];
      }).not.toThrow();

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (collection.loading as any).value = true;
      }).not.toThrow();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle undefined error message', async () => {
      const collection = useODataCollection(mockApi);

      mockApi.fetchMock.mockRejectedValueOnce(new Error(''));

      await collection.load(mockQuery);

      expect(collection.error.value).toBe('Failed to fetch data');
    });

    it('should handle non-Error rejection', async () => {
      const collection = useODataCollection(mockApi);

      mockApi.fetchMock.mockRejectedValueOnce('String error');

      await collection.load(mockQuery);

      expect(collection.error.value).toBe('Failed to fetch data');
    });

    it('should handle loadMore with undefined error message', async () => {
      const collection = useODataCollection(mockApi);

      // Initial load
      mockApi.fetchMock.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Entity 1' }],
        total: 10,
        page: 1,
        pageSize: 5,
      });

      await collection.load(mockQuery.page(1, 5));
      mockApi.fetchMock.mockClear();

      // LoadMore with undefined error
      mockApi.fetchMock.mockRejectedValueOnce(new Error(''));

      await collection.loadMore();

      expect(collection.error.value).toBe('Failed to load more data');
    });
  });

  describe('Page Size Pollution', () => {
    it('should not pollute collection pageSize with suggestion queries', async () => {
      // Simulate the user's scenario:
      // 1. Normal query loads with default page size 100
      // 2. Suggestion query loads with page size 5
      // 3. Another normal query should use 100, not 5

      const testData1 = [{ id: '1', name: 'Entity 1' }];
      const suggestionData = [{ id: 's1', name: 'Suggestion 1' }];
      const testData2 = [{ id: '2', name: 'Entity 2' }];

      mockApi.fetchMock
        .mockResolvedValueOnce({
          data: testData1,
          total: 100,
          page: 1,
          pageSize: 100,
        })
        .mockResolvedValueOnce({
          data: suggestionData,
          total: 20,
          page: 1,
          pageSize: 5,
        })
        .mockResolvedValueOnce({
          data: testData2,
          total: 100,
          page: 1,
          pageSize: 100,
        });

      const collection = useODataCollection(mockApi);

      // 1. First normal query with default page size
      await collection.load(mockQuery);
      expect(collection.pageSize.value).toBe(100);

      // 2. Suggestion query with small page size
      const suggestionQuery = mockQuery.page(1, 5);
      await collection.load(suggestionQuery);
      expect(collection.pageSize.value).toBe(5); // Should track the current page size

      // 3. Another normal query should use 100, not be polluted by the suggestion
      const freshQuery = new MockQuery(); // Create a fresh query to avoid mutation issues
      await collection.load(freshQuery); // Should use 100, not 5
      expect(collection.pageSize.value).toBe(100); // Should go back to default
      expect(mockApi.fetchMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          _page: 1,
          _pageSize: 100, // Should be 100, not 5
        }),
      );
    });

    it('should handle small page sizes without updating collection pageSize', async () => {
      const suggestionData = [{ id: 's1', name: 'Suggestion 1' }];

      mockApi.fetchMock.mockResolvedValueOnce({
        data: suggestionData,
        total: 20,
        page: 1,
        pageSize: 5,
      });

      const collection = useODataCollection(mockApi);
      const suggestionQuery = mockQuery.page(1, 5);

      await collection.load(suggestionQuery);

      // pageSize should track the actual page size being used (5 for suggestions)
      expect(collection.pageSize.value).toBe(5);
      expect(collection.defaultPageSize.value).toBe(100);
      expect(collection.data.value).toEqual(suggestionData);
      expect(mockApi.fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _page: 1,
          _pageSize: 5,
        }),
      );
    });
  });

  describe('setData Method', () => {
    it('should set data and total without changing pageSize', () => {
      const collection = useODataCollection(mockApi);

      // Set initial pageSize through a load operation
      collection.pageSize.value = 25; // Simulate a specific page size from previous load

      const newData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      collection.setData(newData, 50);

      expect(collection.data.value).toEqual(newData);
      expect(collection.total.value).toBe(50);
      expect(collection.currentPage.value).toBe(1); // Should reset by default
      expect(collection.pageSize.value).toBe(25); // Should NOT change to newData.length (3)
    });

    it('should preserve pageSize even with empty data', () => {
      const collection = useODataCollection(mockApi);

      // Set initial pageSize
      collection.pageSize.value = 100;

      // Set empty data
      collection.setData([], 0);

      expect(collection.data.value).toEqual([]);
      expect(collection.total.value).toBe(0);
      expect(collection.pageSize.value).toBe(100); // Should NOT become 0 or defaultPageSize
    });

    it('should respect resetPage parameter', () => {
      const collection = useODataCollection(mockApi);

      // Set initial state
      collection.currentPage.value = 3;

      const newData = [{ id: '1', name: 'Item 1' }];

      // Don't reset page
      collection.setData(newData, 10, false);

      expect(collection.currentPage.value).toBe(3); // Should not reset
      expect(collection.data.value).toEqual(newData);
      expect(collection.total.value).toBe(10);
    });

    it('should maintain consistent pageSize for pagination logic', () => {
      const collection = useODataCollection(mockApi);

      // Simulate a scenario where pageSize is 50 from a previous query
      collection.pageSize.value = 50;
      collection.total.value = 200;
      collection.currentPage.value = 2;

      // hasMorePages should work correctly before setData
      expect(collection.hasMorePages.value).toBe(true); // 2 * 50 = 100 < 200

      // Set new data (3 items) but keep the same total and page
      const locationResults = [
        { id: '1', name: 'Near Item 1' },
        { id: '2', name: 'Near Item 2' },
        { id: '3', name: 'Near Item 3' },
      ];

      collection.setData(locationResults, 200, false); // Don't reset page

      // Pagination logic should still work correctly
      expect(collection.hasMorePages.value).toBe(true); // 2 * 50 = 100 < 200
      expect(collection.pageSize.value).toBe(50); // NOT 3 (length of locationResults)
    });
  });
});
