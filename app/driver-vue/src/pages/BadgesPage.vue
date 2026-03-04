<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ResponsiveGridLayout :minWidth="'320px'" :maxColumns="maxColumn">
    <NoData v-if="badges.length === 0" :title="$t('pages.no_badges_found')" @action="onGoHome" />
    <Badges
      v-else
      :badges="badges"
      :has-more="badgesStore.badges.hasMore"
      :loading="badgesStore.badges.loading"
      @load-more="onLoadMore"
    />
  </ResponsiveGridLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import Badges from '@/components/badges/Badges.vue';
import ResponsiveGridLayout from '@/components/layout/ResponsiveGridLayout.vue';
import NoData from '@/components/shared/NoData.vue';
import { useBadgesStore } from '@/store/badges';
import { useUiStore } from '@/store/uiStore';

const badgesStore = useBadgesStore();
const uiStore = useUiStore();
const router = useRouter();
const badges = computed(() => badgesStore.badges.data || []);
const maxColumn = computed(() => (badges.value.length === 0 || uiStore.isMobile ? 1 : null));

function onGoHome() {
  router.push({ name: 'Home' });
}

async function onLoadMore() {
  await badgesStore.loadMoreBadges();
}

onMounted(() => {
  badgesStore.loadAll();
});
</script>
