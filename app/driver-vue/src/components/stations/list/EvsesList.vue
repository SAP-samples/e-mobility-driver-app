<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-list>
    <template v-for="(evses, group) in groupedEvses" :key="group">
      <ui5-li-group :header-text="group">
        <EvseItem
          v-for="evse in evses"
          :key="evse.id"
          :evse="evse"
          :selected="evse.id === selectedEvse?.id"
          @click="$emit('evse-selected', evse)"
        />
      </ui5-li-group>
    </template>
  </ui5-list>

  <!-- Load More Button -->
  <div v-if="hasMorePages" class="load-more-container">
    <ui5-button data-testid="load-more" design="Emphasized" @click="$emit('load-more')">
      {{ $t('list.load_more_results') }}
    </ui5-button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import '@ui5/webcomponents/dist/List.js';
import '@ui5/webcomponents/dist/Button.js';

import EvseItem from '@/components/stations/list/EvseItem.vue';
import type { Evse } from '@/store/evse';

const { t } = useI18n();

const props = defineProps({
  evses: { type: Array as PropType<Evse[]>, required: true },
  selectedEvse: { type: Object as PropType<Evse | null>, default: null },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  hasMorePages: { type: Boolean, default: false },
});

defineEmits(['evse-selected', 'load-more']);

const groupedEvses = computed(() => {
  const groups: Record<string, Evse[]> = {};
  for (const evse of props.evses) {
    const group = evse.location?.siteAreaName || t('list.other');
    if (!groups[group]) groups[group] = [];
    groups[group].push(evse);
  }
  return groups;
});
</script>

<style scoped>
.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding: 1rem;
}
</style>
