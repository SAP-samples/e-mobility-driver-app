<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-dynamic-page-title slot="titleArea">
    <ui5-breadcrumbs slot="breadcrumbs" @item-click="onBreadcrumbClick">
      <ui5-breadcrumbs-item id="stations-breadcrumb" style="cursor: pointer">{{
        $t('station.stations')
      }}</ui5-breadcrumbs-item>
      <ui5-breadcrumbs-item>{{ evse?.code || $t('station.evse') }}</ui5-breadcrumbs-item>
    </ui5-breadcrumbs>
    <ui5-title slot="heading">{{ evse?.name || evse?.code || '' }}</ui5-title>
    <div slot="snappedHeading">
      <ui5-title wrapping-type="None">{{ evse?.name || evse?.code || '' }}</ui5-title>
    </div>
    <p slot="subheading" class="text">
      <EvseStatusTag v-if="evse" :evse="evse" />
    </p>
    <p slot="snappedSubheading" class="text">
      <EvseStatusTag v-if="evse" :evse="evse" />
    </p>

    <ui5-toolbar class="actionsBar" id="actionsToolbar" slot="actionsBar" design="Transparent">
      <EvseStartButton :evse="evse"></EvseStartButton>
    </ui5-toolbar>
  </ui5-dynamic-page-title>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

import '@ui5/webcomponents-fiori/dist/DynamicPageTitle.js';
import '@ui5/webcomponents/dist/Avatar.js';
import '@ui5/webcomponents/dist/Breadcrumbs.js';
import '@ui5/webcomponents/dist/BreadcrumbsItem.js';
import '@ui5/webcomponents/dist/Tag.js';
import '@ui5/webcomponents/dist/Title.js';
import '@ui5/webcomponents/dist/Toolbar.js';
import '@ui5/webcomponents/dist/ToolbarButton.js';
import EvseStartButton from '@/components/stations/shared/EvseStartButton.vue';
import EvseStatusTag from '@/components/stations/shared/EvseStatusTag.vue';
import type { Evse } from '@/store/evse';

defineProps<{ evse: Evse }>();
const $router = useRouter();

function onBreadcrumbClick() {
  $router.push({ name: 'Stations' });
}
</script>

<style scoped>
.snapped-title-heading {
  display: flex;
  align-items: center;
  position: relative;
}
.snapped-title-heading [ui5-avatar] {
  position: absolute;
  top: 0;
}
.snapped-title-heading [ui5-title] {
  font-family: var(--sapObjectHeader_Title_FontFamily);
  color: var(--sapObjectHeader_Title_TextColor);
  padding: 0.3125rem 0 0 0;
  font-size: var(--sapObjectHeader_Title_SnappedFontSize);
  text-overflow: ellipsis;
  min-width: 0;
  margin-left: 4rem;
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
