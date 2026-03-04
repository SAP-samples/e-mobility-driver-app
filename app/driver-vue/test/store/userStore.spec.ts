// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useAuthFetch from '../../src/composables/useAuthFetch';
import { createMockResponse } from '../support/mockResponse';

import { useUserStore } from '@/store/userStore';

vi.mock('../../src/composables/useAuthFetch', () => ({
  default: vi.fn(),
}));

const mockUseAuthFetch = vi.mocked(useAuthFetch);

describe('Store: app/driver-vue/src/store/userStore.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockUseAuthFetch.mockReset();
  });

  it('initializes with default state', () => {
    const store = useUserStore();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
  });

  it('fetchUser sets user data and isAuthenticated on success', async () => {
    const store = useUserStore();
    const mockData = { firstname: 'John', lastname: 'Doe', email: 'john@doe.com' };
    mockUseAuthFetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        jsonData: mockData,
      }),
    );
    await store.fetchUser();
    expect(store.firstName).toBe('John');
    expect(store.lastName).toBe('Doe');
    expect(store.email).toBe('john@doe.com');
    expect(store.isAuthenticated).toBe(true);
  });

  it('fetchUser sets isAuthenticated to false on error', async () => {
    const store = useUserStore();
    mockUseAuthFetch.mockRejectedValue(new Error('Network error'));
    await store.fetchUser();
    expect(store.isAuthenticated).toBe(false);
  });

  it('fetchUser sets empty fields if API returns missing data', async () => {
    const store = useUserStore();
    mockUseAuthFetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        jsonData: {},
      }),
    );
    await store.fetchUser();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(true);
  });

  it('fetchUser sets isAuthenticated to false if response.ok is false', async () => {
    const store = useUserStore();
    mockUseAuthFetch.mockResolvedValue(
      createMockResponse({
        ok: false,
        jsonData: { firstname: 'X', lastname: 'Y', email: 'x@y.com' },
      }),
    );
    await store.fetchUser();
    expect(store.isAuthenticated).toBe(false);
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
  });

  it('fetchUser sets isAuthenticated to false if json() throws', async () => {
    const store = useUserStore();
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonThrows: true }));
    await store.fetchUser();
    expect(store.isAuthenticated).toBe(false);
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
  });

  it('login clears user and redirects', async () => {
    const store = useUserStore();
    store.firstName = 'Jane';
    store.lastName = 'Smith';
    store.email = 'jane@smith.com';
    store.isAuthenticated = true;
    const replaceSpy = vi.spyOn(window.location, 'replace').mockImplementation(() => {});
    await store.login();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
    expect(replaceSpy).toHaveBeenCalledWith('index.html');
    replaceSpy.mockRestore();
  });

  it('logout clears user and redirects', () => {
    const store = useUserStore();
    store.firstName = 'Jane';
    store.lastName = 'Smith';
    store.email = 'jane@smith.com';
    store.isAuthenticated = true;
    const replaceSpy = vi.spyOn(window.location, 'replace').mockImplementation(() => {});
    store.logout();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
    expect(replaceSpy).toHaveBeenCalledWith('logout');
    replaceSpy.mockRestore();
  });

  it('clearUser resets all user fields', () => {
    const store = useUserStore();
    store.firstName = 'Jane';
    store.lastName = 'Smith';
    store.email = 'jane@smith.com';
    store.isAuthenticated = true;
    store.clearUser();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
  });

  it('clearUser is idempotent and does not throw if already cleared', () => {
    const store = useUserStore();
    store.clearUser();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
    // Call again to check idempotency
    expect(() => store.clearUser()).not.toThrow();
  });

  it('login and logout are idempotent if already cleared', async () => {
    const store = useUserStore();
    const replaceSpy = vi.spyOn(window.location, 'replace').mockImplementation(() => {});
    store.clearUser();
    await store.login();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
    expect(replaceSpy).toHaveBeenCalledWith('index.html');
    store.clearUser();
    store.logout();
    expect(store.firstName).toBe('');
    expect(store.lastName).toBe('');
    expect(store.email).toBe('');
    expect(store.isAuthenticated).toBe(false);
    expect(replaceSpy).toHaveBeenCalledWith('logout');
    replaceSpy.mockRestore();
  });

  it('reactivity: state updates are reflected in computed properties', async () => {
    const store = useUserStore();
    expect(store.isAuthenticated).toBe(false);
    mockUseAuthFetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        jsonData: { firstname: 'A', lastname: 'B', email: 'a@b.com' },
      }),
    );
    await store.fetchUser();
    expect(store.isAuthenticated).toBe(true);
    store.clearUser();
    expect(store.isAuthenticated).toBe(false);
  });
});
