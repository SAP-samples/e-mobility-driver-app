<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-card :class="badge.active ? '' : 'inactive'" data-testid="badge-item">
    <ui5-card-header
      slot="header"
      :subtitle-text="badge.description"
      :title-text="badge.visualBadgeId"
    >
      <ui5-icon slot="avatar" name="business-card"></ui5-icon>
    </ui5-card-header>
    <div class="content content-padding">
      <div class="row">
        <ui5-label show-colon>{{ $t('badge.authentication_id') }}</ui5-label>
        <ui5-text>{{ badge.authenticationId }}</ui5-text>
      </div>
      <div class="row">
        <ui5-label show-colon>{{ $t('badge.first_name') }}</ui5-label>
        <ui5-text>{{ badge.firstName }}</ui5-text>
      </div>
      <div class="row">
        <ui5-label show-colon>{{ $t('badge.last_name') }}</ui5-label>
        <ui5-text>{{ badge.lastName }}</ui5-text>
      </div>
      <div class="row">
        <ui5-label show-colon>{{ $t('badge.car_license') }}</ui5-label>
        <ui5-text>{{ badge.licensePlate }}</ui5-text>
      </div>
      <ui5-bar design="Footer" class="footer">
        <ui5-tag
          :design="badge.active ? 'Positive' : 'Negative'"
          wrapping-type="None"
          slot="endContent"
        >
          {{ badge.active ? $t('badge.active') : $t('badge.expired') }}
        </ui5-tag>
      </ui5-bar>
    </div>
  </ui5-card>
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/Card.js';
import '@ui5/webcomponents/dist/CardHeader.js';
import '@ui5/webcomponents/dist/Bar.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Text.js';
import '@ui5/webcomponents/dist/Tag.js';

import type { Badge } from '@/store/badges';

defineProps<{ badge: Badge }>();
</script>

<style scoped>
ui5-card {
  flex-grow: 1;
}

ui5-card.inactive {
  opacity: 0.5;
}

.content {
  display: flex;
  flex-direction: column;
  padding-block-end: 1rem;
}

.content-padding {
  padding: 0.5rem 1rem 0 1rem;
  box-sizing: border-box;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
</style>
