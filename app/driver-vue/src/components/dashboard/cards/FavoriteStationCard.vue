<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="station-title">
        <ui5-icon
          name="business-suite/manage-charging-stations"
          style="color: #27ae60; margin-right: 0.5em"
        />
        <strong>{{ station }}</strong>
      </div>
    </template>
    <div class="value-row">
      <ui5-icon name="parking-lot" style="color: #1866b4; margin-right: 0.5em" />
      <span class="available-count">{{ available }}</span>
    </div>
    <div class="secondary">{{ $t('messages.available_evses', available) }}</div>
    <template #actions>
      <ui5-button @click="onNavigate" design="Emphasized">
        {{ $t('buttons.view_on_map') }}
      </ui5-button>
    </template>
  </DashboardCardLayout>
</template>
<script setup lang="ts">
import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
defineProps<{
  station: string;
  available: number;
  onNavigate: () => void;
}>();
</script>
<style scoped>
.station-title {
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
  margin-left: 4px;
  color: #1866b4;
}
</style>
