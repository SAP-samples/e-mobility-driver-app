<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <SessionItem
    v-for="session in sessionsInProgress"
    :key="session.id"
    :session="session"
  ></SessionItem>
  <ui5-segmented-button
    class="right"
    :accessible-name="$t('filter.time_filter')"
    @ui5-selection-change="onFilterChange"
  >
    <ui5-segmented-button-item :selected="selectedFilter === 'month'" data-filter="month">
      {{ $t('filter.month') }}
    </ui5-segmented-button-item>
    <ui5-segmented-button-item :selected="selectedFilter === 'year'" data-filter="year">
      {{ $t('filter.year') }}
    </ui5-segmented-button-item>
    <ui5-segmented-button-item :selected="selectedFilter === 'all'" data-filter="all">
      {{ $t('filter.all') }}
    </ui5-segmented-button-item>
  </ui5-segmented-button>
  <NoData
    v-if="(sessions?.length ?? 0) === 0"
    :title="$t('messages.no_sessions')"
    @action="onGoHome"
  />
  <template v-else>
    <SessionItem v-for="session in sessions" :key="session.id" :session="session"></SessionItem>
    <LoadMoreButton
      :has-more="hasMoreHistory"
      :loading="loadingHistory"
      @load-more="$emit('load-more-history')"
    />
  </template>
</template>

<script lang="ts" setup>
import '@ui5/webcomponents-fiori/dist/Timeline.js';
import '@ui5/webcomponents-fiori/dist/TimelineGroupItem.js';
import '@ui5/webcomponents/dist/SegmentedButton.js';
import '@ui5/webcomponents/dist/SegmentedButtonItem.js';

import { useRouter } from 'vue-router';

import SessionItem from '@/components/sessions/SessionItem.vue';
import LoadMoreButton from '@/components/shared/LoadMoreButton.vue';
import NoData from '@/components/shared/NoData.vue';
import { type Session, type SessionTimeFilter } from '@/store/sessions';

const router = useRouter();
type GroupedHistory = Record<string, Session[]>;

defineProps<{
  sessionsInProgress: Session[];
  sessions: Session[];
  groupedHistory?: GroupedHistory;
  selectedFilter: SessionTimeFilter;
  hasMoreHistory: boolean;
  loadingHistory: boolean;
}>();

const emit = defineEmits<{
  filterChange: [filter: SessionTimeFilter];
  'load-more-history': [];
}>();

function onGoHome() {
  router.push({ name: 'Home' });
}

function onFilterChange(event: CustomEvent) {
  const selectedItems = event.detail.selectedItems;
  if (selectedItems && selectedItems.length > 0) {
    const selectedItem = selectedItems[0];
    const filter = selectedItem.getAttribute('data-filter') as SessionTimeFilter;
    emit('filterChange', filter);
  }
}
</script>

<style scoped>
.right {
  margin: auto 1rem auto auto;
}
</style>
