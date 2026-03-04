// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBadgesStore } from '@/store/badges';
import type { Badge } from '@/store/badges/types';

// Simple mock data
const mockBadges: Badge[] = [
  {
    authenticationId: 'auth-001',
    visualBadgeId: 'BADGE-001',
    description: 'Test Badge 1',
    firstName: 'John',
    lastName: 'Doe',
    licensePlate: 'ABC123',
    active: true,
  },
  {
    authenticationId: 'auth-002',
    visualBadgeId: 'BADGE-002',
    description: 'Test Badge 2',
    firstName: 'Jane',
    lastName: 'Smith',
    licensePlate: 'XYZ789',
    active: false,
  },
];

// Global mock functions
const mockLoad = vi.fn().mockResolvedValue([]);
const mockLoadMore = vi.fn().mockResolvedValue([]);
const mockClear = vi.fn();
const mockClearError = vi.fn();

// Mock useODataCollection
vi.mock('@/composables/useODataCollection', () => ({
  useODataCollection: vi.fn(() => ({
    data: { value: [] },
    loading: { value: false },
    error: { value: null },
    hasMorePages: { value: false },
    isEmpty: { value: true },
    total: { value: 0 },
    load: mockLoad,
    loadMore: mockLoadMore,
    clear: mockClear,
    clearError: mockClearError,
  })),
}));

// Mock BadgeApi
vi.mock('@/store/badges/api', () => ({
  BadgeApi: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    fetchById: vi.fn().mockResolvedValue(null),
  })),
}));

// Mock presets
vi.mock('@/store/badges/presets', () => ({
  BadgePresets: {
    defaultSorted: vi.fn().mockReturnValue({}),
    active: vi.fn().mockReturnValue({}),
    inactive: vi.fn().mockReturnValue({}),
    withLicensePlate: vi.fn().mockReturnValue({}),
    activeWithLicensePlate: vi.fn().mockReturnValue({}),
    byUser: vi.fn().mockReturnValue({}),
  },
}));

// Mock query builder
vi.mock('@/store/badges/query-builder', () => ({
  BadgeQuery: vi.fn().mockImplementation(() => ({
    build: vi.fn().mockReturnValue({}),
    setOrderBy: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    search: vi.fn().mockReturnThis(),
    user: vi.fn().mockReturnThis(),
    licensePlate: vi.fn().mockReturnThis(),
  })),
}));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('Badges Store', () => {
  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const store = useBadgesStore();

      // New structure uses computed properties from collections
      expect(store.badges.data).toEqual([]);
      expect(store.badges.loading).toBe(false);
      expect(store.badges.error).toBeNull();
      expect(store.selectedBadge).toBeNull();
    });

    it('should have collections initialized', () => {
      const store = useBadgesStore();

      // Verify collection exists
      expect(store).toHaveProperty('badgeCollection');
    });
  });

  describe('Load operations', () => {
    it('should load badges', async () => {
      const store = useBadgesStore();

      mockLoad.mockResolvedValue(mockBadges);

      const result = await store.loadBadges();

      expect(mockLoad).toHaveBeenCalled();
      expect(result).toEqual(mockBadges);
    });

    it('should handle load errors gracefully', async () => {
      const store = useBadgesStore();

      mockLoad.mockRejectedValue(new Error('Network error'));

      await expect(store.loadBadges()).rejects.toThrow('Network error');
    });
  });

  describe('Convenience methods', () => {
    it('should have convenience preset methods', () => {
      const store = useBadgesStore();

      // Test that all convenience methods are available
      expect(typeof store.loadAll).toBe('function');
      expect(typeof store.loadActive).toBe('function');
      expect(typeof store.loadInactive).toBe('function');
      expect(typeof store.findWithLicensePlate).toBe('function');
      expect(typeof store.findActiveWithLicensePlate).toBe('function');
      expect(typeof store.findByUser).toBe('function');
    });

    it('should call loadBadges for loadAll', async () => {
      const store = useBadgesStore();

      mockLoad.mockResolvedValue(mockBadges);

      await store.loadAll();

      // Verify that the load function was called
      expect(mockLoad).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should support loadMore', async () => {
      const store = useBadgesStore();

      await store.loadMoreBadges();

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('Badge selection', () => {
    it('should set selected badge', () => {
      const store = useBadgesStore();
      const badge = mockBadges[0];

      store.setSelectedBadge(badge);

      expect(store.selectedBadge).toEqual(badge);
    });

    it('should clear selected badge', () => {
      const store = useBadgesStore();

      store.setSelectedBadge(mockBadges[0]);
      store.setSelectedBadge(null);

      expect(store.selectedBadge).toBeNull();
    });
  });

  describe('State management', () => {
    it('should clear results', () => {
      const store = useBadgesStore();

      store.clearResults();

      expect(mockClear).toHaveBeenCalled();
    });

    it('should create query', () => {
      const store = useBadgesStore();

      const query = store.createQuery();

      expect(query).toBeDefined();
    });

    it('should set sorting', () => {
      const store = useBadgesStore();

      store.setSorting('visualBadgeId', 'desc');

      expect(store.sortField).toBe('visualBadgeId');
      expect(store.sortDirection).toBe('desc');
    });
  });

  describe('Fetch by ID', () => {
    it('should fetch badge by ID', async () => {
      const store = useBadgesStore();

      const result = await store.fetchById('1');

      // Should not throw and return a result
      expect(result).toBeDefined();
    });
  });

  describe('Store composition', () => {
    it('should return all required state and methods', () => {
      const store = useBadgesStore();

      // Collection access
      expect(store).toHaveProperty('badgeCollection');

      // Business state
      expect(store).toHaveProperty('selectedBadge');
      expect(store).toHaveProperty('sortField');
      expect(store).toHaveProperty('sortDirection');

      // Computed contexts
      expect(store).toHaveProperty('badges');

      // Main operations
      expect(store).toHaveProperty('loadBadges');

      // Convenience methods
      expect(store).toHaveProperty('loadAll');
      expect(store).toHaveProperty('loadActive');
      expect(store).toHaveProperty('loadInactive');
      expect(store).toHaveProperty('findWithLicensePlate');
      expect(store).toHaveProperty('findActiveWithLicensePlate');
      expect(store).toHaveProperty('findByUser');

      // State management
      expect(store).toHaveProperty('setSelectedBadge');
      expect(store).toHaveProperty('clearResults');
      expect(store).toHaveProperty('clearError');
      expect(store).toHaveProperty('createQuery');
      expect(store).toHaveProperty('setSorting');

      // API access
      expect(store).toHaveProperty('api');
    });
  });
});
