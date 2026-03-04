// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { ref } from 'vue';

import { useEvseStore } from '@/store/evse';
import { type Session, SessionPresets, useSessionsStore } from '@/store/sessions';

export function useFavoriteLocation() {
  const mostUsedSiteArea = ref<string | null>(null);
  const availableCount = ref<number>(0);
  const loading = ref(false);

  const evseStore = useEvseStore();
  const sessionsStore = useSessionsStore();

  // Calculate most used site area from sessions
  function calculateMostUsedSiteArea(sessions: Session[]): string | null {
    if (!sessions.length) return null;

    const siteAreaCounts = sessions.reduce(
      (acc, session) => {
        const siteArea = session.siteAreaName;
        if (siteArea) {
          acc[siteArea] = (acc[siteArea] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostUsed = Object.entries(siteAreaCounts).sort(([, a], [, b]) => b - a)[0];

    return mostUsed?.[0] || null;
  }

  // Fetch all favorite location data using sessions
  async function fetchFavoriteLocationData(): Promise<void> {
    loading.value = true;

    try {
      // 1. Load last 100 completed sessions
      const last100Sessions = await sessionsStore.loadSessionHistory(
        SessionPresets.lastSessions(100),
      );

      // 2. Calculate most used site area from these sessions
      const calculatedFavoriteArea = calculateMostUsedSiteArea(last100Sessions);

      // 3. Count available EVSEs with proper filters (connected + available)
      const query = evseStore.createQuery().connected().availableOnly();

      if (calculatedFavoriteArea) {
        query.inSiteArea(calculatedFavoriteArea);
      }

      availableCount.value = await evseStore.countEvses(query);

      // 4. Set mostUsedSiteArea only after successful count to maintain state consistency
      mostUsedSiteArea.value = calculatedFavoriteArea;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch favorite location data:', e);
      mostUsedSiteArea.value = null;
      availableCount.value = 0;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    mostUsedSiteArea,
    availableCount,
    loading,

    // Methods
    fetchFavoriteLocationData,
  };
}
