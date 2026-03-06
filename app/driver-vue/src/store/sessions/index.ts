// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { SessionApi } from './api';
import { SessionPresets } from './presets';
import { SessionQuery } from './query-builder';
import type { MonthlyStats, Session } from './types';

import { useODataCollection } from '@/composables/useODataCollection';

const BASE_URL = import.meta.env.VITE_BACKEND_URL + 'odata/v4/session/';

/**
 * Session Store
 *
 * Manages charging session data with:
 * - Search and filtering by session ID, site, badge, station
 * - Status filtering (in-progress, completed)
 * - Date range filtering
 * - Duration, energy, and price filtering
 * - Session control (start/stop)
 * - Monthly statistics
 * - Pagination and sorting
 *
 * Default sorting: Descending by timestamp (newest first)
 */
export const useSessionsStore = defineStore('sessions', () => {
  // API Instance
  const api = new SessionApi(BASE_URL);

  // Separate collection contexts using composables for technical concerns
  const historyCollection = useODataCollection(api);
  const inProgressCollection = useODataCollection(api);

  // Business state
  const selectedSession = ref<Session | null>(null);
  const monthlyStats = ref<MonthlyStats>({ totalSessions: 0, totalKwh: 0, totalAmount: 0 });

  // Sorting state (default: newest first)
  const sortField = ref<string>('timestamp');
  const sortDirection = ref<'asc' | 'desc'>('desc');

  // ===== BUSINESS OPERATIONS =====

  // Business-focused methods that encapsulate technical concerns
  async function loadInProgressSessions(): Promise<Session[]> {
    try {
      return await inProgressCollection.load(SessionPresets.inProgress());
    } catch (err) {
      const errorMessage = (err as Error).message ?? 'Failed to load in-progress sessions';
      throw new Error(errorMessage);
    }
  }

  async function loadSessionHistory(query?: SessionQuery): Promise<Session[]> {
    try {
      const searchQuery = query || SessionPresets.completed();
      return await historyCollection.load(searchQuery);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Session history load failed:', e);
      return [];
    }
  }

  // Convenience methods using presets (updated to use new methods)
  async function loadInProgress(): Promise<Session[]> {
    return loadInProgressSessions();
  }

  async function loadCompleted(): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.completed());
  }

  async function findRecentHistory(days = 30): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.recentHistory(days));
  }

  async function findByBadge(badgeId: string): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.byBadge(badgeId));
  }

  async function findBySite(siteName: string): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.bySite(siteName));
  }

  async function findByChargingStation(stationName: string): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.byChargingStation(stationName));
  }

  async function findHighEnergy(minKwh = 50): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.highEnergy(minKwh));
  }

  async function findLongDuration(minMinutes = 180): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.longDuration(minMinutes));
  }

  async function findExpensive(minAmount = 100): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.expensive(minAmount));
  }

  async function findThisMonth(): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.thisMonth());
  }

  async function findThisYear(): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.thisYear());
  }

  async function findThisWeek(): Promise<Session[]> {
    return loadSessionHistory(SessionPresets.thisWeek());
  }

  async function fetchById(sessionId: string): Promise<Session | null> {
    try {
      const session = await api.fetchById(sessionId);
      if (session) {
        selectedSession.value = session;
      }
      return session;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Session fetchById failed:', e);
      return null;
    }
  }

  // Session control operations
  async function startSession(evseId: string): Promise<void> {
    await api.startSession({ evseId });
    // Refresh in-progress sessions after starting
    await loadInProgressSessions();
  }

  async function stopSession(sessionId: number): Promise<void> {
    await api.stopSession({ sessionId });
    // Refresh both in-progress and completed sessions after stopping
    await loadInProgressSessions();
    await loadCompleted();
  }

  // Monthly statistics
  async function fetchMonthlyStats(): Promise<MonthlyStats> {
    try {
      const stats = await api.fetchMonthlyStats();
      monthlyStats.value = stats;
      return stats;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch monthly stats:', error);
      return { totalSessions: 0, totalKwh: 0, totalAmount: 0 };
    }
  }

  // State management methods
  function setSelectedSession(session: Session | null) {
    selectedSession.value = session;
  }

  function clearResults() {
    historyCollection.clear();
    historyCollection.clearError();
  }

  function clearError() {
    historyCollection.clearError();
    inProgressCollection.clearError();
  }

  function createQuery(): SessionQuery {
    const query = new SessionQuery();

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

  // ===== COMPUTED CONTEXTS FOR UI =====
  // Expose data and pagination states for UI components with proper typing
  const sessionsInProgress = computed(() => ({
    data: inProgressCollection.data.value as Session[],
    loading: inProgressCollection.loading.value,
    hasMore: inProgressCollection.hasMorePages.value,
    isEmpty: inProgressCollection.isEmpty.value,
    total: inProgressCollection.total.value,
    error: inProgressCollection.error.value,
  }));

  const sessionHistory = computed(() => ({
    data: historyCollection.data.value as Session[],
    loading: historyCollection.loading.value,
    hasMore: historyCollection.hasMorePages.value,
    isEmpty: historyCollection.isEmpty.value,
    total: historyCollection.total.value,
    error: historyCollection.error.value,
  }));

  // ===== PAGINATION METHODS =====
  // Enhanced pagination support for contexts
  async function loadMoreHistory(): Promise<Session[]> {
    return await historyCollection.loadMore();
  }

  async function loadMoreInProgress(): Promise<Session[]> {
    return await inProgressCollection.loadMore();
  }

  return {
    // ===== COLLECTION ACCESS =====
    // Direct access to collections with all technical state
    inProgressCollection,
    historyCollection,

    // ===== BUSINESS STATE =====
    selectedSession,
    monthlyStats,
    sortField,
    sortDirection,

    // ===== COMPUTED CONTEXTS FOR UI =====
    // Contexts with data included and proper typing
    sessionsInProgress,
    sessionHistory,

    // ===== BUSINESS OPERATIONS =====
    // Main loading methods
    loadInProgressSessions,
    loadSessionHistory,

    // Convenience preset methods
    loadInProgress,
    loadCompleted,
    findRecentHistory,
    findByBadge,
    findBySite,
    findByChargingStation,
    findHighEnergy,
    findLongDuration,
    findExpensive,
    findThisMonth,
    findThisYear,
    findThisWeek,

    // Entity operations
    fetchById,

    // Pagination
    loadMoreHistory,
    loadMoreInProgress,

    // Session control
    startSession,
    stopSession,

    // Statistics
    fetchMonthlyStats,

    // State management
    setSelectedSession,
    clearResults,
    clearError,
    createQuery,
    setSorting,

    // Direct API access
    api,
  };
});

export { SessionQuery } from './query-builder';
export { SessionPresets } from './presets';
export type {
  MonthlyStats,
  Session,
  SessionFilterState,
  SessionTimeFilter,
  StartSessionRequest,
  StopSessionRequest,
} from './types';
