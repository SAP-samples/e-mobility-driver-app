<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-dynamic-page-header slot="headerArea">
    <div class="product-info">
      <div class="product-info-cell">
        <ui5-label>{{ $t('station.charging_station_name') }}</ui5-label>
        <p class="text">{{ evse?.chargingStationName || '' }}</p>
      </div>
      <div class="product-info-cell">
        <ui5-label>{{ $t('station.emi3_id') }}</ui5-label>
        <p class="text">{{ evse?.emi3Id || '' }}</p>
      </div>
    </div>
  </ui5-dynamic-page-header>
</template>

<script lang="ts" setup>
import '@ui5/webcomponents-fiori/dist/DynamicPageHeader.js';
import '@ui5/webcomponents/dist/Label.js';
import type { Evse } from '@/store/evse';
defineProps<{ evse: Evse }>();
</script>

<style scoped>
.product-info {
  display: flex;
  flex-wrap: wrap;
}
.product-info-cell {
  display: flex;
  gap: 5px;
  flex-direction: column;
  margin-right: 2rem;
  margin-bottom: 1rem;
}
.text {
  display: inline-block;
  font-size: var(--sapFontSize);
  font-family: var(--sapFontFamily);
  color: var(--sapTextColor);
  line-height: normal;
  white-space: pre-line;
  word-wrap: break-word;
  cursor: text;
  margin: 0;
}
</style>
