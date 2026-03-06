<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="evse-card-list">
    <EvseCardItem v-for="evse in evses" :key="evse.id" :evse="evse" />
  </div>
  <LoadMoreButton :has-more="hasMore" :loading="loading" @load-more="$emit('load-more')" />
</template>

<script lang="ts" setup>
import LoadMoreButton from '@/components/shared/LoadMoreButton.vue';
import EvseCardItem from '@/components/stations/map/EvseCardItem.vue';
import type { Evse } from '@/store/evse';

defineProps<{
  evses: Evse[];
  hasMore: boolean;
  loading: boolean;
}>();

defineEmits<{
  'load-more': [];
}>();
</script>

<style scoped>
.evse-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  width: 100%;
}
</style>
