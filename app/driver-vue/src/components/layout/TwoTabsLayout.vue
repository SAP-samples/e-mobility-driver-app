<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="two-tab-layout-root">
    <slot name="header" />
    <ui5-tabcontainer
      class="tabs-flex"
      v-ui5-custom-tab-container="tabContainerProps"
      :show-overflow="showOverflow"
    >
      <ui5-tab :text="tab1.text" :icon="tab1.icon" v-bind="tab1.options">
        <div class="tab-content">
          <slot name="tab1" />
        </div>
      </ui5-tab>
      <ui5-tab :text="tab2.text" :icon="tab2.icon" v-bind="tab2.options">
        <div class="tab-content">
          <slot name="tab2" />
        </div>
      </ui5-tab>
    </ui5-tabcontainer>
  </div>
</template>

<script lang="ts" setup>
interface TabConfig {
  text: string;
  icon?: string;
  options?: Record<string, unknown>;
}

withDefaults(
  defineProps<{
    tab1: TabConfig;
    tab2: TabConfig;
    tabContainerProps?: Record<string, unknown>;
    showOverflow?: boolean;
  }>(),
  {
    tab1: () => ({ text: 'Tab 1' }),
    tab2: () => ({ text: 'Tab 2' }),
    tabContainerProps: () => ({
      distribution: 'flex',
      labelPlacement: 'right',
      hideOverflow: true,
    }),
    showOverflow: false,
  },
);
</script>

<style scoped>
.two-tab-layout-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.tabs-flex {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}
</style>
