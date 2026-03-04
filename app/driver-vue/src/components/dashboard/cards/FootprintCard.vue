<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="footprint-title">
        <ui5-icon name="compare" style="color: #27ae60; margin-right: 0.5em" />
        <strong>{{ $t('dashboard.eco_balance') }}</strong>
      </div>
    </template>
    <div class="footprint-content">
      <div class="co2-row">
        <ui5-icon name="e-care" style="color: #27ae60; margin-right: 0.5em" />
        <ui5-label design="Bold" style="font-size: 2em">{{ co2 }} kg CO₂</ui5-label>
      </div>
      <div class="secondary">{{ $t('dashboard.emissions_avoided') }}</div>
      <ui5-progress-indicator value="100" display-value="Level 3 / 5" style="margin-top: 8px" />
    </div>
    <template #actions>
      <!-- Add actions here if needed -->
    </template>
  </DashboardCardLayout>
</template>

<script setup lang="ts">
import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
defineProps<{
  co2: number;
}>();
</script>

<style scoped>
.footprint-title {
  display: flex;
  align-items: center;
}
.footprint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 1rem;
}
.co2-row {
  display: flex;
  align-items: center;
}
.secondary {
  color: #7f8b97;
  font-size: 0.95em;
  text-align: right;
  margin-bottom: 8px;
}
</style>
