<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="no-data-wrapper">
    <div class="no-data-container">
      <ui5-illustrated-message
        name="NoData"
        :title-text="title"
        :subtitle-text="subtitle"
        size="Auto"
      >
        <div>
          <ui5-button design="Emphasized" @click="$emit('action')">
            {{ actionText }}
          </ui5-button>
        </div>
      </ui5-illustrated-message>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@ui5/webcomponents-fiori/dist/IllustratedMessage.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents/dist/Button.js';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  title?: string;
  subtitle?: string;
  actionText?: string;
}>();

const title = props.title || t('messages.no_data_title');
const subtitle = props.subtitle || t('messages.no_data_message');
const actionText = props.actionText || t('buttons.goto_home');
</script>

<style scoped>
.no-data-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
}
.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 2rem 1rem;
}

@media (max-width: 600px) {
  .no-data-container {
    padding: 1rem 0.5rem;
    min-height: 200px;
  }
}
</style>
