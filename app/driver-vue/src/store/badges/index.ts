// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { BadgeApi } from './api';
import { BadgePresets } from './presets';
import { BadgeQuery } from './query-builder';
import type { Badge } from './types';

import { useODataCollection } from '@/composables/useODataCollection';

const BASE_URL = import.meta.env.VITE_BACKEND_URL + 'odata/v4/badge/';

/**
 * Badge Store
 *
 * Manages badge data with:
 * - Search and filtering by visual ID, authentication ID, name, license plate
 * - Active/inactive status filtering
 * - Pagination and sorting
 * - User-friendly presets
 *
 * Default sorting: Alphabetical by visual badge ID (ascending)
 */
export const useBadgesStore = defineStore('badges', () => {
  // API Instance
  const api = new BadgeApi(BASE_URL);

  // Collection context using composable for technical concerns
  const badgeCollection = useODataCollection(api);

  // Business state
  const selectedBadge = ref<Badge | null>(null);

  // Sorting state
  const sortField = ref<string>('visualBadgeId');
  const sortDirection = ref<'asc' | 'desc'>('asc');

  // ===== BUSINESS OPERATIONS =====

  // Main search method
  async function loadBadges(query?: BadgeQuery): Promise<Badge[]> {
    const searchQuery = query || BadgePresets.defaultSorted();
    const result = await badgeCollection.load(searchQuery);

    // Check if there was an error and log it for test compatibility
    if (badgeCollection.error.value) {
      // eslint-disable-next-line no-console
      console.error('Badge search failed:', new Error(badgeCollection.error.value));
    }

    return result;
  }

  async function fetchById(badgeId: string): Promise<Badge | null> {
    try {
      const badge = await api.fetchById(badgeId);
      if (badge) {
        selectedBadge.value = badge;
      }
      return badge;
    } catch (e) {
      // Log error for compatibility
      // eslint-disable-next-line no-console
      console.error('Badge fetchById failed:', e);
      return null;
    }
  }

  // Convenience methods using presets (updated to use new method)
  async function loadAll(): Promise<Badge[]> {
    return loadBadges(BadgePresets.defaultSorted());
  }

  async function loadActive(): Promise<Badge[]> {
    return loadBadges(BadgePresets.active());
  }

  async function loadInactive(): Promise<Badge[]> {
    return loadBadges(BadgePresets.inactive());
  }

  async function findWithLicensePlate(): Promise<Badge[]> {
    return loadBadges(BadgePresets.withLicensePlate());
  }

  async function findActiveWithLicensePlate(): Promise<Badge[]> {
    return loadBadges(BadgePresets.activeWithLicensePlate());
  }

  async function findByUser(firstName?: string, lastName?: string): Promise<Badge[]> {
    return loadBadges(BadgePresets.byUser(firstName, lastName));
  }

  // State management methods
  function setSelectedBadge(badge: Badge | null) {
    selectedBadge.value = badge;
  }

  function clearResults() {
    badgeCollection.clear();
    badgeCollection.clearError();
  }

  function clearError() {
    badgeCollection.clearError();
  }

  function createQuery(): BadgeQuery {
    const query = new BadgeQuery();

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
  const badges = computed(() => ({
    data: badgeCollection.data.value as Badge[],
    loading: badgeCollection.loading.value,
    hasMore: badgeCollection.hasMorePages.value,
    isEmpty: badgeCollection.isEmpty.value,
    total: badgeCollection.total.value,
    error: badgeCollection.error.value,
  }));

  // ===== PAGINATION METHODS =====
  async function loadMoreBadges(): Promise<Badge[]> {
    return await badgeCollection.loadMore();
  }

  return {
    // ===== COLLECTION ACCESS =====
    // Direct access to collection with all technical state
    badgeCollection,

    // ===== BUSINESS STATE =====
    selectedBadge,
    sortField,
    sortDirection,

    // ===== COMPUTED CONTEXTS FOR UI =====
    badges,

    // ===== BUSINESS OPERATIONS =====
    // Main loading method
    loadBadges,

    // Convenience preset methods
    fetchById,
    loadAll,
    loadActive,
    loadInactive,
    findWithLicensePlate,
    findActiveWithLicensePlate,
    findByUser,

    // Pagination
    loadMoreBadges,

    // State management
    setSelectedBadge,
    clearResults,
    clearError,
    createQuery,
    setSorting,

    // Direct API access
    api,
  };
});

export { BadgeQuery } from './query-builder';
export { BadgePresets } from './presets';
export type { Badge } from './types';
