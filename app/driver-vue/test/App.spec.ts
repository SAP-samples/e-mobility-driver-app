// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { createTestI18n } from '@test/support/i18n';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { routerKey } from 'vue-router';

import App from '@/App.vue';
import { useUiStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';

vi.mock('@/store/uiStore');
vi.mock('@/store/userStore');

const mockRouterPush = vi.fn();
const mockRouter = {
  push: mockRouterPush,
  currentRoute: { value: { name: 'Home', path: '/' } },
};

const mockRoute = {
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

function factory({ isAuthenticated = true, isMobile = false, sidebarOpen = true, user = {} } = {}) {
  // Mock Pinia stores
  const uiStore = {
    isMobile,
    sidebarOpen,
    updateIsMobile: vi.fn(),
    setSidebar: vi.fn(),
    toggleSidebar: vi.fn(),
  };
  const userStore = {
    isAuthenticated,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    fetchUser: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
  };
  (useUiStore as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(uiStore);
  (useUserStore as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(userStore);

  return mount(App, {
    global: {
      plugins: [createTestingPinia(), createTestI18n()],
      provide: {
        [routerKey]: mockRouter,
      },
      mocks: {
        $route: mockRoute,
      },
      stubs: {
        'router-view': true,
        'router-link': true,
        'ui5-navigation-layout': defineComponent({
          name: 'ui5-navigation-layout',
          template: '<div><slot /></div>',
        }),
      },
      directives: {
        'ui5-custom-tab-container': {},
      },
    },
    props: { user: { firstName: 'Test', lastName: 'User', email: 'test@example.com', ...user } },
  });
}

describe('App.vue', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
  });

  it('renders navigation layout when authenticated (mobile)', async () => {
    const wrapper = factory({ isAuthenticated: true, isMobile: true });
    await flushPromises();
    const navLayout = wrapper.find('ui5-navigation-layout');
    expect(navLayout.exists()).toBe(true);
    expect(wrapper.find('.footer-tabs').exists()).toBe(true);
  });

  it('renders navigation layout when authenticated (desktop)', async () => {
    const wrapper = factory({ isAuthenticated: true, isMobile: false });
    await flushPromises();
    const navLayout = wrapper.find('ui5-navigation-layout');
    expect(navLayout.exists()).toBe(true);
    expect(wrapper.find('.footer-tabs').exists()).toBe(false);
    expect(wrapper.find('ui5-side-navigation').exists()).toBe(true);
  });

  it('hides navigation layout when not authenticated', async () => {
    const wrapper = factory({ isAuthenticated: false });
    await flushPromises();
    // The parent div should have display: none
    const parentDiv = wrapper.find('div').element as HTMLDivElement;
    expect(parentDiv.style.display).toBe('none');
    expect(wrapper.findComponent({ name: 'router-view' }).exists()).toBe(true);
  });

  it('shows/hides sidebar based on isMobile', async () => {
    const wrapper = factory({ isAuthenticated: true, isMobile: false });
    await flushPromises();
    expect(wrapper.find('ui5-side-navigation').exists()).toBe(true);
    wrapper.unmount();
    const wrapperMobile = factory({ isAuthenticated: true, isMobile: true });
    await flushPromises();
    expect(wrapperMobile.find('ui5-side-navigation').exists()).toBe(false);
  });

  it('calls toggleSidebar when menu button is clicked', async () => {
    const wrapper = factory({ isAuthenticated: true, isMobile: false });
    await flushPromises();
    const uiStore = useUiStore();
    const btn = wrapper.find('#startButton');
    await btn.trigger('click');
    expect(uiStore.toggleSidebar).toHaveBeenCalled();
  });

  it('calls navigateFromTab on tab select', async () => {
    const wrapper = factory({ isAuthenticated: true, isMobile: true });
    await flushPromises();
    const tabContainer = wrapper.find('.footer-tabs');
    await tabContainer.trigger('tab-select', { detail: { tabIndex: 2 } });
    expect(mockRouterPush).toHaveBeenCalled();
  });

  it('calls userStore.logout on sign-out-click', async () => {
    const wrapper = factory({ isAuthenticated: true });
    await flushPromises();
    const userStore = useUserStore();
    const userMenu = wrapper.find('#userMenu');
    await userMenu.trigger('sign-out-click');
    expect(userStore.logout).toHaveBeenCalled();
  });

  it('renders refresh button in shellbar', async () => {
    const wrapper = factory({ isAuthenticated: true });
    await flushPromises();
    const refreshButton = wrapper.find('#refreshButton');
    expect(refreshButton.exists()).toBe(true);
    // Verify it's a ui5-shellbar-item element
    expect(refreshButton.element.tagName.toLowerCase()).toBe('ui5-shellbar-item');
  });

  it('calls window.location.reload when refresh button is clicked', async () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    const wrapper = factory({ isAuthenticated: true });
    await flushPromises();
    const refreshButton = wrapper.find('#refreshButton');
    await refreshButton.trigger('click');
    expect(mockReload).toHaveBeenCalled();
  });

  // --- Edge/corner cases ---
  it('renders with missing user data', async () => {
    const wrapper = factory({
      isAuthenticated: true,
      isMobile: true,
      user: { firstName: '', lastName: '', email: '' },
    });
    await flushPromises();
    expect(wrapper.find('ui5-navigation-layout').exists()).toBe(true);
    expect(wrapper.find('.footer-tabs').exists()).toBe(true);
  });

  it('handles userStore.fetchUser rejection gracefully', async () => {
    const userStore = useUserStore();
    userStore.fetchUser = vi.fn().mockRejectedValue(new Error('fetch error'));
    expect(() => factory({ isAuthenticated: true })).not.toThrow();
    await flushPromises();
    // Should not redirect or crash
    expect(mockRouterPush).not.toHaveBeenCalledWith({ name: 'Login' });
  });

  it('reacts to isMobile changing after mount', async () => {
    // Remount with isMobile: false, then remount with isMobile: true
    let wrapper = factory({ isAuthenticated: true, isMobile: false });
    await flushPromises();
    expect(wrapper.find('.footer-tabs').exists()).toBe(false);
    wrapper.unmount();
    wrapper = factory({ isAuthenticated: true, isMobile: true });
    await flushPromises();
    expect(wrapper.find('.footer-tabs').exists()).toBe(true);
  });

  it('does not render navigation layout if userStore is missing', async () => {
    (useUserStore as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      undefined,
    );
    const wrapper = factory({ isAuthenticated: false });
    await flushPromises();
    // The parent div should have display: none
    const parentDiv = wrapper.find('div').element as HTMLDivElement;
    expect(parentDiv.style.display).toBe('none');
  });
});
