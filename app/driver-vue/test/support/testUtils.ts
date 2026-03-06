// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import type { RenderOptions } from '@testing-library/vue';
import { vi } from 'vitest';
import { routerKey } from 'vue-router';

import { createTestI18n } from './i18n';

// Default render options for components that need i18n
export const defaultRenderOptions: RenderOptions<unknown> = {
  global: {
    plugins: [createTestI18n()],
  },
};

// Render options for components that need both i18n and Pinia
export const withPiniaRenderOptions: RenderOptions<unknown> = {
  global: {
    plugins: [createTestI18n()],
  },
};

// Mock router for testing
export const mockRouter = {
  push: vi.fn(),
  currentRoute: { value: { name: 'Home', path: '/' } },
};

// Mock route for testing
export const mockRoute = {
  path: '/',
  name: 'Home',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  redirectedFrom: undefined,
  meta: {},
};

// Render options for components that need router, i18n, and Pinia
export const fullRenderOptions: RenderOptions<unknown> = {
  global: {
    plugins: [createTestI18n()],
    provide: {
      [routerKey]: mockRouter,
    },
    mocks: {
      $route: mockRoute,
    },
  },
};

// Helper function to create custom render options with specific locale
export const createRenderOptionsWithLocale = (locale: 'en' | 'fr'): RenderOptions<unknown> => ({
  global: {
    plugins: [createTestI18n(locale)],
  },
});

// Helper function to create full render options with specific locale
export const createFullRenderOptionsWithLocale = (locale: 'en' | 'fr'): RenderOptions<unknown> => ({
  global: {
    plugins: [createTestI18n(locale)],
    provide: {
      [routerKey]: mockRouter,
    },
    mocks: {
      $route: mockRoute,
    },
  },
});
