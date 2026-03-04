<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="monthly-title">
        <ui5-icon name="sum" style="color: #1866b4; margin-right: 0.5em" />
        <strong>{{ $t('dashboard.this_month_stats') }}</strong>
      </div>
    </template>
    <div class="stats-row">
      <div class="stat-block">
        <ui5-icon name="activities" style="color: #e9730c; margin-bottom: 0.2em" />
        <ui5-label design="Bold">{{ totalSessions }}</ui5-label>
        <ui5-label>&nbsp;{{ $t('dashboard.sessions', totalSessions) }}</ui5-label>
      </div>
      <div class="stat-block">
        <ui5-icon name="energy-saving-lightbulb" style="color: #27ae60; margin-bottom: 0.2em" />
        <ui5-label design="Bold">{{ formatedKwh }}</ui5-label>
      </div>
      <div class="stat-block">
        <ui5-icon name="money-bills" style="color: #1866b4; margin-bottom: 0.2em" />
        <ui5-label design="Bold">{{ formatedPrice }}</ui5-label>
        <ui5-label>&nbsp;{{ $t('dashboard.spent') }}</ui5-label>
      </div>
    </div>
  </DashboardCardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
import { useFormatter } from '@/composables/useFormatter.ts';

const props = defineProps<{
  totalSessions: number;
  totalKwh: number;
  totalAmount: number;
}>();

const { formatKWh, formatPrice } = useFormatter();
const formatedPrice = computed(() => {
  return formatPrice(Number(props.totalAmount.toFixed(2)), '€');
});

const formatedKwh = computed(() => {
  return formatKWh(Number(props.totalKwh.toFixed(2)));
});
</script>

<style scoped>
.monthly-title {
  display: flex;
  align-items: center;
}

.stats-row {
  display: flex;
  align-items: center;
  margin-top: 2rem;
}

.stat-block {
  text-align: center;
  flex: 1;
}

.stat-block ui5-icon {
  display: block;
  margin: 0 auto 2px auto;
}
</style>
