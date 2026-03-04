// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia } from 'pinia';
import { registerSW } from 'virtual:pwa-register';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

vi.mock('vue', () => ({
  createApp: vi.fn(() => ({
    use: vi.fn().mockReturnThis(),
    directive: vi.fn().mockReturnThis(),
    mount: vi.fn().mockReturnThis(),
  })),
}));
vi.mock('pinia', () => ({ createPinia: vi.fn() }));
vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }));
vi.mock('@/ui5-icons', () => ({}));
vi.mock('@/style.css', () => ({}));
vi.mock('@/App.vue', () => ({
  default: {},
}));
vi.mock('@/directives/ui5CustomTabContainer', () => ({
  default: {},
}));
vi.mock('@/router/index', () => ({
  default: {},
}));
vi.mock('@/i18n', () => ({
  default: {},
}));
vi.mock('vue-cookies', () => ({
  default: {},
}));

// Import after mocks
import '@/main';

describe('main.ts', () => {
  it('should create and mount the Vue app with Pinia, router, i18n, VueCookies, directive, and register service worker', () => {
    expect(createApp).toHaveBeenCalled();
    expect(createPinia).toHaveBeenCalled();
    // Check that app.use and app.directive were called
    const appInstance = (
      createApp as unknown as { mock: { results: { value: Record<string, unknown> }[] } }
    ).mock.results[0].value;
    expect(appInstance.use).toHaveBeenCalledTimes(4); // pinia, router, i18n, VueCookies
    expect(appInstance.directive).toHaveBeenCalledWith(
      'ui5-custom-tab-container',
      expect.anything(),
    );
    expect(appInstance.mount).toHaveBeenCalledWith('#app');
    expect(registerSW).toHaveBeenCalledWith({ immediate: true });
  });
});
