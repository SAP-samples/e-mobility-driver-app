<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-button
    v-if="isVisible"
    design="Transparent"
    icon="clear-filter"
    @click="$emit('clear')"
    :title="$t('filter.clear_all_filters_title')"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents-icons/dist/clear-filter.js';

// Props
interface Props {
  visible: unknown;
}

const props = defineProps<Props>();

defineEmits<{
  clear: [];
}>();

// Computed property to handle falsy values properly
const isVisible = computed(() => Boolean(props.visible));
</script>

<style scoped>
@media (max-width: 768px) {
  /* Clear button - auto size */
  .ui5-button {
    flex: 0 0 auto;
    min-width: 40px;
  }
}
</style>
