<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="dashboard-generic-layout-root">
    <Transition name="highlighted-card" mode="out-in" appear>
      <div v-if="highlightedCard" class="dashboard-highlighted-card">
        <slot name="highlighted-card" />
      </div>
    </Transition>
    <div class="dashboard-generic-cards">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    highlightedCard?: boolean;
  }>(),
  {
    highlightedCard: false,
  },
);
</script>

<style scoped>
.dashboard-generic-layout-root {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  width: 100%;
  max-width: 100vw;
}

.dashboard-highlighted-card {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.dashboard-generic-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}
@media (min-width: 900px) {
  .dashboard-generic-layout-root {
    align-items: stretch;
  }
  .dashboard-highlighted-card {
    grid-column: 1 / -1;
    margin-bottom: 0;
  }
  .dashboard-generic-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1200px) {
  .dashboard-generic-cards {
    grid-template-columns: 2fr 3fr 2fr;
  }
}
@media (max-width: 900px) {
  .dashboard-generic-cards {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    width: 100%;
    max-width: 100vw;
    padding: 0 0.5rem;
    box-sizing: border-box;
  }
  .dashboard-generic-layout-root {
    align-items: stretch;
    width: 100%;
    max-width: 100vw;
  }
  .dashboard-highlighted-card {
    max-width: 100vw;
    width: 100%;
    margin: 0;
  }
  .dashboard-generic-cards > * {
    width: 100% !important;
    max-width: 100vw;
    min-width: 0;
    margin: 0;
    box-sizing: border-box;
    height: auto !important;
  }
  .dashboard-generic-cards > *:not(:last-child) {
    margin-bottom: 1rem;
  }
  .dashboard-generic-cards .ui5-card,
  .dashboard-generic-cards .ui5-card-content,
  .dashboard-generic-cards .card-content {
    min-height: unset !important;
    height: auto !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
.dashboard-generic-cards > * {
  width: 100%;
  max-width: 100%;
  height: auto !important;
  box-sizing: border-box;
}
/* Card content vertical centering and button alignment */
.dashboard-generic-cards .ui5-card-content,
.dashboard-generic-cards .card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: 100%;
  position: relative;
}
.dashboard-generic-cards .actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  width: 100%;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

/* Highlighted card animation - fade + slide from top */
.highlighted-card-enter-active {
  transition: all 0.4s ease-out;
}

.highlighted-card-leave-active {
  transition: all 0.3s ease-in;
}

.highlighted-card-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.highlighted-card-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.highlighted-card-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.highlighted-card-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .highlighted-card-enter-active,
  .highlighted-card-leave-active {
    transition: opacity 0.2s ease;
  }

  .highlighted-card-enter-from,
  .highlighted-card-leave-to {
    transform: none;
  }
}
</style>
