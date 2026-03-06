<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div style="max-width: 250px; min-width: 200px; padding: 0.5rem">
    <ui5-title level="H5">{{ evse.name || 'EVSE' }}</ui5-title>
    <div>
      <ui5-label>Code:</ui5-label>
      <ui5-text>{{ evse.code || '-' }}</ui5-text>
    </div>
    <div>
      <ui5-label>Location:</ui5-label>
      <ui5-text>{{ evse.location?.siteName || '-' }}</ui5-text>
    </div>
    <div style="margin-top: 0.5rem">
      <div
        v-for="connector in evse.connectors || []"
        :key="connector.connectorId"
        style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5em"
      >
        <ui5-label style="font-weight: bold">
          Connector {{ String.fromCharCode(65 + (connector.connectorId - 1)) }}
        </ui5-label>
        <ui5-text>{{ connector.type || '-' }}</ui5-text>
        <EvseStatusTag
          v-if="connector.status"
          :evse="{ id: `${connector.connectorId}`, connectors: [connector] }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import EvseStatusTag from '@/components/stations/shared/EvseStatusTag.vue';
import type { Evse } from '@/store/evse';
import '@ui5/webcomponents/dist/Tag.js';

defineProps<{ evse: Evse }>();
</script>
