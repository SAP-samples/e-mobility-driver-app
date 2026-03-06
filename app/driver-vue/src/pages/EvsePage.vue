<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DynamicPageLayout
    id="evse-detail-page"
    :loading="evseStore.selectedEvseContext.loading"
    :loadingText="$t('pages.loading_evse_details')"
  >
    <template #titleArea>
      <EvsePageTitle
        v-if="evseStore.selectedEvseContext.data"
        :evse="evseStore.selectedEvseContext.data"
      />
    </template>

    <template #headerArea>
      <EvsePageHeader
        v-if="evseStore.selectedEvseContext.data"
        :evse="evseStore.selectedEvseContext.data"
      />
    </template>

    <template v-if="!evseStore.selectedEvseContext.data && !evseStore.selectedEvseContext.loading">
      <NoData
        :title="evseStore.selectedEvseContext.error || $t('pages.no_station_data')"
        @action="onGoHome"
      />
    </template>

    <template v-else-if="evseStore.selectedEvseContext.data">
      <ui5-panel style="margin-bottom: 2rem" :header-text="$t('location.location_and_map')">
        <div style="width: 100%; min-width: 400px; margin-bottom: 2rem">
          <EvseMap
            :key="evseStore.selectedEvseContext.data.id"
            :evse="evseStore.selectedEvseContext.data"
          />
        </div>
        <div style="width: 100%; min-width: 300px">
          <EvseAddress :evse="evseStore.selectedEvseContext.data" />
        </div>
      </ui5-panel>

      <EvseConnectorsTable
        v-if="evseStore.selectedEvseContext.data.connectors"
        :connectors="formattedConnectors"
      />
    </template>

    <!-- Error handling for selected EVSE -->
    <div v-if="evseStore.selectedEvseContext.error" class="error-banner">
      <p>{{ evseStore.selectedEvseContext.error }}</p>
      <button @click="evseStore.clearSelectedEvseError">{{ $t('common.dismiss') }}</button>
    </div>
  </DynamicPageLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import DynamicPageLayout from '@/components/layout/DynamicPageLayout.vue';
import NoData from '@/components/shared/NoData.vue';
import EvseAddress from '@/components/stations/detail/EvseAddress.vue';
import EvseConnectorsTable from '@/components/stations/detail/EvseConnectorsTable.vue';
import EvseMap from '@/components/stations/detail/EvseMap.vue';
import EvsePageHeader from '@/components/stations/detail/EvsePageHeader.vue';
import EvsePageTitle from '@/components/stations/detail/EvsePageTitle.vue';
import { type Connector, useEvseStore } from '@/store/evse';

// UI5 Components
import '@ui5/webcomponents-fiori/dist/DynamicPage.js';
import '@ui5/webcomponents-fiori/dist/DynamicPageTitle.js';
import '@ui5/webcomponents-fiori/dist/DynamicPageHeader.js';
import '@ui5/webcomponents/dist/Panel.js';
import '@ui5/webcomponents/dist/Bar.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/BusyIndicator.js';

const route = useRoute();
const router = useRouter();
const evseStore = useEvseStore();

// Format connectors for the table component
const formattedConnectors = computed(() => {
  if (!evseStore.selectedEvseContext.data?.connectors) return [];

  return evseStore.selectedEvseContext.data.connectors.map((c: Connector) => ({
    ...c,
    connectorId: String(c.connectorId),
    type: c.type ?? '',
    currentType: c.currentType ?? '',
    status: c.status ?? '',
    voltage: c.voltage ?? '',
    numberOfPhases: c.numberOfPhases ?? '',
    evseIndex: c.evseIndex ?? '',
    current: c.current ?? '',
    currentLimit: c.currentLimit ?? '',
    maximumPower: c.maximumPower ?? '',
  }));
});

const updateEvse = async () => {
  const id = route.params.id as string;
  if (id) {
    await evseStore.fetchById(id);
  }
};

function onGoHome() {
  router.push({ name: 'Home' });
}

onMounted(updateEvse);
watch(() => route.params.id, updateEvse);
</script>
