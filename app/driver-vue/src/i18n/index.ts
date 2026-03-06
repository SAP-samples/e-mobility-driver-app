// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createI18n } from 'vue-i18n';

import { DEFAULT_LANGUAGE, isValidLanguageCode } from './languages';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const messages = {
  en,
  fr,
  de,
};

// Get saved language preference or default to DEFAULT_LANGUAGE
const getInitialLocale = (): string => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('preferred-language');
    if (saved && isValidLanguageCode(saved)) {
      return saved;
    }
  }
  return DEFAULT_LANGUAGE;
};

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LANGUAGE,
  messages,
});

export default i18n;
