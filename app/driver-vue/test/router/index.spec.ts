// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import { beforeAuthGuard } from '@/router';

// Mock all page components
vi.mock('@/pages/BadgesPage.vue', () => ({ default: {} }));
vi.mock('@/pages/EvsePage.vue', () => ({ default: {} }));
vi.mock('@/pages/HomePage.vue', () => ({ default: {} }));
vi.mock('@/pages/LoginPage.vue', () => ({ default: {} }));
vi.mock('@/pages/SessionsPage.vue', () => ({ default: {} }));
vi.mock('@/pages/StationsPage.vue', () => ({ default: {} }));

// Mock user store
let isAuthenticated = false;
vi.mock('@/store/userStore.ts', () => ({
  useUserStore: () => ({
    login: vi.fn(),
    fetchUser: vi.fn(),
    get isAuthenticated() {
      return isAuthenticated;
    },
  }),
}));

describe('router/index.ts', () => {
  it('redirects unauthenticated user to Login from protected route', async () => {
    isAuthenticated = false;
    const result = await beforeAuthGuard();
    expect(result).toBeFalsy();
  });

  it('allows authenticated user to access protected route', async () => {
    isAuthenticated = true;
    const result = await beforeAuthGuard();
    expect(result).toBeTruthy();
  });

  it('has all expected routes', async () => {
    const mod = await import('@/router/index');
    const router: Router = mod.default;
    const routeNames = router.getRoutes().map((r) => r.name);
    expect(routeNames).toEqual(
      expect.arrayContaining(['Home', 'Badges', 'Stations', 'Sessions', 'evse-detail']),
    );
  });
});
