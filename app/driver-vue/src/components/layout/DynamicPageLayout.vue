<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="dynamic-page-layout-root">
    <ui5-dynamic-page :id="id">
      <slot name="titleArea" />
      <slot name="headerArea" />
      <template v-if="!loading">
        <slot />
      </template>
      <template v-else>
        <div class="dynamic-page-loading">
          <ui5-busy-indicator :active="true" size="L" :text="loadingText" />
        </div>
      </template>
    </ui5-dynamic-page>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    id?: string;
    loading?: boolean;
    loadingText?: string;
  }>(),
  {
    id: undefined,
    loading: false,
    loadingText: 'Loading...',
  },
);
</script>

<style scoped>
.dynamic-page-layout-root {
  height: calc(100dvh - 100px);
  width: 100vw;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.dynamic-page-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
}
</style>
