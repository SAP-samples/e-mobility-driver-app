<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-bar class="filter-bar" design="Header" data-testid="evse-filter-bar">
    <!-- All filters centered (default slot) -->
    <div class="all-filters">
      <!-- Search Input -->
      <SearchInput
        v-model="searchQuery"
        :last-selected-suggestion="lastSelectedSuggestion"
        @search="onSearch"
        @suggestion-selected="onSuggestionSelected"
        @input-cleared="onInputCleared"
        class="search-input"
      />

      <!-- Availability Scope Filter -->
      <AvailabilitySplitButton
        v-model="availabilityScope"
        @update:model-value="emitSearchWithDelay"
        class="availability-filter"
      />

      <!-- Desktop: All secondary filters (visible on larger screens) -->
      <div class="secondary-filters desktop-only">
        <!-- Location Button -->
        <LocationButton :geo-loading="geoLoading" @location-requested="onLocationRequested" />

        <!-- Sort Direction Toggle -->
        <SortButton v-model="sortDirection" @update:model-value="onSortDirectionChange" />

        <!-- Clear Filters Button -->
        <ClearFiltersButton :visible="Boolean(hasActiveFilters)" @clear="clearAllFilters" />
      </div>
    </div>

    <!-- Mobile: More Filters Button (visible on smaller screens) -->
    <div slot="endContent" class="mobile-only">
      <MoreFiltersButton
        :has-location-filter="hasLocationFilter"
        :sort-direction="sortDirection"
        :has-clear-filters="Boolean(hasActiveFilters)"
        @toggle="onMoreFiltersToggle"
        @location-click="onLocationClick"
        @sort-click="onSortClick"
        @clear-click="onClearClick"
        ref="moreFiltersButton"
      />
    </div>
  </ui5-bar>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

import AvailabilitySplitButton from './AvailabilitySplitButton.vue';
import ClearFiltersButton from './ClearFiltersButton.vue';
import LocationButton from './LocationButton.vue';
import MoreFiltersButton from './MoreFiltersButton.vue';
import SearchInput from './SearchInput.vue';
import SortButton from './SortButton.vue';
import { useFilterState } from './useFilterState';

import { useGeolocation } from '@/composables/useGeolocation';

// UI5 imports
import '@ui5/webcomponents/dist/Bar.js';

// Types
interface SearchPayload {
  value?: string;
  available?: boolean;
  fastCharging?: boolean;
  location?: {
    lat: number;
    lon: number;
    radius: number;
  };
  evseId?: string;
  sortDirection?: 'asc' | 'desc';
  pageArg?: number;
  pageSizeArg?: number;
}

const emit = defineEmits<{
  search: [payload: SearchPayload];
}>();

// Use filter state composable
const {
  searchQuery,
  availabilityScope,
  sortDirection,
  lastSelectedSuggestion,
  hasActiveFilters,
  clearFilters,
  onInputCleared,
  onSuggestionSelected,
} = useFilterState();

// Use geolocation composable
const { geoLoading, getCurrentLocation } = useGeolocation();

// Prevent multiple simultaneous search emissions
const isEmittingSearch = ref(false);

// Track user interactions to prevent race conditions with initial emission
const hasUserInteraction = ref(false);

// Refs
const moreFiltersButton = ref<InstanceType<typeof MoreFiltersButton> | null>(null);

// Computed properties
const hasLocationFilter = computed(() => {
  return (
    lastSelectedSuggestion.value?.type === 'location' &&
    searchQuery.value === lastSelectedSuggestion.value.text
  );
});

// Event handlers
function onMoreFiltersToggle(expanded: boolean) {
  // Close the more filters panel when location is selected or other actions occur
  if (!expanded && moreFiltersButton.value) {
    // Panel was closed, no additional action needed
  }
}

// Shared geolocation handler for both desktop and mobile
async function handleGeolocation() {
  try {
    const location = await getCurrentLocation();
    searchQuery.value = '';
    lastSelectedSuggestion.value = null;

    emitSearch({
      location,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get location:', error);
  } finally {
    // Close mobile menu if it's open
    if (moreFiltersButton.value) {
      moreFiltersButton.value.close();
    }
  }
}

// Desktop location button handler
function onLocationRequested() {
  handleGeolocation();
}

function onSearch(payload: {
  evseId?: string;
  value?: string;
  location?: { lat: number; lon: number; radius: number };
}) {
  emitSearch(payload);
}

function clearAllFilters() {
  clearFilters();
  emitSearch();
}

function onSortDirectionChange() {
  hasUserInteraction.value = true;
  // Force immediate emission without queue to ensure reliability
  setTimeout(() => {
    emitSearch();
  }, 0);
}

// Mobile menu event handlers
function onLocationClick() {
  // Mobile location click - use the same geolocation logic as desktop
  handleGeolocation();
}

function onSortClick() {
  // Toggle sort direction
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  nextTick(() => {
    emitSearch();
  });
}

function onClearClick() {
  clearAllFilters();
}

function emitSearchWithDelay() {
  // Small delay to prevent excessive search emissions
  if (!isEmittingSearch.value) {
    setTimeout(() => {
      emitSearch();
    }, 50);
  }
}

function emitSearch(extraPayload: Partial<SearchPayload> = {}) {
  // Capture current state values immediately to avoid race conditions
  const currentSortDirection = sortDirection.value;
  const currentSearchQuery = searchQuery.value;
  const currentAvailabilityScope = availabilityScope.value;
  const currentLastSelectedSuggestion = lastSelectedSuggestion.value;

  // Build payload immediately and emit synchronously for test reliability
  const payload: SearchPayload = {};

  // Check if we have an active location selection
  const hasActiveLocationSelection =
    currentLastSelectedSuggestion?.type === 'location' &&
    currentSearchQuery === currentLastSelectedSuggestion.text;

  // Only include search query if it exists AND it's not a location-only search
  if (currentSearchQuery?.trim() && !extraPayload.location && !hasActiveLocationSelection) {
    payload.value = currentSearchQuery.trim();
  }

  // If extraPayload has a specific 'value', use it (for EVSE searches)
  if (extraPayload.value) {
    payload.value = extraPayload.value;
  }

  // Handle availability scope
  if (currentAvailabilityScope === 'available') {
    payload.available = true;
  } else if (currentAvailabilityScope === 'available_and_fastcharger') {
    payload.available = true;
    payload.fastCharging = true;
  }

  // Add sort direction (always include for consistent ordering)
  payload.sortDirection = currentSortDirection;

  // Preserve location information from lastSelectedSuggestion if active
  if (hasActiveLocationSelection && !extraPayload.location && currentLastSelectedSuggestion) {
    const locationData = currentLastSelectedSuggestion.data as { lat: string; lon: string };
    payload.location = {
      lat: Number(locationData.lat),
      lon: Number(locationData.lon),
      radius: 50000, // Default radius
    };
  }

  // Add any extra payload (like location or evseId)
  Object.assign(
    payload,
    Object.fromEntries(Object.entries(extraPayload).filter(([key]) => key !== 'value')),
  );

  // Emit immediately for test reliability
  emit('search', payload);
}
</script>

<style scoped>
/* Basic styling - UI5 Bar handles layout automatically */
.filter-bar {
  margin-bottom: 1rem;
}

/* All filters container */
.all-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
}

/* Secondary filters container */
.secondary-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Responsive visibility classes */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

/* Desktop layout - all filters centered with larger search */
@media (min-width: 768px) {
  .all-filters {
    gap: 1rem;
    justify-content: center;
  }

  /* Larger search input on desktop */
  .search-input {
    min-width: 400px;
    max-width: 500px;
    flex: 0 0 auto;
  }

  /* Availability filter - fixed width on desktop */
  .availability-filter {
    flex: 0 0 auto;
  }

  /* Secondary filters with proper spacing */
  .secondary-filters {
    gap: 0.75rem;
  }
}

/* Mobile layout - show/hide appropriate elements */
@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  /* Mobile: only primary filters in center, compact spacing */
  .all-filters {
    gap: 0.25rem;
    justify-content: center;
  }

  /* Search input gets more space on mobile */
  .search-input {
    flex: 2;
    min-width: 0;
  }

  /* Availability filter stays compact */
  .availability-filter {
    flex: 0 0 auto;
  }
}

/* Small mobile screens */
@media (max-width: 480px) {
  .all-filters {
    gap: 0.25rem;
  }

  /* Search input - minimum viable size */
  .search-input {
    flex: 1 1 auto;
    min-width: 120px;
  }
}
</style>
