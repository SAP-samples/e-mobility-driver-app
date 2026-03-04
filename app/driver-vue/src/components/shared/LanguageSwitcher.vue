<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-select v-model="selectedLanguage" @change="changeLanguage">
    <ui5-option v-for="language in supportedLanguages" :key="language.code" :value="language.code">
      {{ $t(language.nameKey) }}
    </ui5-option>
  </ui5-select>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import '@ui5/webcomponents/dist/Select.js';
import '@ui5/webcomponents/dist/Option.js';
import { SUPPORTED_LANGUAGES, isValidLanguageCode } from '@/i18n/languages';

const { locale } = useI18n();
const selectedLanguage = ref(locale.value);
const supportedLanguages = SUPPORTED_LANGUAGES;

function changeLanguage(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newLocale = target.value;
  locale.value = newLocale;
  selectedLanguage.value = newLocale;

  // Store the language preference in localStorage
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('preferred-language', newLocale);
    } catch (error) {
      // localStorage might not be available or might be blocked
      // eslint-disable-next-line no-console
      console.warn('Could not save language preference to localStorage:', error);
    }
  }
}

onMounted(() => {
  // Load saved language preference
  if (typeof window !== 'undefined') {
    try {
      const savedLanguage = window.localStorage.getItem('preferred-language');
      if (savedLanguage && isValidLanguageCode(savedLanguage)) {
        locale.value = savedLanguage;
        selectedLanguage.value = savedLanguage;
      }
    } catch (error) {
      // localStorage might not be available or might be blocked
      // eslint-disable-next-line no-console
      console.warn('Could not load language preference from localStorage:', error);
    }
  }
});
</script>

<style scoped>
ui5-select {
  min-width: 120px;
}
</style>
