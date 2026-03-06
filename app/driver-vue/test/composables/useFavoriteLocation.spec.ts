// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { faker } from '@faker-js/faker';
import { createPinia, setActivePinia } from 'pinia';
import { type MockedFunction, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFavoriteLocation } from '@/composables/useFavoriteLocation';
import { useEvseStore } from '@/store/evse';
import { EvseQuery } from '@/store/evse/query-builder';
import { type Session, SessionPresets, useSessionsStore } from '@/store/sessions';

// Mock dependencies
vi.mock('@/store/evse', async () => {
  const actual = await vi.importActual('@/store/evse');
  return {
    ...actual,
    useEvseStore: vi.fn(),
  };
});
vi.mock('@/store/sessions', () => ({
  useSessionsStore: vi.fn(),
  SessionPresets: {
    lastSessions: vi.fn(),
  },
}));

// Create mocks
const mockUseEvseStore = useEvseStore as MockedFunction<typeof useEvseStore>;
const mockUseSessionsStore = useSessionsStore as MockedFunction<typeof useSessionsStore>;
const mockSessionPresets = SessionPresets as unknown as {
  lastSessions: MockedFunction<(count?: number) => unknown>;
};

describe('useFavoriteLocation', () => {
  let favoriteLocation: ReturnType<typeof useFavoriteLocation>;
  let mockEvseStore: {
    createQuery: MockedFunction<() => EvseQuery>;
    countEvses: MockedFunction<(query: EvseQuery) => Promise<number>>;
  };

  let mockSessionsStore: {
    loadSessionHistory: MockedFunction<(query: unknown) => Promise<Session[]>>;
  };

  // Helper function to create mock session
  const createMockSession = (overrides?: Partial<Session>): Session => ({
    id: faker.number.int(),
    sessionId: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
    siteName: faker.company.name(),
    siteAreaName: faker.location.city(),
    badgeAuthenticationId: faker.string.uuid(),
    badgeVisualBadgeId: faker.string.alphanumeric(8),
    cumulatedPrice: faker.number.float({ min: 5, max: 50 }),
    currency: 'EUR',
    status: 'Finished',
    chargingStationName: faker.commerce.productName(),
    totalDuration: faker.number.int({ min: 30, max: 300 }),
    totalInactivity: faker.number.int({ min: 0, max: 30 }),
    totalEnergyDelivered: faker.number.float({ min: 10, max: 100 }),
    stateOfCharge: faker.number.int({ min: 20, max: 100 }),
    emi3Id: faker.string.alphanumeric(10),
    evseCode: faker.string.alphanumeric(8),
    stop_extraInactivity: faker.number.int({ min: 0, max: 60 }),
    ...overrides,
  });

  // Helper to create mock query with fluent interface
  const createMockQuery = (): EvseQuery => {
    const mockQuery = new EvseQuery();
    vi.spyOn(mockQuery, 'inSiteArea').mockReturnValue(mockQuery);
    vi.spyOn(mockQuery, 'availableOnly').mockReturnValue(mockQuery);
    vi.spyOn(mockQuery, 'connected').mockReturnValue(mockQuery);
    return mockQuery;
  };

  beforeEach(() => {
    setActivePinia(createPinia());

    // Setup mock EVSE store
    mockEvseStore = {
      createQuery: vi.fn(),
      countEvses: vi.fn(),
    };

    // Setup mock sessions store
    mockSessionsStore = {
      loadSessionHistory: vi.fn(),
    };

    // Configure mocks
    mockUseEvseStore.mockReturnValue(mockEvseStore as unknown as ReturnType<typeof useEvseStore>);
    mockUseSessionsStore.mockReturnValue(
      mockSessionsStore as unknown as ReturnType<typeof useSessionsStore>,
    );
    mockEvseStore.createQuery.mockReturnValue(createMockQuery());

    // Create the composable instance
    favoriteLocation = useFavoriteLocation();

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(favoriteLocation.mostUsedSiteArea.value).toBeNull();
      expect(favoriteLocation.availableCount.value).toBe(0);
      expect(favoriteLocation.loading.value).toBe(false);
    });
  });

  describe('fetchFavoriteLocationData', () => {
    it('should fetch favorite location data and count available EVSEs', async () => {
      const sessions = [
        createMockSession({ siteAreaName: 'Popular Area' }),
        createMockSession({ siteAreaName: 'Popular Area' }),
        createMockSession({ siteAreaName: 'Other Area' }),
      ];
      const mockQuery = createMockQuery();

      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(mockQuery);
      mockEvseStore.countEvses.mockResolvedValue(3);

      await favoriteLocation.fetchFavoriteLocationData();

      expect(mockSessionPresets.lastSessions).toHaveBeenCalledWith(100);
      expect(mockSessionsStore.loadSessionHistory).toHaveBeenCalledWith(mockQuery);
      expect(favoriteLocation.mostUsedSiteArea.value).toBe('Popular Area');
      expect(favoriteLocation.availableCount.value).toBe(3);
      expect(favoriteLocation.loading.value).toBe(false);
    });

    it('should apply connected and availableOnly filters', async () => {
      const sessions = [createMockSession({ siteAreaName: 'Test Area' })];
      const mockQuery = createMockQuery();

      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(mockQuery);
      mockEvseStore.createQuery.mockReturnValue(mockQuery);
      mockEvseStore.countEvses.mockResolvedValue(1);

      await favoriteLocation.fetchFavoriteLocationData();

      expect(mockQuery.connected).toHaveBeenCalled();
      expect(mockQuery.availableOnly).toHaveBeenCalled();
      expect(mockQuery.inSiteArea).toHaveBeenCalledWith('Test Area');
    });

    it('should count all available EVSEs when no favorite location found', async () => {
      const sessions: Session[] = [];
      const mockQueryForSessions = createMockQuery();
      const mockQueryForEvses = createMockQuery();

      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(mockQueryForSessions);
      mockEvseStore.createQuery.mockReturnValue(mockQueryForEvses);
      mockEvseStore.countEvses.mockResolvedValue(2);

      await favoriteLocation.fetchFavoriteLocationData();

      expect(favoriteLocation.mostUsedSiteArea.value).toBeNull();
      expect(favoriteLocation.availableCount.value).toBe(2);
      expect(mockQueryForEvses.connected).toHaveBeenCalled();
      expect(mockQueryForEvses.availableOnly).toHaveBeenCalled();
      expect(mockQueryForEvses.inSiteArea).not.toHaveBeenCalled();
    });

    it('should handle errors in fetching favorite location data', async () => {
      const errorMessage = 'Failed to load sessions';
      mockSessionsStore.loadSessionHistory.mockRejectedValue(new Error(errorMessage));

      await favoriteLocation.fetchFavoriteLocationData();

      expect(favoriteLocation.mostUsedSiteArea.value).toBeNull();
      expect(favoriteLocation.availableCount.value).toBe(0);
      expect(favoriteLocation.loading.value).toBe(false);
    });

    it('should handle errors in counting EVSEs', async () => {
      const sessions = [createMockSession({ siteAreaName: 'Test Area' })];
      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(createMockQuery());
      mockEvseStore.countEvses.mockRejectedValue(new Error('EVSE count failed'));

      await favoriteLocation.fetchFavoriteLocationData();

      expect(favoriteLocation.mostUsedSiteArea.value).toBeNull();
      expect(favoriteLocation.availableCount.value).toBe(0);
      expect(favoriteLocation.loading.value).toBe(false);
    });

    it('should set loading state correctly during fetch', async () => {
      const sessions = [createMockSession({ siteAreaName: 'Test Area' })];

      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(createMockQuery());
      mockEvseStore.countEvses.mockResolvedValue(1);

      expect(favoriteLocation.loading.value).toBe(false);

      const fetchPromise = favoriteLocation.fetchFavoriteLocationData();
      expect(favoriteLocation.loading.value).toBe(true);

      await fetchPromise;
      expect(favoriteLocation.loading.value).toBe(false);
    });

    it('should calculate most used site area correctly', async () => {
      const sessions = [
        createMockSession({ siteAreaName: 'Area A' }),
        createMockSession({ siteAreaName: 'Area B' }),
        createMockSession({ siteAreaName: 'Area A' }),
        createMockSession({ siteAreaName: 'Area C' }),
        createMockSession({ siteAreaName: 'Area A' }),
      ];

      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(createMockQuery());
      mockEvseStore.countEvses.mockResolvedValue(1);

      await favoriteLocation.fetchFavoriteLocationData();

      expect(favoriteLocation.mostUsedSiteArea.value).toBe('Area A');
    });

    it('should handle sessions without siteAreaName', async () => {
      const sessions = [
        createMockSession({ siteAreaName: undefined }),
        createMockSession({ siteAreaName: '' }),
        createMockSession({ siteAreaName: 'Valid Area' }),
      ];

      mockSessionsStore.loadSessionHistory.mockResolvedValue(sessions);
      mockSessionPresets.lastSessions.mockReturnValue(createMockQuery());
      mockEvseStore.countEvses.mockResolvedValue(1);

      await favoriteLocation.fetchFavoriteLocationData();

      expect(favoriteLocation.mostUsedSiteArea.value).toBe('Valid Area');
    });
  });
});
