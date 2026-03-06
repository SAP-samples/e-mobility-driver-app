<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-button
    data-testid="start-button"
    design="Emphasized"
    @click="openConfirmDialog"
    :disabled="!isEvseAvailable || isStarting"
    v-if="isEvseOperationalStatus && !sessionStarted && hasValidConnectors"
  >
    {{ isStarting ? $t('session.starting') : $t('session.start') }}
  </ui5-button>

  <ui5-dialog
    ref="dialogRef"
    :header-text="$t('session.start_session_title')"
    data-testid="confirmation-dialog"
  >
    <ui5-text>{{ $t('session.start_session_confirm') }}</ui5-text>
    <ui5-toolbar slot="footer">
      <ui5-toolbar-button
        data-testid="confirm-button"
        design="Emphasized"
        :text="$t('buttons.confirm')"
        :disabled="isStarting"
        @click="handleStartSession"
      />
      <ui5-toolbar-button
        data-testid="cancel-button"
        design="Transparent"
        :text="$t('buttons.cancel')"
        :disabled="isStarting"
        @click="closeDialog"
      />
    </ui5-toolbar>
  </ui5-dialog>

  <ui5-toast ref="toastRef" data-testid="success-toast">
    {{ $t('session.start_session_success') }}
  </ui5-toast>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Dialog.js';
import '@ui5/webcomponents/dist/Toast.js';

import { useEvseStatusState } from '@/composables/useEvseStatusState';
import { useSessionStart } from '@/composables/useSessionStart';
import type { Evse } from '@/store/evse';

// Types for UI5 components
interface UI5Dialog extends HTMLElement {
  open: boolean;
}

interface UI5Toast extends HTMLElement {
  open: boolean;
}

const props = defineProps<{ evse: Evse }>();

const { isEvseOperational, isReadyForCharging } = useEvseStatusState();

// Template refs
const dialogRef = ref<UI5Dialog>();
const toastRef = ref<UI5Toast>();

// State
const sessionStarted = ref(false);

// Session start composable
const { startSession, isStarting } = useSessionStart();

// Computed
const isEvseAvailable = computed(() => isReadyForCharging(props.evse));
const isEvseOperationalStatus = computed(() => isEvseOperational(props.evse));

const hasValidConnectors = computed(() => {
  return props.evse?.connectors && props.evse.connectors.length > 0;
});

// Methods
const openConfirmDialog = (): void => {
  if (dialogRef.value) {
    dialogRef.value.open = true;
  }
};

const closeDialog = (): void => {
  if (dialogRef.value) {
    dialogRef.value.open = false;
  }
};

const showSuccessToast = (): void => {
  if (toastRef.value) {
    toastRef.value.open = true;
  }
};

const handleStartSession = async (): Promise<void> => {
  if (!hasValidConnectors.value) {
    console.error('No connectors available to start session');
    closeDialog();
    return;
  }

  try {
    await startSession(props.evse.id);
    // Success
    sessionStarted.value = true;
    closeDialog();
    showSuccessToast();
  } catch (error) {
    console.error('Error starting session:', error);
    closeDialog();
  }
};
</script>
