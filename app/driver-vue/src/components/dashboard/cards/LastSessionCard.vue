<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="last-title">
        <ui5-icon name="history" style="color: #1866b4; margin-right: 0.5em" />
        <strong>{{ $t('messages.latest_sessions') }}</strong>
      </div>
    </template>
    <div class="last-content">
      <ui5-list separators="All">
        <ui5-li v-for="session in sessions" :key="session.id">
          <ui5-icon name="map-fill"></ui5-icon>
          {{ session.station }} • <ui5-label>{{ session.date }}</ui5-label> ●
          <ui5-label>{{ formatKWh(session.energy) }}</ui5-label>
          <span class="price">{{ formatPrice(Number(session.amount.toFixed(2)), '€') }}</span>
        </ui5-li>
      </ui5-list>
    </div>
    <template #actions>
      <ui5-button design="Transparent" @click="onViewAll">{{
        $t('buttons.view_all_history')
      }}</ui5-button>
    </template>
  </DashboardCardLayout>
</template>

<script setup lang="ts">
import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
import { useFormatter } from '@/composables/useFormatter.ts';

defineProps<{
  sessions: Array<{
    id: string | number;
    station: string;
    date: string;
    energy: number;
    amount: number;
  }>;
  onViewAll: () => void;
}>();

const { formatKWh, formatPrice } = useFormatter();
</script>

<style scoped>
.last-title {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.last-content {
  width: 100%;
}

.price {
  align-items: end;
}
</style>
