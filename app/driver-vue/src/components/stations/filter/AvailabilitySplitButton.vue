<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="availability-button-container">
    <ui5-button
      ref="availabilityButton"
      :design="buttonDesign"
      @click="toggleMenu"
      class="availability-button"
    >
      {{ availabilityScopeText }}
    </ui5-button>

    <ui5-menu
      ref="availabilityMenu"
      :opener="buttonRef"
      :open="menuOpen"
      @close="onMenuClose"
      @item-click="onMenuItemClick"
    >
      <ui5-menu-item
        :text="$t('filter.all_stations')"
        data-value="all"
        :selected="modelValue === 'all'"
      ></ui5-menu-item>
      <ui5-menu-item
        :text="$t('filter.available_only')"
        data-value="available"
        :selected="modelValue === 'available'"
      ></ui5-menu-item>
      <ui5-menu-item
        :text="$t('filter.available_fast_chargers')"
        data-value="available_and_fastcharger"
        :selected="modelValue === 'available_and_fastcharger'"
      ></ui5-menu-item>
    </ui5-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Menu.js';
import '@ui5/webcomponents/dist/MenuItem.js';
import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-down.js';

// Types
export type AvailabilityScope = 'all' | 'available' | 'available_and_fastcharger';

// Props
interface Props {
  modelValue: AvailabilityScope;
}

const props = defineProps<Props>();
const { t } = useI18n();

const emit = defineEmits<{
  'update:modelValue': [value: AvailabilityScope];
}>();

// Refs
const availabilityMenu = ref<HTMLElement | null>(null);
const availabilityButton = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const menuOpen = ref(false);

// Computed properties
const availabilityScopeText = computed(() => {
  switch (props.modelValue) {
    case 'all':
      return t('filter.all');
    case 'available':
      return t('filter.available');
    case 'available_and_fastcharger':
      return t('filter.fast');
    default:
      return t('filter.all');
  }
});

const buttonDesign = computed(() => {
  switch (props.modelValue) {
    case 'all':
      return 'Default';
    case 'available':
      return 'Positive';
    case 'available_and_fastcharger':
      return 'Attention';
    default:
      return 'Default';
  }
});

// Event handlers
function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  if (menuOpen.value && availabilityMenu.value) {
    nextTick(() => {
      if (availabilityMenu.value && buttonRef.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (availabilityMenu.value as any).opener = buttonRef.value;
      }
    });
  }
}

function onMenuClose() {
  menuOpen.value = false;
}

function onMenuItemClick(event: CustomEvent) {
  const clickedItem = event.detail.item;
  if (clickedItem && clickedItem.getAttribute) {
    const value = clickedItem.getAttribute('data-value') as AvailabilityScope;
    if (value) {
      emit('update:modelValue', value);
      menuOpen.value = false;
    }
  }
}

// Setup refs after mount
onMounted(() => {
  // Get reference to the button element
  if (availabilityButton.value) {
    buttonRef.value = availabilityButton.value;
  }
});
</script>

<style scoped>
.availability-button-container {
  position: relative;
}

.availability-button {
  min-width: 120px;
  max-width: 180px;
}

/* Desktop styling */
@media (min-width: 768px) {
  .availability-button {
    min-width: 140px;
    max-width: 200px;
  }
}

/* Mobile styling */
@media (max-width: 767px) {
  .availability-button {
    min-width: 60px;
    max-width: 85px;
    font-size: 0.875rem;
    padding: 0 0.5rem;
  }
}

/* Small mobile screens */
@media (max-width: 480px) {
  .availability-button {
    min-width: 55px;
    max-width: 75px;
    font-size: 0.8rem;
    padding: 0 0.25rem;
  }
}

/* Very small screens - extra compact */
@media (max-width: 360px) {
  .availability-button {
    min-width: 50px;
    max-width: 65px;
    font-size: 0.75rem;
    padding: 0 0.25rem;
  }
}
</style>
