// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createI18n } from 'vue-i18n';

import de from '../../src/i18n/locales/de.json';
import en from '../../src/i18n/locales/en.json';
import fr from '../../src/i18n/locales/fr.json';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from '../../src/i18n/languages';

const messages = {
  en,
  fr,
  de,
};

export const createTestI18n = (locale: string = DEFAULT_LANGUAGE) => {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LANGUAGE,
    messages,
  });
};

// Helper function to create i18n instance with specific locale for testing
export const createTestI18nWithLocale = (locale: string) => {
  // Validate locale is supported, fallback to default if not
  const validLocale = SUPPORTED_LANGUAGE_CODES.includes(locale) ? locale : DEFAULT_LANGUAGE;
  return createTestI18n(validLocale);
};

// Mock localStorage for testing
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};
