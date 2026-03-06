<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-panel :collapsed="session.status !== 'InProgress'">
    <div slot="header" class="header">
      <ui5-label
        >{{ formatDate(session.timestamp) }} -
        {{ session.evseCode || session.chargingStationName }}</ui5-label
      >
      <ui5-tag design="Positive" wrapping-type="None">
        {{ formatPrice(session.cumulatedPrice, session.currency) }}
      </ui5-tag>
    </div>
    <div class="row">
      <ui5-label>{{ $t('session.id') }}</ui5-label>
      <ui5-text>{{ session.id }}</ui5-text>
    </div>
    <div class="row">
      <ui5-label>{{ $t('session.date') }}</ui5-label>
      <ui5-text>{{ formatDateTime(session.timestamp) }}</ui5-text>
    </div>
    <div class="row">
      <ui5-label>{{ $t('session.energy') }}</ui5-label>
      <ui5-text>{{ formatKWh(session.totalEnergyDelivered) }}</ui5-text>
    </div>
    <div class="row">
      <ui5-label>{{ $t('session.duration') }}</ui5-label>
      <ui5-text>{{ formatDuration(session.totalDuration) }}</ui5-text>
    </div>
    <div class="row">
      <ui5-label>{{ $t('session.location') }}</ui5-label>
      <ui5-text>{{ session.siteName }} - {{ session.siteAreaName }}</ui5-text>
    </div>
    <div v-if="session.status === 'InProgress'">
      <ui5-bar design="Footer" class="footer">
        <StopSessionButton
          :sessionId="session.id"
          :stopped="session.stop_extraInactivity != null"
        />
      </ui5-bar>
    </div>
  </ui5-panel>
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/Panel.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Text.js';
import '@ui5/webcomponents/dist/Tag.js';
import '@ui5/webcomponents/dist/Bar.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Dialog.js';
import '@ui5/webcomponents/dist/Toolbar.js';
import '@ui5/webcomponents/dist/ToolbarButton.js';

import StopSessionButton from '@/components/sessions/StopSessionButton.vue';
import { useFormatter } from '@/composables/useFormatter.ts';
import { type Session } from '@/store/sessions';

defineProps<{ session: Session }>();
const { formatDate, formatDateTime, formatDuration, formatKWh, formatPrice } = useFormatter();
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.footer {
  border: none;
}
ui5-panel {
  flex: 0 0 100%;
}
</style>
