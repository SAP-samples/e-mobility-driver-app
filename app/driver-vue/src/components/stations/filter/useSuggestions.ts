// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { ref } from 'vue';

import { useEvseStore } from '@/store/evse';
import type { Evse } from '@/store/evse';
import { SUGGESTION_LIMIT } from '@/store/evse/constants';

// Types
export interface EvseSuggestion {
  id: string;
  display_name: string;
  additional_info: string;
  evse: Evse;
}

export interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export function useSuggestions() {
  const evseStore = useEvseStore();

  const evseSuggestions = ref<EvseSuggestion[]>([]);
  const locationSuggestions = ref<LocationSuggestion[]>([]);

  async function searchEvseSuggestions(query: string) {
    try {
      // Search for EVSEs that match the query
      // Use API directly to avoid interfering with main list state
      const searchQuery = evseStore.createQuery().search(query).page(1, SUGGESTION_LIMIT);

      // Direct API call without touching the store state
      const results = await evseStore.api.fetch(searchQuery);

      evseSuggestions.value = results.data.map((evse) => ({
        id: evse.id,
        display_name: evse.name || evse.code || 'Unnamed Station',
        additional_info: evse.location?.address?.city || evse.location?.siteAreaName || '',
        evse,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch EVSE suggestions:', error);
      evseSuggestions.value = [];
    }
  }

  async function searchLocationSuggestions(query: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      const resp = await fetch(url);
      const results = await resp.json();
      locationSuggestions.value = results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch location suggestions:', error);
      locationSuggestions.value = [];
    }
  }

  function clearSuggestions() {
    evseSuggestions.value = [];
    locationSuggestions.value = [];
  }

  return {
    evseSuggestions,
    locationSuggestions,
    searchEvseSuggestions,
    searchLocationSuggestions,
    clearSuggestions,
  };
}
