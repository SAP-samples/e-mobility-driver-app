// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Centralized language configuration
 * Add new languages here to automatically enable them throughout the application
 */

export interface LanguageConfig {
  code: string;
  nameKey: string; // i18n key for translated language name
}

/**
 * Supported languages array - single source of truth
 * To add a new language:
 * 1. Add entry here with code and nameKey
 * 2. Create corresponding locale file in ./locales/
 * 3. Add translation for the nameKey in all existing locale files
 */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', nameKey: 'language.english' },
  { code: 'fr', nameKey: 'language.french' },
  { code: 'de', nameKey: 'language.german' },
];

// Derived utilities
export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);
export const DEFAULT_LANGUAGE = 'en';

/**
 * Validates if a language code is supported
 */
export const isValidLanguageCode = (code: string): code is string => {
  return SUPPORTED_LANGUAGE_CODES.includes(code);
};

/**
 * Gets language config by code
 */
export const getLanguageConfig = (code: string): LanguageConfig | undefined => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
};
