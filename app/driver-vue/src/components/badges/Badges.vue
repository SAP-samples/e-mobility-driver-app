<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <BadgeItem
    v-for="badge in badges"
    :key="badge.authenticationId"
    :badge="badge"
    :datakey="badge.authenticationId"
  />
  <LoadMoreButton :has-more="hasMore" :loading="loading" @load-more="$emit('load-more')" />
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/List.js';

import BadgeItem from '@/components/badges/BadgeItem.vue';
import LoadMoreButton from '@/components/shared/LoadMoreButton.vue';
import type { Badge } from '@/store/badges';

defineProps<{
  badges: Badge[];
  hasMore: boolean;
  loading: boolean;
}>();

defineEmits<{
  'load-more': [];
}>();
</script>

<style scoped></style>
