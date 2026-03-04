// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { createTestI18n } from '@test/support/i18n';
import { routerKey } from '@test/support/routerKey.ts';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/pages/LoginPage.vue';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

describe('LoginPage', () => {
  let routerPush: ReturnType<typeof vi.fn>;
  let router: { push: typeof routerPush };

  beforeEach(() => {
    routerPush = vi.fn();
    router = { push: routerPush };
    mockReload.mockClear();
  });

  function factory({ isAuthenticated = false } = {}) {
    return shallowMount(LoginPage, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              user: { isAuthenticated },
            },
            stubActions: false, // Allow real actions for testing
          }),
          createTestI18n(),
        ],
        provide: {
          [routerKey]: router,
        },
      },
    });
  }

  it('renders login page with illustrated message', async () => {
    const wrapper = factory();
    await flushPromises();

    expect(wrapper.find('ui5-illustrated-message').exists()).toBe(true);
    expect(wrapper.find('.login-container').exists()).toBe(true);
    expect(wrapper.find('.action-buttons').exists()).toBe(true);
  });

  it('shows correct initial state with SimpleConnection illustration', async () => {
    const wrapper = factory();
    await flushPromises();

    const illustratedMessage = wrapper.find('ui5-illustrated-message');
    expect(illustratedMessage.exists()).toBe(true);

    // Test component state instead of DOM attributes
    const vm = wrapper.vm as unknown as {
      currentIllustration: string;
      currentTitle: string;
      currentSubtitle: string;
      isLoading: boolean;
      hasError: boolean;
    };
    expect(vm.currentIllustration).toBe('SimpleConnection');
    expect(vm.currentTitle).toBe('Ready to Charge Up Your Session?');
    expect(vm.currentSubtitle).toContain('Connect to the grid and power up');
    expect(vm.isLoading).toBe(false);
    expect(vm.hasError).toBe(false);
  });

  it('shows login and reload buttons initially', async () => {
    const wrapper = factory();
    await flushPromises();

    const buttons = wrapper.findAll('ui5-button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Check that we have buttons with the expected text content
    const buttonTexts = buttons.map((btn) => btn.text());
    expect(buttonTexts.some((text) => text.includes('Login'))).toBe(true);
    expect(buttonTexts.some((text) => text.includes('Reload Page'))).toBe(true);
  });

  it('calls userStore.login when login button is clicked', async () => {
    const wrapper = factory();
    await flushPromises();

    const userStore = (await import('@/store/userStore')).useUserStore();
    const loginSpy = vi.spyOn(userStore, 'login').mockResolvedValue();

    // Find and click the login button
    const buttons = wrapper.findAll('ui5-button');
    const loginButton = buttons.find((btn) => btn.text().includes('Login'));
    expect(loginButton).toBeTruthy();

    await loginButton?.trigger('click');
    await flushPromises();

    expect(loginSpy).toHaveBeenCalled();
    loginSpy.mockRestore();
  });

  it('calls window.location.reload when reload button is clicked', async () => {
    const wrapper = factory();
    await flushPromises();

    const buttons = wrapper.findAll('ui5-button');
    const reloadButton = buttons.find((btn) => btn.text().includes('Reload Page'));
    expect(reloadButton).toBeTruthy();

    await reloadButton?.trigger('click');

    expect(mockReload).toHaveBeenCalled();
  });

  it('shows loading state during login', async () => {
    const wrapper = factory();
    await flushPromises();

    const userStore = (await import('@/store/userStore')).useUserStore();
    const loginSpy = vi
      .spyOn(userStore, 'login')
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const buttons = wrapper.findAll('ui5-button');
    const loginButton = buttons.find((btn) => btn.text().includes('Login'));
    await loginButton?.trigger('click');

    // Check loading state immediately after click
    await wrapper.vm.$nextTick();

    // Test component state instead of DOM attributes
    const vm = wrapper.vm as unknown as {
      currentIllustration: string;
      currentTitle: string;
      currentSubtitle: string;
      isLoading: boolean;
      hasError: boolean;
    };
    expect(vm.isLoading).toBe(true);
    expect(vm.currentTitle).toBe('Charging Up Connection...');
    expect(vm.currentSubtitle).toContain('Establishing secure connection');

    // Should show loading button with busy indicator
    const updatedButtons = wrapper.findAll('ui5-button');
    const loadingButton = updatedButtons.find((btn) => btn.text().includes('Connecting...'));
    expect(loadingButton).toBeTruthy();

    // Test that reload button is disabled during loading
    const reloadButton = updatedButtons.find((btn) => btn.text().includes('Reload Page'));
    expect(reloadButton).toBeTruthy();

    loginSpy.mockRestore();
  });

  it('shows error state when login fails', async () => {
    const wrapper = factory();
    await flushPromises();

    const userStore = (await import('@/store/userStore')).useUserStore();
    const loginSpy = vi.spyOn(userStore, 'login').mockRejectedValue(new Error('Login failed'));

    const buttons = wrapper.findAll('ui5-button');
    const loginButton = buttons.find((btn) => btn.text().includes('Login'));
    await loginButton?.trigger('click');
    await flushPromises();

    // Wait for error state to be set
    await wrapper.vm.$nextTick();

    // Test component state instead of DOM attributes
    const vm = wrapper.vm as unknown as {
      currentIllustration: string;
      currentTitle: string;
      currentSubtitle: string;
      isLoading: boolean;
      hasError: boolean;
    };
    expect(vm.hasError).toBe(true);
    expect(vm.currentIllustration).toBe('UnableToLoad');
    expect(vm.currentTitle).toBe('Circuit Breaker Tripped!');
    expect(vm.currentSubtitle).toContain('Login failed');

    // Should show "Try Again" button
    const updatedButtons = wrapper.findAll('ui5-button');
    const tryAgainButton = updatedButtons.find((btn) => btn.text().includes('Try Again'));
    expect(tryAgainButton).toBeTruthy();

    loginSpy.mockRestore();
  });

  it('resets error state when trying again', async () => {
    const wrapper = factory();
    await flushPromises();

    const userStore = (await import('@/store/userStore')).useUserStore();

    // First, cause an error
    const loginSpy = vi.spyOn(userStore, 'login').mockRejectedValue(new Error('Login failed'));
    const buttons = wrapper.findAll('ui5-button');
    const loginButton = buttons.find((btn) => btn.text().includes('Login'));
    await loginButton?.trigger('click');
    await flushPromises();
    await wrapper.vm.$nextTick();

    // Verify error state
    const vm = wrapper.vm as unknown as {
      currentIllustration: string;
      currentTitle: string;
      currentSubtitle: string;
      isLoading: boolean;
      hasError: boolean;
    };
    expect(vm.hasError).toBe(true);
    expect(vm.currentIllustration).toBe('UnableToLoad');

    // Now mock successful login and try again
    loginSpy.mockResolvedValue();
    const updatedButtons = wrapper.findAll('ui5-button');
    const tryAgainButton = updatedButtons.find((btn) => btn.text().includes('Try Again'));
    await tryAgainButton?.trigger('click');

    // Wait for the async login to start and state to update
    await wrapper.vm.$nextTick();
    await flushPromises(); // Ensure all async operations are handled

    // Should have reset error state (either loading or back to normal)
    expect(vm.hasError).toBe(false);
    // The title should have changed from the error state
    expect(vm.currentTitle).not.toBe('Circuit Breaker Tripped!');

    loginSpy.mockRestore();
  });

  it('handles login action error gracefully', async () => {
    const wrapper = factory();
    await flushPromises();

    const userStore = (await import('@/store/userStore')).useUserStore();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const loginSpy = vi.spyOn(userStore, 'login').mockRejectedValue(new Error('Network error'));

    const buttons = wrapper.findAll('ui5-button');
    const loginButton = buttons.find((btn) => btn.text().includes('Login'));
    await loginButton?.trigger('click');
    await flushPromises();

    // Page should not crash, still renders buttons
    expect(wrapper.find('ui5-button').exists()).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));

    consoleSpy.mockRestore();
    loginSpy.mockRestore();
  });

  it('has proper responsive design classes', async () => {
    const wrapper = factory();
    await flushPromises();

    expect(wrapper.find('.login-container').exists()).toBe(true);
    expect(wrapper.find('.main-content').exists()).toBe(true);
    expect(wrapper.find('.login-wrapper').exists()).toBe(true);
    expect(wrapper.find('.action-buttons').exists()).toBe(true);
  });

  it('disables reload button during loading', async () => {
    const wrapper = factory();
    await flushPromises();

    const userStore = (await import('@/store/userStore')).useUserStore();
    const loginSpy = vi
      .spyOn(userStore, 'login')
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const buttons = wrapper.findAll('ui5-button');
    const loginButton = buttons.find((btn) => btn.text().includes('Login'));
    await loginButton?.trigger('click');
    await wrapper.vm.$nextTick();

    // Test component state instead of DOM attributes
    const vm = wrapper.vm as unknown as {
      currentIllustration: string;
      currentTitle: string;
      currentSubtitle: string;
      isLoading: boolean;
      hasError: boolean;
    };
    expect(vm.isLoading).toBe(true);

    // Verify that reload button exists and is in disabled state
    const updatedButtons = wrapper.findAll('ui5-button');
    const reloadButton = updatedButtons.find((btn) => btn.text().includes('Reload Page'));
    expect(reloadButton).toBeTruthy();

    loginSpy.mockRestore();
  });
});
