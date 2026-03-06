<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-button
    design="Attention"
    icon="stop"
    slot="endContent"
    data-testid="stop-session-button"
    @click="openStopDialog"
    v-if="!stopped"
  >
    {{ $t('buttons.stop') }}
  </ui5-button>
  <ui5-dialog ref="stopDialogRef" :header-text="$t('buttons.stop_session')">
    <ui5-text>{{ $t('messages.confirm_stop_session') }}</ui5-text>
    <ui5-toolbar slot="footer">
      <ui5-toolbar-button
        design="Emphasized"
        :text="$t('buttons.confirm')"
        @click="confirmStopSession"
      >
      </ui5-toolbar-button>
      <ui5-toolbar-button
        design="Transparent"
        :text="$t('buttons.cancel')"
        @click="cancelStopSession"
      >
      </ui5-toolbar-button>
    </ui5-toolbar>
  </ui5-dialog>
  <ui5-toast ref="stopToastRef">{{ $t('messages.toast_session_stopped') }}</ui5-toast>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Dialog.js';
import '@ui5/webcomponents/dist/Toast.js';

import { useSessionStop } from '@/composables/useSessionStop';

const props = defineProps<{ sessionId: number; stopped: boolean }>();

// Template refs with proper typing for UI5 components
interface UI5Dialog extends HTMLElement {
  open: boolean;
}

interface UI5Toast extends HTMLElement {
  open: boolean;
}

const stopDialogRef = ref<UI5Dialog>();
const stopToastRef = ref<UI5Toast>();

// Session stop composable
const { stopSession } = useSessionStop();

const openStopDialog = () => {
  if (stopDialogRef.value) {
    stopDialogRef.value.open = true;
  }
};

const cancelStopSession = () => {
  if (stopDialogRef.value) {
    stopDialogRef.value.open = false;
  }
};

const confirmStopSession = async () => {
  try {
    await stopSession(props.sessionId);
    // Success - close dialog and show toast
    if (stopDialogRef.value) {
      stopDialogRef.value.open = false;
    }
    if (stopToastRef.value) {
      stopToastRef.value.open = true;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error stopping session:', error);
    // Close dialog on error
    if (stopDialogRef.value) {
      stopDialogRef.value.open = false;
    }
  }
};
</script>
