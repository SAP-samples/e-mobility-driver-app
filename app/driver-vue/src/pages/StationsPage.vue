<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <TwoTabsLayout
    :tab1="{ text: $t('map.text'), icon: 'globe' }"
    :tab2="{ text: $t('map.list'), icon: 'list' }"
  >
    <template #header>
      <EvseFilterBar class="search-bar no-margin" @search="onSearch" />
    </template>

    <template #tab1>
      <div class="map-and-cards">
        <!-- No Data: shown when there are no results and not loading -->
        <NoData
          v-if="evseStore.evses.isEmpty && !evseStore.evses.loading"
          :title="$t('pages.no_charging_stations_found')"
          @action="onGoHome"
        />

        <!-- Loading: shown only during initial load (when data is empty) -->
        <div v-if="evseStore.evses.loading && evseStore.evses.isEmpty" class="loading-state">
          <p>{{ $t('pages.searching_for_charging_stations') }}</p>
        </div>

        <!-- Map and List: Using v-if with !isEmpty condition to avoid unnecessary Leaflet
             initialization while preserving components during pagination (isEmpty stays false) -->
        <div v-if="!evseStore.evses.isEmpty" class="map-area">
          <EvsesMap :evses="evseStore.mapEvses" />
        </div>

        <EvseCardList
          v-if="!evseStore.evses.isEmpty"
          :evses="evseStore.evses.data"
          :has-more="evseStore.evses.hasMore"
          :loading="evseStore.evses.loading"
          @evse-selected="onEvseSelected"
          @load-more="onLoadMore"
        />
      </div>
    </template>

    <template #tab2>
      <NoData
        v-if="evseStore.evses.isEmpty && !evseStore.evses.loading"
        :title="$t('pages.no_charging_stations_found')"
        @action="onGoHome"
      />
      <div v-else-if="evseStore.evses.loading" class="loading-state">
        <p>{{ $t('pages.searching_for_charging_stations') }}</p>
      </div>
      <EvsesList
        v-else
        :evses="evseStore.evses.data"
        :total="evseStore.evses.total"
        :current-page="evseStore.evseCollection.currentPage"
        :has-more-pages="evseStore.evses.hasMore"
        @evse-selected="onEvseSelected"
        @load-more="onLoadMore"
      />
    </template>

    <!-- Error handling -->
    <div v-if="evseStore.evses.error" class="error-banner">
      <p>{{ evseStore.evses.error }}</p>
      <button @click="evseStore.clearError">{{ $t('common.dismiss') }}</button>
    </div>
  </TwoTabsLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import TwoTabsLayout from '@/components/layout/TwoTabsLayout.vue';
import NoData from '@/components/shared/NoData.vue';
import EvseFilterBar from '@/components/stations/filter/EvseFilterBar.vue';
import EvsesList from '@/components/stations/list/EvsesList.vue';
import EvseCardList from '@/components/stations/map/EvseCardList.vue';
import EvsesMap from '@/components/stations/map/EvsesMap.vue';
import { type Evse, useEvseStore } from '@/store/evse';

const evseStore = useEvseStore();
const router = useRouter();
const route = useRoute();

// Types
interface SearchPayload {
  value?: string;
  available?: boolean;
  fastCharging?: boolean;
  location?: {
    lat: number;
    lon: number;
    radius: number;
  };
  evseId?: string;
  sortDirection?: 'asc' | 'desc';
  pageArg?: number;
  pageSizeArg?: number;
}

const lastQuery = ref<SearchPayload | null>(null);

function onEvseSelected(evse: Evse) {
  evseStore.setSelectedEvse(evse);
  router.push({ name: 'evse-detail', params: { id: evse.id } });
}

async function onSearch(payload: SearchPayload) {
  lastQuery.value = payload;

  try {
    // Handle direct EVSE selection
    if (payload.evseId) {
      await router.push({ name: 'evse-detail', params: { id: payload.evseId } });
      return;
    }

    // Build query based on payload - handle both location and other filters together
    const query = evseStore.createQuery();

    // Apply location filter if present
    if (payload.location?.lat && payload.location?.lon && payload.location?.radius) {
      query.nearLocation(payload.location.lat, payload.location.lon, payload.location.radius);
    }

    // Apply text search if present (but not if this is a location-only search)
    if (payload.value && !payload.location) {
      query.search(payload.value);
    }

    // Apply availability filters
    if (payload.available) {
      query.connected().availableOnly();
    }

    if (payload.fastCharging) {
      query.fastChargingOnly();
    }

    // Apply sorting from payload (default to name asc)
    const sortDirection = payload.sortDirection || 'asc';
    query.setOrderBy('name', sortDirection).orderBy('code', sortDirection);

    // Apply pagination if present
    if (payload.pageArg) {
      query.page(payload.pageArg, payload.pageSizeArg || 100);
    }

    // Load EVSEs (automatically loads both list and map data)
    await evseStore.loadEvses(query);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search failed:', error);
  }
}

async function onLoadMore() {
  if (!evseStore.evses.hasMore) return;

  await evseStore.loadMoreEvses();
}

function onGoHome() {
  router.push({ name: 'Home' });
}

async function fetchEvsesForRoute() {
  const available = route.query.available === 'true';
  const siteArea = route.query.siteArea as string;

  const query = evseStore.createQuery();

  if (available) {
    query.connected().availableOnly();
  }

  if (siteArea) {
    query.inSiteArea(siteArea);
  }

  lastQuery.value = {
    available,
    value: siteArea, // Map siteArea to value for text search
    sortDirection: 'asc', // Default sort direction
  };

  // Load EVSEs (automatically loads both list and map data)
  await evseStore.loadEvses(query);
}

onMounted(fetchEvsesForRoute);

watch(() => route.query.siteArea, fetchEvsesForRoute);
watch(() => route.query.available, fetchEvsesForRoute);
watch(() => route.query.city, fetchEvsesForRoute);

watch(
  () => route.name,
  (newRoute, oldRoute) => {
    if (newRoute !== oldRoute && oldRoute === 'evse-search') {
      evseStore.clearResults();
    }
  },
);
</script>

<style scoped>
.no-margin {
  margin-bottom: 0;
}

.map-and-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 auto;
}

.map-area {
  height: 300px;
  min-height: 200px;
  max-height: 40vh;
  width: 100%;
  margin-bottom: 1rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--color-text-secondary);
}

.error-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-error);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-banner button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.error-banner button:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
