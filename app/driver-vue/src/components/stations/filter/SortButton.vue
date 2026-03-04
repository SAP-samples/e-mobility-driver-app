<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-button
    :icon="modelValue === 'asc' ? 'sort-ascending' : 'sort-descending'"
    design="Transparent"
    @click="toggleSortDirection"
    :title="modelValue === 'asc' ? $t('filter.sort_ascending') : $t('filter.sort_descending')"
    class="sort-direction-btn"
  />
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents-icons/dist/sort-ascending.js';
import '@ui5/webcomponents-icons/dist/sort-descending.js';

// Types
export type SortDirection = 'asc' | 'desc';

// Props
interface Props {
  modelValue: SortDirection;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: SortDirection];
}>();

function toggleSortDirection() {
  const newDirection: SortDirection = props.modelValue === 'asc' ? 'desc' : 'asc';
  emit('update:modelValue', newDirection);
}
</script>

<style scoped>
.sort-direction-btn {
  min-width: 2.5rem;
}
</style>
