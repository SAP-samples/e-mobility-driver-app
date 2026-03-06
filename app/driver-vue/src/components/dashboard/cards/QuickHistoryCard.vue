<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="history-title">
        <ui5-icon name="history" style="color: #1866b4; margin-right: 0.5em" />
        <strong>{{ $t('messages.latest_sessions') }}</strong>
      </div>
    </template>
    <div class="count-row">
      <ui5-icon name="activities" style="color: #e9730c; margin-right: 0.5em" />
      <span class="available-count">{{ sessions.length }}</span>
    </div>
    <div class="secondary">{{ $t('dashboard.recent_charges', sessions.length) }}</div>
    <ui5-list separators="All">
      <ui5-li v-for="session in sessions" :key="session.id">
        <div class="li-content">
          <span class="li-station">
            <ui5-text>{{ session.station }}</ui5-text>
          </span>
          <ui5-label>{{ formatDate(session.date) }}</ui5-label>
          <ui5-label>{{ formatKWh(session.energy) }}</ui5-label>
          <span class="price">
            <ui5-text>{{ formatPrice(session.amount, session.currency) }}</ui5-text></span
          >
        </div>
      </ui5-li>
    </ui5-list>
    <template #actions>
      <ui5-button icon="list" @click="onViewAll" design="Emphasized">
        {{ $t('buttons.view_all_history') }}
      </ui5-button>
    </template>
  </DashboardCardLayout>
</template>
<script setup lang="ts">
import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
import { useFormatter } from '@/composables/useFormatter.ts';

import '@ui5/webcomponents/dist/Text.js';

defineProps<{
  sessions: Array<{
    id: string | number;
    station: string;
    date: string;
    energy: number;
    amount: number;
    currency: string;
  }>;
  onViewAll: () => void;
}>();

const { formatDate, formatKWh, formatPrice } = useFormatter();
</script>
<style scoped>
.history-title {
  display: flex;
  align-items: center;
}
.count-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
}
.secondary {
  color: #7f8b97;
  font-size: 0.95em;
  margin-bottom: 8px;
}
.available-count {
  font-size: 2.2em;
  font-weight: bold;
  margin-left: 4px;
  color: #1866b4;
}
.li-content {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.li-content > *:not(.price) {
  flex: 1;
  min-width: 0;
}
.li-station {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-right: 0.5em;
}
.li-content > *:not(.li-station):not(.price) {
  flex: 1;
  min-width: 0;
}
.price {
  margin-left: auto;
  font-weight: bold;
}
</style>
