<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="login-container">
    <ui5-bar class="header" design="Header">
      <div slot="startContent">
        <ui5-title level="H2">{{ $t('common.login') }}</ui5-title>
      </div>
    </ui5-bar>
    <main class="main-content">
      <div class="login-wrapper">
        <ui5-illustrated-message
          :name="currentIllustration"
          :title-text="currentTitle"
          :subtitle-text="currentSubtitle"
          size="Auto"
        >
          <div class="action-buttons">
            <ui5-button
              v-if="!isLoading"
              design="Emphasized"
              @click="handleLogin"
              :disabled="hasError"
            >
              {{ hasError ? $t('common.try_again') : $t('common.login') }}
            </ui5-button>
            <ui5-button v-if="isLoading" design="Emphasized" disabled>
              <ui5-busy-indicator size="Small" active></ui5-busy-indicator>
              {{ $t('common.connecting') }}
            </ui5-button>
            <ui5-button design="Transparent" @click="handleReload" :disabled="isLoading">
              {{ $t('common.reload_page') }}
            </ui5-button>
          </div>
        </ui5-illustrated-message>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useUserStore } from '@/store/userStore.ts';

// UI5 Component imports
import '@ui5/webcomponents-fiori/dist/IllustratedMessage.js';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleConnection.js';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/BusyIndicator.js';

const { t } = useI18n();
const userStore = useUserStore();

// Reactive state
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('');

// Computed properties for dynamic content
const currentIllustration = computed(() => {
  if (hasError.value) return 'UnableToLoad';
  return 'SimpleConnection';
});

const currentTitle = computed(() => {
  if (hasError.value) return t('login.circuit_breaker_tripped');
  if (isLoading.value) return t('login.charging_up_connection');
  return t('login.ready_to_charge');
});

const currentSubtitle = computed(() => {
  if (hasError.value) {
    return errorMessage.value || t('login.connection_error');
  }
  if (isLoading.value) return t('login.establishing_connection');
  return t('login.connect_to_grid');
});

// Event handlers
async function handleLogin() {
  if (hasError.value) {
    // Reset error state for retry
    hasError.value = false;
    errorMessage.value = '';
  }

  isLoading.value = true;

  try {
    await userStore.login();
  } catch (error) {
    hasError.value = true;
    errorMessage.value = error instanceof Error ? error.message : 'Login failed unexpectedly';
    console.error('Login error:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleReload() {
  window.location.reload();
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header {
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.login-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.action-buttons ui5-button {
  min-width: 200px;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0.5rem;
  }

  .login-wrapper {
    min-height: 300px;
  }

  .action-buttons ui5-button {
    min-width: 180px;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    width: 100%;
  }

  .action-buttons ui5-button {
    min-width: 160px;
    width: 100%;
    max-width: 250px;
  }
}

/* Animation for state transitions */
.login-wrapper {
  transition: all 0.3s ease-in-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .login-wrapper {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .login-container {
    background: #ffffff;
  }

  .header {
    border-bottom: 2px solid #000000;
  }
}
</style>
