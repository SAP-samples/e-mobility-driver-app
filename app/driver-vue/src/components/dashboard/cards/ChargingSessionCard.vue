<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="illustration">
        <ui5-illustrated-message name="SimpleConnection" size="Auto">
          <span slot="title" />
          <span slot="subtitle" />
        </ui5-illustrated-message>
      </div>
      <div class="session-title">
        <ui5-icon name="business-suite/manage-charging-stations" style="margin-right: 0.3em" />
        <span class="evse-id">{{ evseId }}</span>
      </div>
    </template>
    <div class="row">
      <div class="session-details">
        <ui5-icon name="functional-location" style="color: #2b2d30; margin-right: 0.5em" />
        <strong>{{ parkingName }}</strong>
      </div>
      <div class="data">
        <ui5-icon name="money-bills" style="color: #256f3a; margin-right: 0.5em" />
        <span class="amount">{{ formatedPrice }} </span>
        <ui5-icon name="energy-saving-lightbulb" style="color: #1866b4; margin: 0 0.5em" />
        <span class="energy">{{ formatedKwh }}</span>
      </div>
    </div>
    <div class="secondary">
      {{ stopped ? $t('session.finishing') : $t('session.charging_in_progress') }}
    </div>
    <div class="timer-row">
      <ui5-icon name="in-progress" style="color: #1866b4; margin-right: 0.5em" />
      <DurationTimer :start="startDate" />
    </div>
    <template #actions>
      <StopSessionButton :sessionId="sessionId" :stopped="stopped" />
    </template>
  </DashboardCardLayout>
</template>

<script setup lang="ts">
import '@ui5/webcomponents-fiori/dist/IllustratedMessage.js';
import '@ui5/webcomponents-fiori/dist/illustrations/Connection.js';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleConnection.js';

import { computed } from 'vue';

import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
import StopSessionButton from '@/components/sessions/StopSessionButton.vue';
import DurationTimer from '@/components/shared/DurationTimer.vue';
import { useFormatter } from '@/composables/useFormatter.ts';

const { formatKWh, formatPrice } = useFormatter();
const formatedPrice = computed(() => {
  return formatPrice(Number(props.amount.toFixed(2)), '€');
});

const formatedKwh = computed(() => {
  return formatKWh(Number(props.energy.toFixed(2)));
});

const props = defineProps<{
  sessionId: number;
  parkingName: string;
  evseId: string;
  status?: string;
  amount: number;
  energy: number;
  startDate: string | Date;
  stopped: boolean;
}>();
</script>

<style scoped>
.session-details {
  display: flex;
  align-items: center;
  font-size: 0.95em;
  color: #7f8b97;
  margin-top: 2px;
}
.evse-id {
  margin-right: 1em;
}

.row {
  display: flex;
  flex-direction: column;
  margin: 8px 0;
}

.row .data {
  display: flex;
  align-items: baseline;
  justify-content: start;
  margin: 8px 0;
}

.illustration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration ui5-illustrated-message {
  width: 100%;
  height: 100%;
}

.session-title {
  display: flex;
  align-items: center;
}
.secondary {
  color: #7f8b97;
  font-size: 0.95em;
  text-align: right;
}
.row .amount,
.row .energy {
  font-size: 1.3em;
  font-weight: bold;
  margin-left: 2px;
}
.timer-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
