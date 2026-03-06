<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div>
    <ui5-tab-container
      ref="tabContainer"
      v-ui5-custom-tab-container="options"
      data-testid="tab-container"
    >
      <ui5-tab text="Tab 1" data-testid="tab-1">Content 1</ui5-tab>
      <ui5-tab text="Tab 2" data-testid="tab-2">Content 2</ui5-tab>
      <ui5-tab text="Tab 3" data-testid="tab-3">Content 3</ui5-tab>
    </ui5-tab-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TabContainerOptions } from '@/directives/ui5CustomTabContainer';

interface Props {
  options?: TabContainerOptions;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({} as TabContainerOptions),
});

const tabContainer = ref<HTMLElement | null>(null);

// Expose for testing
defineExpose({
  tabContainer,
  getShadowRoot: () => tabContainer.value?.shadowRoot,
  updateOptions: (newOptions: TabContainerOptions) => {
    Object.assign(props.options, newOptions);
  },
});
</script>
