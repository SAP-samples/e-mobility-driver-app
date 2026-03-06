<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div v-if="hasMore" class="load-more-container">
    <ui5-button
      data-testid="load-more-button"
      design="Emphasized"
      :disabled="loading"
      @click="$emit('load-more')"
    >
      <template v-if="loading"> {{ $t('common.loading') }}... </template>
      <template v-else>
        {{ $t('list.load_more_results') }}
      </template>
    </ui5-button>
    <div v-if="showCount" class="count-info">
      {{ $t('list.showing_count', { current: currentCount, total }) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/Button.js';

withDefaults(
  defineProps<{
    hasMore: boolean;
    loading?: boolean;
    total?: number;
    currentCount?: number;
    showCount?: boolean;
  }>(),
  {
    loading: false,
  },
);

defineEmits<{
  'load-more': [];
}>();
</script>

<style scoped>
.load-more-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
}

.count-info {
  font-size: 0.875rem;
  color: var(--sapContent_LabelColor);
}
</style>
