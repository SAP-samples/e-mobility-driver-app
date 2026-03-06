<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="responsive-grid-layout">
    <slot />
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    minWidth?: string;
    maxColumns?: number | null;
    gap?: string;
  }>(),
  {
    minWidth: '320px',
    maxColumns: 4,
    gap: '1rem',
  },
);
</script>

<style scoped>
.responsive-grid-layout {
  display: grid;
  grid-template-columns: repeat(var(--max-columns, auto-fit), minmax(var(--min-width, 320px), 1fr));
  gap: var(--gap, 1rem);
  width: 100%;
}
</style>

<script lang="ts">
export default {
  mounted() {
    const root = this.$el as HTMLElement;
    const { minWidth, gap, maxColumns } = this.$props;
    root.style.setProperty('--min-width', minWidth || '320px');
    root.style.setProperty('--gap', gap || '1rem');
    root.style.setProperty('--max-columns', maxColumns != null ? String(maxColumns) : 'auto-fit');
  },
  watch: {
    minWidth(val: string) {
      (this.$el as HTMLElement).style.setProperty('--min-width', val);
    },
    gap(val: string) {
      (this.$el as HTMLElement).style.setProperty('--gap', val);
    },
    maxColumns(val: number | null | undefined) {
      (this.$el as HTMLElement).style.setProperty(
        '--max-columns',
        val != null ? String(val) : 'auto-fit',
      );
    },
  },
};
</script>
