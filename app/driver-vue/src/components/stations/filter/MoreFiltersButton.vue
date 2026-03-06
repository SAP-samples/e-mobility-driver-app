<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="more-filters-container">
    <ui5-button
      design="Transparent"
      icon="slim-arrow-down"
      @click="toggleMenu"
      :title="
        menuOpen ? $t('filter.hide_additional_filters') : $t('filter.show_additional_filters')
      "
      class="more-filters-btn"
      data-testid="more-filters-button"
    >
      <span v-if="activeSecondaryFiltersCount > 0" class="filter-badge">
        {{ activeSecondaryFiltersCount }}
      </span>
    </ui5-button>

    <ui5-menu
      ref="filtersMenu"
      :opener="buttonRef"
      :open="menuOpen"
      @close="onMenuClose"
      data-testid="secondary-filters-panel"
    >
      <ui5-menu-item
        :text="locationMenuText"
        @click="handleLocationClick"
        :icon="hasLocationFilter ? 'accept' : 'locate-me'"
      />
      <ui5-menu-item :text="sortMenuText" @click="handleSortClick" icon="sort" />
      <ui5-menu-item
        v-if="hasClearFilters"
        text="Clear All Filters"
        @click="handleClearClick"
        icon="clear-filter"
      />
    </ui5-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';

import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Menu.js';
import '@ui5/webcomponents/dist/MenuItem.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-down.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/sort.js';
import '@ui5/webcomponents-icons/dist/clear-filter.js';
import '@ui5/webcomponents-icons/dist/locate-me.js';

interface Props {
  hasLocationFilter?: boolean;
  sortDirection?: 'asc' | 'desc';
  hasClearFilters?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasLocationFilter: false,
  sortDirection: 'asc',
  hasClearFilters: false,
});

const emit = defineEmits<{
  toggle: [expanded: boolean];
  locationClick: [];
  sortClick: [];
  clearClick: [];
}>();

// Refs
const filtersMenu = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const menuOpen = ref(false);

// Computed
const activeSecondaryFiltersCount = computed(() => {
  let count = 0;

  if (props.hasLocationFilter) count++;
  if (props.sortDirection !== 'asc') count++;
  // Note: Clear filters button doesn't count as an active filter itself

  return count;
});

const locationMenuText = computed(() => {
  return props.hasLocationFilter ? 'Location Active' : 'Find Nearby Stations';
});

const sortMenuText = computed(() => {
  const direction = props.sortDirection === 'asc' ? '↑' : '↓';
  return `Sort by Distance ${direction}`;
});

// Event handlers
function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  emit('toggle', menuOpen.value);

  if (menuOpen.value && filtersMenu.value) {
    nextTick(() => {
      if (filtersMenu.value && buttonRef.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (filtersMenu.value as any).opener = buttonRef.value;
      }
    });
  }
}

function onMenuClose() {
  menuOpen.value = false;
  emit('toggle', false);
}

function handleLocationClick() {
  emit('locationClick');
  menuOpen.value = false;
}

function handleSortClick() {
  emit('sortClick');
  menuOpen.value = false;
}

function handleClearClick() {
  emit('clearClick');
  menuOpen.value = false;
}

// Setup refs after mount
onMounted(() => {
  // Get reference to the button element
  const buttonElement = document.querySelector('.more-filters-btn');
  if (buttonElement) {
    buttonRef.value = buttonElement as HTMLElement;
  }
});

// Expose methods for parent component
defineExpose({
  close: () => {
    menuOpen.value = false;
    emit('toggle', false);
  },
  isExpanded: () => menuOpen.value,
});
</script>

<style scoped>
.more-filters-container {
  position: relative;
}

.more-filters-btn {
  min-width: 2rem;
  max-width: 2rem;
  position: relative;
}

.filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 0.75rem;
  min-width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--sapErrorColor);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  line-height: 1;
}

.filters-panel {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  background: var(--sapBackgroundColor);
  border: 1px solid var(--sapContent_ForegroundBorderColor);
  border-radius: 0.5rem;
  box-shadow: var(--sapContent_Shadow1);
  min-width: 200px;
  margin-top: 0.25rem;
}

.filters-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Only show on mobile screens */
@media (min-width: 768px) {
  .more-filters-container {
    display: none;
  }
}

/* Ensure panel doesn't go off-screen on very small devices */
@media (max-width: 320px) {
  .filters-panel {
    right: -50px;
    left: -50px;
    min-width: auto;
  }
}
</style>
