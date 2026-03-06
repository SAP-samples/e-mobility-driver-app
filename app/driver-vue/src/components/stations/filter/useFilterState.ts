// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { AvailabilityScope } from './AvailabilitySplitButton.vue';
import type { SelectedSuggestion } from './SearchInput.vue';
import type { SortDirection } from './SortButton.vue';

export function useFilterState() {
  const route = useRoute();

  // State
  const searchQuery = ref('');
  const availabilityScope = ref<AvailabilityScope>('all');
  const sortDirection = ref<SortDirection>('asc');
  const lastSelectedSuggestion = ref<SelectedSuggestion | null>(null);

  // Initialize filters from route query
  function initializeFromRoute() {
    // Initialize search query from route
    if (route.query.siteArea && typeof route.query.siteArea === 'string') {
      searchQuery.value = route.query.siteArea;
    }

    // Initialize availability scope from route
    if (route.query.available === 'true' && route.query.fastCharging === 'true') {
      availabilityScope.value = 'available_and_fastcharger';
    } else if (route.query.available === 'true') {
      availabilityScope.value = 'available';
    } else {
      availabilityScope.value = 'all';
    }
  }

  // Call initialization immediately when composable is created
  initializeFromRoute();

  // Computed
  const hasActiveFilters = computed(() => {
    const hasLocationFilter =
      lastSelectedSuggestion.value?.type === 'location' &&
      searchQuery.value === lastSelectedSuggestion.value.text;

    return (
      availabilityScope.value !== 'all' ||
      searchQuery.value?.trim() ||
      sortDirection.value !== 'asc' ||
      hasLocationFilter
    );
  });

  // Clear all filters
  function clearFilters() {
    availabilityScope.value = 'all';
    searchQuery.value = '';
    sortDirection.value = 'asc';
    lastSelectedSuggestion.value = null;
  }

  // Reset search when input is cleared
  function onInputCleared() {
    lastSelectedSuggestion.value = null;
  }

  // Handle suggestion selection
  function onSuggestionSelected(suggestion: SelectedSuggestion) {
    lastSelectedSuggestion.value = suggestion;
  }

  return {
    // State
    searchQuery,
    availabilityScope,
    sortDirection,
    lastSelectedSuggestion,

    // Computed
    hasActiveFilters,

    // Methods
    initializeFromRoute,
    clearFilters,
    onInputCleared,
    onSuggestionSelected,
  };
}
