<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <DashboardCardLayout>
    <template #title>
      <div class="qr-title">
        <ui5-icon name="qr-code" style="margin-right: 0.5em; color: #1866b4" />
        <span>{{ $t('qr.title') }}</span>
      </div>
    </template>

    <div class="qr-content">
      <!-- Busy State -->
      <div v-if="busy" class="busy-state">
        <ui5-busy-indicator active size="L" />
        <p>{{ $t('qr.processing') }}</p>
      </div>

      <!-- Normal State -->
      <template v-else>
        <!-- QR Scanner Prompt -->
        <div class="qr-scanner-prompt">
          <div class="qr-icon-large">
            <ui5-icon name="qr-code" />
          </div>
          <div class="qr-text">
            <h3>{{ $t('qr.scan_title') }}</h3>
            <p>{{ $t('qr.scan_description') }}</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-state">
          <ui5-icon name="error" style="color: #bb0000; margin-bottom: 0.5em" />
          <p class="error-message">{{ error }}</p>
        </div>

        <!-- Decrypting State -->
        <div v-if="isDecrypting" class="decrypting-state">
          <ui5-icon name="synchronize" style="color: #1866b4; margin-bottom: 0.5em" />
          <p>{{ $t('qr.decrypting') }}</p>
        </div>
      </template>
    </div>

    <template #actions>
      <ui5-button
        design="Emphasized"
        data-testid="scan-button"
        @click="openBarcodeScanner"
        icon="bar-code"
        :disabled="busy"
      >
        {{ $t('qr.scan_button') }}
      </ui5-button>

      <ui5-button
        design="Transparent"
        data-testid="browse-button"
        @click="onBrowseStations"
        :disabled="busy"
      >
        {{ $t('qr.browse_stations') }}
      </ui5-button>
    </template>

    <!-- UI5 Barcode Scanner Dialog -->
    <ui5-barcode-scanner-dialog
      ref="barcodeScannerDialog"
      @scan-success="handleScanSuccess"
      @scan-error="handleScanError"
    />
  </DashboardCardLayout>
</template>

<script setup lang="ts">
import '@ui5/webcomponents-fiori/dist/BarcodeScannerDialog.js';
import '@ui5/webcomponents/dist/BusyIndicator.js';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';
import { type QRData, useQRScanner } from '@/composables/useQRScanner';

// Props
defineProps<{
  busy?: boolean;
}>();

// Events
const emit = defineEmits<{
  qrScanned: [data: QRData];
  browseStations: [];
  error: [message: string];
}>();

// i18n
const { t } = useI18n();

const {
  error: rawError,
  isDecrypting,
  handleScanResult,
  handleScanError: handleScannerError,
  clearError,
} = useQRScanner();

// Computed property to translate error messages reactively
const error = computed(() => {
  if (!rawError.value) return null;

  // Map technical error codes to translation keys
  const errorKey = rawError.value.toLowerCase();
  const translationKey = `qr.errors.${errorKey}`;

  // Try to get the translation, fallback to the raw error if translation doesn't exist
  const translatedMessage = t(translationKey);

  // If translation key doesn't exist, t() returns the key itself, so we check for that
  return translatedMessage !== translationKey ? translatedMessage : rawError.value;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const barcodeScannerDialog = ref<any>();

/**
 * Open the UI5 Barcode Scanner Dialog
 */
function openBarcodeScanner() {
  clearError();

  if (barcodeScannerDialog.value) {
    barcodeScannerDialog.value.open = true;
  }
}

/**
 * Handle successful barcode scan from UI5 dialog
 */
async function handleScanSuccess(event: CustomEvent) {
  const scanResult = event.detail.text;

  // Close the scanner dialog first
  if (barcodeScannerDialog.value) {
    barcodeScannerDialog.value.open = false;
  }

  // Handle the scan result asynchronously
  await handleScanResult(scanResult, handleQRScanned, handleScanErrorInternal);
}

/**
 * Handle scan error from UI5 dialog
 */
function handleScanError(event: CustomEvent) {
  const errorMessage = event.detail.message || 'Failed to scan QR code';
  handleScannerError(errorMessage, handleScanErrorInternal);

  // Close the scanner dialog
  if (barcodeScannerDialog.value) {
    barcodeScannerDialog.value.open = false;
  }
}

/**
 * Handle successful QR code scan
 */
function handleQRScanned(qrData: QRData) {
  emit('qrScanned', qrData);
}

/**
 * Handle QR scanning errors
 */
function handleScanErrorInternal(errorMessage: string) {
  emit('error', errorMessage);
}

/**
 * Handle browse stations click
 */
function onBrowseStations() {
  emit('browseStations');
}
</script>

<script lang="ts">
export default {
  name: 'QRScannerCard',
};
</script>

<style scoped>
.qr-title {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.qr-scanner-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-icon-large {
  font-size: 4rem;
  color: #1866b4;
  margin-bottom: 0.5rem;
}

.qr-icon-large ui5-icon {
  width: 4rem;
  height: 4rem;
}

.qr-text h3 {
  margin: 0 0 0.5rem 0;
  color: #2b2d30;
  font-size: 1.2rem;
}

.qr-text p {
  margin: 0;
  color: #7f8b97;
  font-size: 0.95rem;
}

.busy-state,
.error-state,
.decrypting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.busy-state {
  gap: 1rem;
  padding: 2rem 0;
}

.busy-state p {
  color: #1866b4;
  margin: 0;
  font-size: 1rem;
}

.error-state ui5-icon,
.decrypting-state ui5-icon {
  font-size: 2rem;
}

.error-message {
  color: #bb0000;
  margin: 0;
  font-size: 0.95rem;
}

.decrypting-state p {
  color: #1866b4;
  margin: 0;
  font-size: 0.95rem;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .qr-content {
    min-height: 160px;
  }

  .qr-icon-large {
    font-size: 3rem;
  }

  .qr-icon-large ui5-icon {
    width: 3rem;
    height: 3rem;
  }
}
</style>
