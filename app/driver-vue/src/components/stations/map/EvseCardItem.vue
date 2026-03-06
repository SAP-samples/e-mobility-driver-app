<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-card class="evse-card">
    <ui5-card-header
      @click="goToDetail"
      interactive
      slot="header"
      :title-text="evse.name || evse.code || 'EVSE'"
      :subtitle-text="evse.location?.siteName || '-'"
    >
      <ui5-icon name="map" slot="avatar" />
      <div slot="action">
        <EvseStartButton :evse="evse" slot="action"></EvseStartButton>
      </div>
    </ui5-card-header>
    <div class="content content-padding" @click="goToDetail">
      <div class="card-tags-row">
        <EvseStatusTag v-if="evse" :evse="evse" class="evse-status-tag" />
        <span v-if="maxPower !== '-'" class="maxpower-badge"> ⚡ {{ maxPower }} kWh </span>
      </div>
      <div class="content-group">
        <ui5-label show-colon>{{ $t('station.site') }}</ui5-label>
        <ui5-text>{{ evse.location?.siteName || '-' }}</ui5-text>
      </div>
      <div class="content-group">
        <ui5-label show-colon>{{ $t('station.area') }}</ui5-label>
        <ui5-text>{{ evse.location?.siteAreaName || '-' }}</ui5-text>
      </div>
      <div class="content-group">
        <ui5-label show-colon>{{ $t('station.parking') }}</ui5-label>
        <ui5-text>
          <template v-if="evse.location">
            <span v-if="evse.location.parkingLevel"
              >{{ $t('station.level') }} {{ evse.location.parkingLevel }}</span
            >
            <span v-if="evse.location.parkingName">, {{ evse.location.parkingName }}</span>
            <span v-if="evse.location.parkingSpace"
              >, {{ $t('station.space') }} {{ evse.location.parkingSpace }}</span
            >
          </template>
          <template v-else>-</template>
        </ui5-text>
      </div>
      <div class="content-group">
        <ui5-label show-colon>{{ $t('station.connectors') }}</ui5-label>
        <ui5-table class="connector-table">
          <ui5-table-header-row slot="headerRow" sticky>
            <ui5-table-header-cell>{{ $t('station.type') }}</ui5-table-header-cell>
            <ui5-table-header-cell>{{ $t('station.connector_status') }}</ui5-table-header-cell>
            <ui5-table-header-cell>{{ $t('station.power') }}</ui5-table-header-cell>
          </ui5-table-header-row>
          <ui5-table-row v-for="connector in evse.connectors || []" :key="connector.connectorId">
            <ui5-table-cell>
              <ui5-icon name="disconnected" />
              <ui5-text>{{ connector.type || '-' }}</ui5-text>
            </ui5-table-cell>
            <ui5-table-cell class="connector-status-cell">
              <ui5-text class="connector-status-text">{{
                getConnectorOcpiStatusDisplay(connector.status) || '-'
              }}</ui5-text>
            </ui5-table-cell>
            <ui5-table-cell>
              <ui5-icon name="energy-saving-lightbulb" style="margin-right: 0.25rem" />
              <ui5-text>{{ formatPower(connector.maximumPower) }}</ui5-text>
            </ui5-table-cell>
          </ui5-table-row>
        </ui5-table>
      </div>
    </div>
  </ui5-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import EvseStartButton from '@/components/stations/shared/EvseStartButton.vue';
import EvseStatusTag from '@/components/stations/shared/EvseStatusTag.vue';
import { useEvseStatusState } from '@/composables/useEvseStatusState.ts';
import type { Connector, Evse } from '@/store/evse';

import '@ui5/webcomponents/dist/Table.js';
import '@ui5/webcomponents/dist/Text.js';

const props = defineProps<{ evse: Evse }>();
const router = useRouter();
const evseStatusState = useEvseStatusState();
const { getConnectorOcpiStatusDisplay } = evseStatusState;

const maxPower = computed(() => {
  if (!props.evse.connectors || !props.evse.connectors.length) return '-';
  const maxWatt = Math.max(
    ...props.evse.connectors.map((c: Connector) => Number(c.maximumPower) || 0),
  );
  if (!maxWatt || isNaN(maxWatt)) return '-';
  return (maxWatt / 1000).toFixed(1);
});

function goToDetail() {
  router.push({ name: 'evse-detail', params: { id: props.evse.id } });
}

function formatPower(power?: number): string {
  if (!power || isNaN(power)) return '-';
  return (power / 1000).toFixed(1) + ' kWh';
}
</script>

<style scoped>
.evse-card {
  width: 100%;
  max-width: 350px;
  margin: 0.5rem auto;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.content,
.content-group {
  display: flex;
  flex-direction: column;
  padding-block-end: 1rem;
}
.content-padding {
  padding: 0.5rem 1rem 0 1rem;
  box-sizing: border-box;
}
.card-tags-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.connector-table {
  width: 100%;
  max-height: 150px; /* Adjust as needed - broken on safari*/
  margin-top: 0.5rem;
}
.connector-status-cell {
  text-align: right;
}
.evse-status-tag {
  margin-left: 0.5rem;
}
.maxpower-badge {
  background: #e6f7ff;
  color: #0070f2;
  font-weight: bold;
  border-radius: 1rem;
  padding: 0.2rem 0.75rem;
  font-size: 0.95em;
  display: inline-block;
  vertical-align: middle;
}
.connector-status-text {
  font-size: 0.95em;
  color: #666;
  font-weight: 500;
  padding: 0.1rem 0.5rem;
  border-radius: 0.5rem;
  background: #f5f5f5;
  display: inline-block;
}
.actionsBar {
  border: none;
}
</style>
