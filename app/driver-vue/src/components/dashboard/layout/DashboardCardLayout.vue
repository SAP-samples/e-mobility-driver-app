<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-card class="dashboard-card-layout">
    <div class="card-grid">
      <div class="card-title">
        <slot name="title" />
      </div>
      <div class="card-content" :class="{ 'with-actions': hasActions }">
        <slot />
      </div>
      <div class="card-actions">
        <slot name="actions" />
      </div>
    </div>
  </ui5-card>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const slots = useSlots();
const hasActions = computed(() => !!slots.actions && slots.actions().length > 0);
</script>

<style scoped>
.dashboard-card-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.card-grid {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-height: 0;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}
.card-title {
  min-height: 2.2em;
  font-weight: bold;
  font-size: 1.1em;
}
.card-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  width: 100%;
}

.card-content.with-actions {
  padding-bottom: 3.5em;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  min-height: 2.2em;
  width: auto;
  margin-top: 0.5em;
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 1;
  background: transparent;
}
@media (max-width: 600px) {
  .card-grid {
    padding: 8px;
  }
  .card-title,
  .card-actions {
    font-size: 1em;
    min-height: 1.5em;
  }
  .card-actions {
    right: 8px;
    bottom: 8px;
  }
}
</style>
