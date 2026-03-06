<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-panel class="margin-bottom" :header-text="$t('station.connectors')" sticky-header>
    <ui5-table id="table">
      <ui5-table-header-row slot="headerRow" sticky>
        <ui5-table-header-cell>{{ $t('station.connector_id') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_type') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_current_type') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_voltage') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_phases') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_evse_index') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_current') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_current_limit') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_status') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('station.connector_max_power') }}</ui5-table-header-cell>
      </ui5-table-header-row>
      <ui5-table-row v-for="connector in safeConnectors" :key="connector.connectorId">
        <ui5-table-cell
          ><ui5-text>{{ connector.connectorId }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell
          ><ui5-text>{{ connector.type }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell
          ><ui5-text>{{ connector.currentType }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell
          ><ui5-text>{{ connector.voltage }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell
          ><ui5-text>{{ connector.numberOfPhases }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell>
          <ui5-text>{{ connector.evseIndex }}</ui5-text>
        </ui5-table-cell>
        <ui5-table-cell
          ><ui5-text>{{ connector.current }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell
          ><ui5-text>{{ connector.currentLimit }}</ui5-text></ui5-table-cell
        >
        <ui5-table-cell>
          <ui5-text :style="statusColorStyle(connector.status)">{{
            getConnectorOcpiStatusDisplay(connector.status)
          }}</ui5-text>
        </ui5-table-cell>
        <ui5-table-cell
          ><ui5-text>{{ connector.maximumPower }}</ui5-text></ui5-table-cell
        >
      </ui5-table-row>
    </ui5-table>
  </ui5-panel>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import '@ui5/webcomponents/dist/Panel.js';
import '@ui5/webcomponents/dist/Table.js';
import '@ui5/webcomponents/dist/TableHeaderRow.js';
import '@ui5/webcomponents/dist/TableHeaderCell.js';
import '@ui5/webcomponents/dist/TableRow.js';
import '@ui5/webcomponents/dist/TableCell.js';
import '@ui5/webcomponents/dist/Text.js';
import { useEvseStatusState } from '@/composables/useEvseStatusState.ts';

interface Connector {
  connectorId: string;
  type: string;
  currentType: string;
  voltage: number | string;
  numberOfPhases: number | string;
  evseIndex: number | string;
  current: number | string;
  currentLimit: number | string;
  status: string;
  maximumPower: number | string;
}

const props = defineProps<{ connectors?: Connector[] }>();

const safeConnectors = computed(() => (Array.isArray(props.connectors) ? props.connectors : []));

const { getConnectorOcpiStatusDisplay } = useEvseStatusState();

const statusColorStyle = (status: string) => {
  const mapped = getConnectorOcpiStatusDisplay(status);
  switch (mapped) {
    case 'Available':
      return 'color: #2b7c2b;'; // green
    case 'Preparing':
    case 'Occupied':
    case 'Reserved':
      return 'color: #0070f2;'; // blue
    case 'Outoforder':
      return 'color: #bb0000;'; // red
    case 'Inoperative':
    case 'Disconnected':
      return 'color: #888888;'; // gray
    default:
      return '';
  }
};
</script>

<style scoped>
.margin-bottom {
  margin-bottom: 10px;
}
</style>
