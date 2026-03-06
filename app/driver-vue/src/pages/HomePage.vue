<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardGenericLayout :highlightedCard="!!currentSession || showQRScanner">
    <template #highlighted-card>
      <DashboardChargingSessionCard
        v-if="currentSession"
        :sessionId="currentSession.id"
        :parkingName="currentSession.siteName || $t('common.unknown')"
        :evseId="currentSession.evseCode || currentSession.chargingStationName"
        :status="currentSession.status"
        :amount="currentSession.cumulatedPrice"
        :energy="currentSession.totalEnergyDelivered"
        :startDate="currentSession.timestamp"
        :stopped="currentSession.stop_extraInactivity != null"
      />

      <!-- QR Scanner card (when no session) -->
      <DashboardQRScannerCard
        v-else-if="showQRScanner"
        :busy="isLoading"
        @qr-scanned="onQRScanned"
        @browse-stations="onBrowseStations"
        @error="onQRError"
      />
    </template>
    <DashboardFavoriteLocationCard
      class="favorite-location-card"
      :locationName="favoriteLocation.name"
      :available="favoriteLocation.available"
      :loading="loading"
      @view-stations="onViewFavoriteLocationStations"
    />
    <DashboardQuickHistoryCard
      class="quick-history-card"
      :sessions="quickHistory"
      @view-all="onViewAllHistory"
    />
    <DashboardMonthlyTotalCard
      class="monthly-card"
      :totalSessions="monthlyStats.totalSessions"
      :totalKwh="monthlyStats.totalKwh"
      :totalAmount="monthlyStats.totalAmount"
    />
  </DashboardGenericLayout>

  <!-- Toast notifications -->
  <ui5-toast ref="errorToastRef" data-testid="error-toast" duration="5000" />
  <ui5-toast ref="preparingToastRef" data-testid="preparing-toast">
    {{ $t('session.preparing_action_required') }}
  </ui5-toast>
  <ui5-toast ref="warningToastRef" data-testid="warning-toast" duration="5000">
    {{ $t('session.start_warning') }}
  </ui5-toast>
  <ui5-toast ref="timeoutToastRef" data-testid="timeout-toast" duration="5000">
    {{ $t('session.timeout_info') }}
  </ui5-toast>
</template>

<script lang="ts" setup>
import type Toast from '@ui5/webcomponents/dist/Toast.js';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import DashboardChargingSessionCard from '@/components/dashboard/cards/ChargingSessionCard.vue';
import DashboardFavoriteLocationCard from '@/components/dashboard/cards/FavoriteLocationCard.vue';
import DashboardMonthlyTotalCard from '@/components/dashboard/cards/MonthlyTotalCard.vue';
import DashboardQRScannerCard from '@/components/dashboard/cards/QRScannerCard.vue';
import DashboardQuickHistoryCard from '@/components/dashboard/cards/QuickHistoryCard.vue';
import DashboardGenericLayout from '@/components/layout/DashboardGenericLayout.vue';
import { SessionStartError, SessionStartErrorCode } from '@/composables/errors/SessionStartError';
import { useFavoriteLocation } from '@/composables/useFavoriteLocation';
import { type QRData } from '@/composables/useQRScanner';
import { useSessionStart } from '@/composables/useSessionStart';
import { useBadgesStore } from '@/store/badges';
import { useSessionsStore } from '@/store/sessions';

const { t } = useI18n();
const sessionsStore = useSessionsStore();
const badgesStore = useBadgesStore();
const router = useRouter();

// Loading state (initial load only)
const isLoading = ref(true);

// Toast refs with proper typing
const errorToastRef = ref<Toast>();
const warningToastRef = ref<Toast>();
const preparingToastRef = ref<Toast>();
const timeoutToastRef = ref<Toast>();

// Current in-progress session
const currentSession = computed(() => {
  return sessionsStore.sessionsInProgress.data?.[0] || null;
});

// Quick history (recent completed sessions)
const quickHistory = computed(() =>
  sessionsStore.sessionHistory.data.slice(0, 3).map((s) => ({
    id: s.id,
    station: s.siteName || s.chargingStationName || t('common.unknown'),
    date: s.timestamp,
    energy: s.totalEnergyDelivered,
    amount: s.cumulatedPrice,
    currency: s.currency,
  })),
);

const monthlyStats = computed(() => sessionsStore.monthlyStats);

const { mostUsedSiteArea, availableCount, fetchFavoriteLocationData, loading } =
  useFavoriteLocation();

const favoriteLocation = computed(() => ({
  name: mostUsedSiteArea.value || t('dashboard.all_available_stations'),
  available: availableCount.value,
}));

// Session start composable
const {
  startSession: startChargingSession,
  isStarting,
  state: sessionStartState,
} = useSessionStart();

// Computed property to determine if QR scanner should be shown
const showQRScanner = computed(() => {
  // Don't show QR scanner if:
  // 1. There's already a current session
  // 2. Data is loading (initial load OR starting session)
  if (currentSession.value) return false;
  if (isLoading.value || isStarting.value) return false;

  return true;
});

// Watch for session start state changes
watch(
  () => sessionStartState.status,
  (status: string) => {
    switch (status) {
      case 'preparing':
        showPreparingToast();
        break;
      case 'warning':
        showWarningToast();
        break;
      case 'timeout':
        showTimeoutInfoToast();
        break;
    }
  },
);

// QR Scanner event handlers
async function onQRScanned(qrData: QRData) {
  try {
    await startChargingSession(qrData.evseId);
  } catch (error) {
    showErrorToast(error);
  }
}

/**
 * Show error toast with proper error code mapping
 */
function showErrorToast(err: unknown): void {
  let translatedMessage = t('session.errors.generic');

  // Use error code for type-safe error mapping
  if (err instanceof SessionStartError) {
    switch (err.code) {
      case SessionStartErrorCode.EVSE_NOT_FOUND:
        translatedMessage = t('session.errors.evse_not_found');
        break;
      case SessionStartErrorCode.NO_CONNECTORS:
        translatedMessage = t('session.errors.no_connectors');
        break;
      case SessionStartErrorCode.START_FAILED:
        translatedMessage = t('session.errors.start_failed');
        break;
      case SessionStartErrorCode.TIMEOUT:
        translatedMessage = t('session.errors.timeout');
        break;
      case SessionStartErrorCode.WARNING:
        translatedMessage = t('session.errors.warning');
        break;
      case SessionStartErrorCode.BACKEND_ERROR:
        translatedMessage = t('session.errors.backend');
        break;
    }
  }

  if (errorToastRef.value) {
    errorToastRef.value.innerText = translatedMessage;
    errorToastRef.value.open = true;
  }
}

/**
 * Show preparing toast (action required)
 */
function showPreparingToast(): void {
  if (preparingToastRef.value) {
    preparingToastRef.value.open = true;
  }
}

/**
 * Show warning toast (charging did not start)
 */
function showWarningToast(): void {
  if (warningToastRef.value) {
    warningToastRef.value.open = true;
  }
}

/**
 * Show timeout info toast
 */
function showTimeoutInfoToast(): void {
  if (timeoutToastRef.value) {
    timeoutToastRef.value.open = true;
  }
}

function onBrowseStations() {
  router.push({ name: 'Stations' });
}

function onQRError(errorMessage: string) {
  // eslint-disable-next-line no-console
  console.error('QR Scanner error:', errorMessage);
}

function onViewFavoriteLocationStations() {
  if (mostUsedSiteArea.value) {
    router.push({
      name: 'Stations',
      query: { siteArea: mostUsedSiteArea.value, available: 'true' },
    });
  } else {
    router.push({ name: 'Stations' });
  }
}
function onViewAllHistory() {
  router.push({ name: 'Sessions' });
}

onMounted(async () => {
  try {
    // Load in-progress sessions first (most important for display logic)
    await sessionsStore.loadInProgressSessions();

    // Load other data in parallel
    await Promise.all([
      sessionsStore.loadCompleted(),
      sessionsStore.fetchMonthlyStats(),
      badgesStore.loadAll(),
      fetchFavoriteLocationData(),
    ]);
  } finally {
    // Once initial data is loaded, stop loading state
    isLoading.value = false;
  }
});
</script>

<style scoped>
.monthly-card {
  min-height: 140px;
}
.footprint-card {
  min-height: 140px;
}
.quick-history-card {
  min-height: 320px;
  height: 100%;
  align-self: stretch;
}
.favorite-station-card {
  min-height: 140px;
}
.favorite-location-card {
  min-height: 140px;
}
@media (min-width: 1000px) {
  .monthly-card {
    min-height: 140px;
  }
  .footprint-card {
    min-height: 160px;
  }
  .quick-history-card {
    min-height: 400px;
  }
  .favorite-station-card {
    min-height: 160px;
  }
  .favorite-location-card {
    min-height: 160px;
  }
}
</style>
