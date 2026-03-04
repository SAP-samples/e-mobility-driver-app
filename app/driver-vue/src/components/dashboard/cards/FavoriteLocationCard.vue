<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="location-title">
        <ui5-icon name="map-fill" style="color: #e9730c; margin-right: 0.5em" />
        <strong>{{ locationName }}</strong>
      </div>
    </template>
    <div class="value-row">
      <ui5-icon
        name="business-suite/manage-charging-stations"
        style="color: #27ae60; margin-right: 0.5em"
      />
      <span class="available-count">{{ available }}</span>
    </div>
    <div class="secondary">{{ $t('messages.available_stations', available) }}</div>
    <template #actions>
      <ui5-button
        icon="list"
        @click="onViewStations"
        design="Emphasized"
        style="margin-left: 0.5em"
      >
        <template v-if="loading">
          <ui5-busy-indicator size="S" active style="margin-right: 0.5em" />
          {{ $t('common.loading') }}
        </template>
        <template v-else> {{ $t('buttons.goto_stations') }} </template>
      </ui5-button>
    </template>
  </DashboardCardLayout>
</template>

<script setup lang="ts">
import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
defineProps<{
  locationName: string;
  available: number;
  onViewStations: () => void;
  loading?: boolean;
}>();
</script>

<style scoped>
.location-title {
  display: flex;
  align-items: center;
}
.value-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
}
.secondary {
  color: #7f8b97;
  font-size: 0.95em;
}
.available-count {
  font-size: 2.2em;
  font-weight: bold;
  margin-left: 8px;
  color: #1866b4;
}
</style>
