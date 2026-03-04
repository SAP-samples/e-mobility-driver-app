<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ResponsiveGridLayout :minWidth="'320px'" :maxColumns="1">
    <Sessions
      :sessions-in-progress="sessionsInProgress || []"
      :sessions="sessions || []"
      :grouped-history="groupedHistory"
      :selected-filter="timeFilter"
      :has-more-history="sessionsStore.sessionHistory.hasMore"
      :loading-history="sessionsStore.sessionHistory.loading"
      @filter-change="onFilterChange"
      @fetch-sessions-in-progress="() => sessionsStore.loadInProgressSessions()"
      @fetch-sessions-history="() => loadFilteredSessions()"
      @load-more-history="onLoadMoreHistory"
    />
  </ResponsiveGridLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import ResponsiveGridLayout from '@/components/layout/ResponsiveGridLayout.vue';
import Sessions from '@/components/sessions/Sessions.vue';
import { type SessionTimeFilter, useSessionsStore } from '@/store/sessions';

const sessionsStore = useSessionsStore();
// Filter state
const timeFilter = ref<SessionTimeFilter>('month');

const sessions = computed(() => sessionsStore.sessionHistory.data || []);
const sessionsInProgress = computed(() => sessionsStore.sessionsInProgress.data || []);
const groupedHistory = computed(() => {
  const groups: Record<string, typeof sessions.value> = {};
  sessions.value.forEach((session) => {
    const date = new Date(session.timestamp);
    const groupKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(session);
  });
  return groups;
});

async function loadFilteredSessions() {
  switch (timeFilter.value) {
    case 'month':
      await sessionsStore.findThisMonth();
      break;
    case 'year':
      await sessionsStore.findThisYear();
      break;
    case 'all':
      await sessionsStore.loadCompleted();
      break;
  }
}

async function onFilterChange(filter: SessionTimeFilter) {
  timeFilter.value = filter;
  await loadFilteredSessions();
}

async function onLoadMoreHistory() {
  await sessionsStore.loadMoreHistory();
}

onMounted(() => {
  sessionsStore.loadInProgressSessions();
  loadFilteredSessions();
});
</script>
