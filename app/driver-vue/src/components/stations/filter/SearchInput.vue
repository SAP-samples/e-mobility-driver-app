<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-input
    :value="searchQuery"
    class="search-input"
    :placeholder="$t('filter.search_placeholder')"
    show-clear-icon
    show-suggestions
    @input="debouncedOnInput"
    @ui5-input="debouncedOnInput"
    @ui5-selection-change="onSuggestionSelect"
    @keydown.enter="onSearch"
  >
    <ui5-icon slot="icon" name="search"></ui5-icon>

    <!-- EVSE Suggestions Group -->
    <template v-if="evseSuggestions.length > 0">
      <ui5-suggestion-item-group :header-text="$t('filter.charge_points')">
        <ui5-suggestion-item-custom
          v-for="evse in evseSuggestions"
          :key="`evse-${evse.id}`"
          :text="evse.display_name"
          :data-type="'evse'"
          :data-id="evse.id"
        >
          <div class="suggestion-content">
            <ui5-icon
              name="BusinessSuiteInAppSymbols/icon-manage-charging-stations"
              class="suggestion-icon"
            ></ui5-icon>
            <div class="suggestion-text">
              <div class="suggestion-main">{{ evse.display_name }}</div>
              <div class="suggestion-additional" v-if="evse.additional_info">
                {{ evse.additional_info }}
              </div>
            </div>
          </div>
        </ui5-suggestion-item-custom>
      </ui5-suggestion-item-group>
    </template>

    <!-- Location Suggestions Group -->
    <template v-if="locationSuggestions.length > 0">
      <ui5-suggestion-item-group :header-text="$t('filter.places')">
        <ui5-suggestion-item-custom
          v-for="location in locationSuggestions"
          :key="`location-${location.display_name}`"
          :text="location.display_name"
          :data-type="'location'"
          :data-lat="location.lat"
          :data-lon="location.lon"
        >
          <div class="suggestion-content">
            <ui5-icon name="locate-me" class="suggestion-icon"></ui5-icon>
            <div class="suggestion-text">
              <div class="suggestion-main">{{ location.display_name }}</div>
            </div>
          </div>
        </ui5-suggestion-item-custom>
      </ui5-suggestion-item-group>
    </template>
  </ui5-input>
</template>

<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core';
import { nextTick, onMounted, ref, watch } from 'vue';

import { type EvseSuggestion, type LocationSuggestion, useSuggestions } from './useSuggestions';

// UI5 imports
import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents/dist/features/InputSuggestions.js';
import '@ui5/webcomponents/dist/SuggestionItem.js';
import '@ui5/webcomponents/dist/SuggestionItemGroup.js';
import '@ui5/webcomponents/dist/SuggestionItemCustom.js';

// Types
export interface SelectedSuggestion {
  text: string;
  type: 'evse' | 'location';
  data: EvseSuggestion | LocationSuggestion;
}

// Props
interface Props {
  modelValue: string;
  lastSelectedSuggestion?: SelectedSuggestion | null;
}

const props = withDefaults(defineProps<Props>(), {
  lastSelectedSuggestion: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [
    payload: {
      evseId?: string;
      value?: string;
      location?: { lat: number; lon: number; radius: number };
    },
  ];
  'suggestion-selected': [suggestion: SelectedSuggestion];
  'input-cleared': [];
}>();

// State
const searchQuery = ref(props.modelValue);
const isSelectingSuggestion = ref(false);
const isTyping = ref(false); // Track if user is actively typing

// Watch for prop changes and sync internal state
watch(
  () => props.modelValue,
  (newValue) => {
    if (searchQuery.value !== newValue) {
      searchQuery.value = newValue;
    }
  },
);

// Suggestions composable
const {
  evseSuggestions,
  locationSuggestions,
  searchEvseSuggestions,
  searchLocationSuggestions,
  clearSuggestions,
} = useSuggestions();

// Search functions
async function onInput(e: Event) {
  // Set typing flag to prevent suggestion interference
  isTyping.value = true;

  // Skip if we're in the middle of selecting a suggestion
  if (isSelectingSuggestion.value) {
    isTyping.value = false;
    return;
  }

  // Handle both regular events and UI5 events
  const target = e.target as HTMLInputElement;
  let value = '';

  // Try different ways to get the value
  if (target?.value !== undefined) {
    value = target.value;
  } else if ((e as CustomEvent)?.detail?.target?.value !== undefined) {
    value = (e as CustomEvent).detail.target.value;
  }

  // Update the search query immediately for responsive UI
  searchQuery.value = value;
  emit('update:modelValue', value);

  // Clear suggestions if input is too short
  if (!value || value.length < 2) {
    clearSuggestions();
    emit('input-cleared');
    isTyping.value = false;
  }

  // The actual search will be debounced
}

// Create debounced function for suggestions search
const debouncedSuggestionSearch = useDebounceFn(async (value: string) => {
  // Only search if user has stopped typing and input is valid
  if (!isTyping.value && value && value.length >= 2) {
    // Search for EVSE matches and location suggestions in parallel
    await Promise.all([searchEvseSuggestions(value), searchLocationSuggestions(value)]);

    emit('search', { value: value.trim() });
  }
}, 600); // Increased debounce time for better stability

// Reset typing flag after user stops typing
const debouncedResetTyping = useDebounceFn(() => {
  isTyping.value = false;
  // Trigger suggestion search after typing stops
  if (searchQuery.value && searchQuery.value.length >= 2) {
    debouncedSuggestionSearch(searchQuery.value);
  }
}, 300);

// Main input handler
const debouncedOnInput = (e: Event) => {
  onInput(e);
  // Reset the typing flag after user stops typing
  debouncedResetTyping();
};

// UI5 suggestions event handler
async function onSuggestionSelect(e: CustomEvent) {
  const selectedItem = e.detail.item;
  if (!selectedItem) return;

  // Set the flags to prevent input interference
  isSelectingSuggestion.value = true;
  isTyping.value = false;

  const text = selectedItem.text;
  const type = selectedItem.getAttribute('data-type');

  if (!text || !type) {
    isSelectingSuggestion.value = false;
    return;
  }

  if (type === 'evse') {
    const evseId = selectedItem.getAttribute('data-id');
    const evseSuggestion = evseSuggestions.value.find((s) => s.id === evseId);

    if (evseSuggestion) {
      const suggestion: SelectedSuggestion = {
        text: text,
        type: 'evse',
        data: evseSuggestion,
      };

      // Ensure the input shows the selected text
      searchQuery.value = text;
      emit('update:modelValue', text);
      clearSuggestions();

      emit('suggestion-selected', suggestion);

      // Search specifically for this EVSE
      emit('search', {
        evseId: evseSuggestion.id,
        value: text,
      });
    }
  } else if (type === 'location') {
    const lat = selectedItem.getAttribute('data-lat');
    const lon = selectedItem.getAttribute('data-lon');

    const locationData: LocationSuggestion = {
      display_name: text,
      lat: lat,
      lon: lon,
    };

    const suggestion: SelectedSuggestion = {
      text: text,
      type: 'location',
      data: locationData,
    };

    // Force the input to show the selected location name
    searchQuery.value = text;
    emit('update:modelValue', text);
    clearSuggestions();

    // Use nextTick to ensure the DOM is updated
    await nextTick();

    emit('suggestion-selected', suggestion);

    // Search by location only - NO text value for places
    emit('search', {
      location: {
        lat: Number(lat),
        lon: Number(lon),
        radius: 50000,
      },
    });
  }

  // Reset the flags after a short delay to allow proper state management
  setTimeout(() => {
    isSelectingSuggestion.value = false;
    isTyping.value = false;
  }, 200);
}

async function onSearch() {
  // If we have a selected suggestion, handle it based on its type
  if (props.lastSelectedSuggestion && searchQuery.value === props.lastSelectedSuggestion.text) {
    if (props.lastSelectedSuggestion.type === 'evse') {
      const evseData = props.lastSelectedSuggestion.data as EvseSuggestion;
      // Re-emit the EVSE search with text value
      emit('search', {
        evseId: evseData.id,
        value: evseData.display_name,
      });
      return;
    } else if (props.lastSelectedSuggestion.type === 'location') {
      const locationData = props.lastSelectedSuggestion.data as LocationSuggestion;
      // Re-emit the location search WITHOUT text value
      emit('search', {
        location: {
          lat: Number(locationData.lat),
          lon: Number(locationData.lon),
          radius: 50000,
        },
      });
      return;
    }
  }

  // If no suggestion was selected or input was modified, perform a new search
  if (!searchQuery.value?.trim()) {
    emit('search', {});
    return;
  }

  // Perform a text-based search (fallback)
  emit('search', { value: searchQuery.value.trim() });
}

// Initialize search if modelValue is provided and long enough
onMounted(async () => {
  if (props.modelValue && props.modelValue.length >= 2) {
    await Promise.all([
      searchEvseSuggestions(props.modelValue),
      searchLocationSuggestions(props.modelValue),
    ]);
  }
});

// Expose methods and data
defineExpose({
  clearSuggestions,
  searchQuery,
});
</script>

<style scoped>
.search-input {
  flex: 1;
  max-width: 400px;
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  width: 100%;
}

.suggestion-icon {
  flex-shrink: 0;
  color: var(--sapContent_IconColor);
}

.suggestion-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.suggestion-main {
  font-weight: 500;
  color: var(--sapTextColor);
}

.suggestion-additional {
  font-size: 0.875rem;
  color: var(--sapContent_LabelColor);
}

@media (max-width: 768px) {
  /* Search input - 50% */
  .search-input {
    flex: 0 0 50%;
    max-width: none;
    min-width: 0;
  }

  .suggestion-content {
    padding: 0.375rem;
    gap: 0.5rem;
  }
}

/* Extra small screens - adjust proportions slightly */
@media (max-width: 480px) {
  /* Search input - slightly larger */
  .search-input {
    flex: 0 0 52%;
  }
}
</style>
