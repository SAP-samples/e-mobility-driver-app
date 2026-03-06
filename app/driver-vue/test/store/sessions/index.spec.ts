// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionsStore } from '@/store/sessions';
import type { Session } from '@/store/sessions/types';

// Simple mock data
const mockSessions: Session[] = [
  {
    id: 1,
    sessionId: 'SES-001',
    timestamp: '2024-01-15T10:00:00Z',
    status: 'InProgress',
    siteName: 'Downtown Station',
    siteAreaName: 'Area A',
    chargingStationName: 'CS-001',
    badgeVisualBadgeId: 'BADGE-123',
    badgeAuthenticationId: 'auth-123',
    totalDuration: 45,
    totalInactivity: 0,
    totalEnergyDelivered: 25.5,
    stateOfCharge: 80,
    cumulatedPrice: 35.75,
    currency: 'EUR',
    emi3Id: 'EMI-001',
    evseCode: 'EVSE-001',
    stop_extraInactivity: 0,
  },
];

// Global mock functions that are accessible
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

// Mock SessionApi
vi.mock('@/store/sessions/api', () => ({
  SessionApi: vi.fn().mockImplementation(() => ({
    find: vi.fn().mockResolvedValue([]),
    startSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn().mockResolvedValue(undefined),
    fetchMonthlyStats: vi.fn().mockResolvedValue({ totalSessions: 0, totalKwh: 0, totalAmount: 0 }),
  })),
}));

// Mock presets
vi.mock('@/store/sessions/presets', () => ({
  SessionPresets: {
    inProgress: vi.fn().mockReturnValue({}),
    completed: vi.fn().mockReturnValue({}),
    recentHistory: vi.fn().mockReturnValue({}),
    byBadge: vi.fn().mockReturnValue({}),
    bySite: vi.fn().mockReturnValue({}),
    byChargingStation: vi.fn().mockReturnValue({}),
    highEnergy: vi.fn().mockReturnValue({}),
    longDuration: vi.fn().mockReturnValue({}),
    expensive: vi.fn().mockReturnValue({}),
    thisMonth: vi.fn().mockReturnValue({}),
    thisWeek: vi.fn().mockReturnValue({}),
  },
}));

// Mock query builder
vi.mock('@/store/sessions/query-builder', () => ({
  SessionQuery: vi.fn().mockImplementation(() => ({
    build: vi.fn().mockReturnValue({}),
    setOrderBy: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    dateRange: vi.fn().mockReturnThis(),
    badge: vi.fn().mockReturnThis(),
    site: vi.fn().mockReturnThis(),
    station: vi.fn().mockReturnThis(),
    energy: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnThis(),
    price: vi.fn().mockReturnThis(),
  })),
}));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('Sessions Store', () => {
  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const store = useSessionsStore();

      // Check that the store has the expected structure
      expect(store).toHaveProperty('sessionHistory');
      expect(store).toHaveProperty('sessionsInProgress');
      expect(store.selectedSession).toBeNull();
      expect(store.monthlyStats).toEqual({
        totalSessions: 0,
        totalKwh: 0,
        totalAmount: 0,
      });
    });

    it('should have collections initialized', () => {
      const store = useSessionsStore();

      // Verify collections exist
      expect(store).toHaveProperty('historyCollection');
      expect(store).toHaveProperty('inProgressCollection');
    });
  });

  describe('Load operations', () => {
    it('should load in-progress sessions', async () => {
      const store = useSessionsStore();

      mockLoad.mockResolvedValue(mockSessions);

      const result = await store.loadInProgressSessions();

      expect(mockLoad).toHaveBeenCalled();
      expect(result).toEqual(mockSessions);
    });

    it('should load session history', async () => {
      const store = useSessionsStore();

      mockLoad.mockResolvedValue(mockSessions);

      const result = await store.loadSessionHistory();

      expect(mockLoad).toHaveBeenCalled();
      expect(result).toEqual(mockSessions);
    });

    it('should handle load errors gracefully', async () => {
      const store = useSessionsStore();

      mockLoad.mockRejectedValue(new Error('Network error'));

      await expect(store.loadInProgressSessions()).rejects.toThrow('Network error');
    });
  });

  describe('Convenience methods', () => {
    it('should have convenience preset methods', () => {
      const store = useSessionsStore();

      // Test that all convenience methods are available
      expect(typeof store.loadInProgress).toBe('function');
      expect(typeof store.loadCompleted).toBe('function');
      expect(typeof store.findRecentHistory).toBe('function');
      expect(typeof store.findByBadge).toBe('function');
      expect(typeof store.findBySite).toBe('function');
      expect(typeof store.findByChargingStation).toBe('function');
      expect(typeof store.findHighEnergy).toBe('function');
      expect(typeof store.findLongDuration).toBe('function');
      expect(typeof store.findExpensive).toBe('function');
    });
  });

  describe('Pagination', () => {
    it('should support loadMore for history', async () => {
      const store = useSessionsStore();

      await store.loadMoreHistory();

      expect(mockLoadMore).toHaveBeenCalled();
    });

    it('should support loadMore for in-progress', async () => {
      const store = useSessionsStore();

      await store.loadMoreInProgress();

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('Session selection', () => {
    it('should set selected session', () => {
      const store = useSessionsStore();
      const session = mockSessions[0];

      store.setSelectedSession(session);

      expect(store.selectedSession).toEqual(session);
    });

    it('should clear selected session', () => {
      const store = useSessionsStore();

      store.setSelectedSession(mockSessions[0]);
      store.setSelectedSession(null);

      expect(store.selectedSession).toBeNull();
    });
  });

  describe('State management', () => {
    it('should clear results', () => {
      const store = useSessionsStore();

      store.clearResults();

      expect(mockClear).toHaveBeenCalled();
    });

    it('should create query', () => {
      const store = useSessionsStore();

      const query = store.createQuery();

      expect(query).toBeDefined();
    });
  });

  describe('Store composition', () => {
    it('should return all required state and methods', () => {
      const store = useSessionsStore();

      // Collection access
      expect(store).toHaveProperty('inProgressCollection');
      expect(store).toHaveProperty('historyCollection');

      // Business state
      expect(store).toHaveProperty('selectedSession');
      expect(store).toHaveProperty('monthlyStats');
      expect(store).toHaveProperty('sortField');
      expect(store).toHaveProperty('sortDirection');

      // Computed contexts
      expect(store).toHaveProperty('sessionsInProgress');
      expect(store).toHaveProperty('sessionHistory');

      // Main operations
      expect(store).toHaveProperty('loadInProgressSessions');
      expect(store).toHaveProperty('loadSessionHistory');

      // API access
      expect(store).toHaveProperty('api');
    });
  });

  describe('Session control operations', () => {
    it('should start session and refresh in-progress sessions', async () => {
      const store = useSessionsStore();

      // Mock the API methods
      const startSessionSpy = vi.spyOn(store.api, 'startSession').mockResolvedValue(undefined);

      // Mock the collection's load method to prevent actual API calls
      const inProgressLoadSpy = vi.spyOn(store.inProgressCollection, 'load').mockResolvedValue([]);

      await store.startSession('EVSE-001');

      expect(startSessionSpy).toHaveBeenCalledWith({ evseId: 'EVSE-001' });
      expect(inProgressLoadSpy).toHaveBeenCalled(); // Should refresh in-progress sessions

      // Restore spies
      startSessionSpy.mockRestore();
      inProgressLoadSpy.mockRestore();
    });

    it('should stop session and refresh sessions', async () => {
      const store = useSessionsStore();

      // Mock the API methods
      const stopSessionSpy = vi.spyOn(store.api, 'stopSession').mockResolvedValue(undefined);

      // Mock the collection's load methods to prevent actual API calls
      const inProgressLoadSpy = vi.spyOn(store.inProgressCollection, 'load').mockResolvedValue([]);
      const historyLoadSpy = vi.spyOn(store.historyCollection, 'load').mockResolvedValue([]);

      await store.stopSession('SES-001');

      expect(stopSessionSpy).toHaveBeenCalledWith({ sessionId: 'SES-001' });
      expect(inProgressLoadSpy).toHaveBeenCalled(); // Should refresh in-progress sessions
      expect(historyLoadSpy).toHaveBeenCalled(); // Should refresh completed sessions (via history)

      // Restore spies
      stopSessionSpy.mockRestore();
      inProgressLoadSpy.mockRestore();
      historyLoadSpy.mockRestore();
    });
  });

  describe('Fetch by ID', () => {
    it('should fetch session by ID successfully', async () => {
      const store = useSessionsStore();
      const mockApiInstance = {
        fetchById: vi.fn().mockResolvedValue(mockSessions[0]),
      };
      store.api.fetchById = mockApiInstance.fetchById;

      const result = await store.fetchById('SES-001');

      expect(mockApiInstance.fetchById).toHaveBeenCalledWith('SES-001');
      expect(store.selectedSession).toStrictEqual(mockSessions[0]);
      expect(result).toStrictEqual(mockSessions[0]);
    });

    it('should handle fetchById errors', async () => {
      const store = useSessionsStore();
      const mockApiInstance = {
        fetchById: vi.fn().mockRejectedValue(new Error('Session not found')),
      };
      store.api.fetchById = mockApiInstance.fetchById;

      // The store method catches errors and returns null
      const result = await store.fetchById('INVALID');
      expect(result).toBeNull();
      expect(store.selectedSession).toBeNull();
    });

    it('should handle null response from fetchById', async () => {
      const store = useSessionsStore();
      const mockApiInstance = {
        fetchById: vi.fn().mockResolvedValue(null),
      };
      store.api.fetchById = mockApiInstance.fetchById;

      const result = await store.fetchById('NULL-SESSION');

      expect(result).toBeNull();
      expect(store.selectedSession).toBeNull();
    });
  });

  describe('Monthly statistics', () => {
    it('should fetch monthly stats successfully', async () => {
      const store = useSessionsStore();
      const mockStats = { totalSessions: 10, totalKwh: 200, totalAmount: 100 };
      const mockApiInstance = {
        fetchMonthlyStats: vi.fn().mockResolvedValue(mockStats),
      };
      store.api.fetchMonthlyStats = mockApiInstance.fetchMonthlyStats;

      const result = await store.fetchMonthlyStats();

      expect(mockApiInstance.fetchMonthlyStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle monthly stats fetch errors', async () => {
      const store = useSessionsStore();
      const mockApiInstance = {
        fetchMonthlyStats: vi.fn().mockRejectedValue(new Error('Stats error')),
      };
      store.api.fetchMonthlyStats = mockApiInstance.fetchMonthlyStats;

      // The store method catches errors and returns default stats
      const result = await store.fetchMonthlyStats();
      expect(result).toEqual({ totalSessions: 0, totalKwh: 0, totalAmount: 0 });
    });
  });
});
