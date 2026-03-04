// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUiStore } from '@/store/uiStore';

// Helper to mock window.innerWidth
defineGlobalProperty('innerWidth', 1024);

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
}

describe('Store: app/driver-vue/src/store/uiStore.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setWindowWidth(1024); // default desktop
  });

  it('initializes with correct state for desktop', () => {
    setWindowWidth(1200);
    const store = useUiStore();
    expect(store.isMobile).toBe(false);
    expect(store.sidebarOpen).toBe(true);
  });

  it('initializes with correct state for mobile', () => {
    setWindowWidth(500);
    const store = useUiStore();
    expect(store.isMobile).toBe(true);
    expect(store.sidebarOpen).toBe(false);
  });

  it('toggleSidebar toggles sidebarOpen', () => {
    const store = useUiStore();
    const initial = store.sidebarOpen;
    store.toggleSidebar();
    expect(store.sidebarOpen).toBe(!initial);
    store.toggleSidebar();
    expect(store.sidebarOpen).toBe(initial);
  });

  it('setSidebar sets sidebarOpen explicitly', () => {
    const store = useUiStore();
    store.setSidebar(true);
    expect(store.sidebarOpen).toBe(true);
    store.setSidebar(false);
    expect(store.sidebarOpen).toBe(false);
  });

  it('updateIsMobile updates isMobile and sidebarOpen (desktop to mobile)', () => {
    const store = useUiStore();
    setWindowWidth(500);
    store.updateIsMobile();
    expect(store.isMobile).toBe(true);
    expect(store.sidebarOpen).toBe(false);
  });

  it('updateIsMobile updates isMobile and sidebarOpen (mobile to desktop)', () => {
    setWindowWidth(500);
    const store = useUiStore();
    setWindowWidth(1200);
    store.updateIsMobile();
    expect(store.isMobile).toBe(false);
    expect(store.sidebarOpen).toBe(true);
  });

  it('reactivity: sidebarOpen and isMobile are reactive', () => {
    const store = useUiStore();
    expect(store.sidebarOpen).toBe(true);
    store.sidebarOpen = false;
    expect(store.sidebarOpen).toBe(false);
    store.isMobile = true;
    expect(store.isMobile).toBe(true);
  });

  it('handles edge case: updateIsMobile does not throw if window.innerWidth is undefined', () => {
    const store = useUiStore();
    setWindowWidth(undefined as unknown as number);
    expect(() => store.updateIsMobile()).not.toThrow();
    // Should fallback to false (not mobile)
    expect(typeof store.isMobile).toBe('boolean');
  });

  it('does not change sidebarOpen if updateIsMobile is called with no width change', () => {
    setWindowWidth(1200);
    const store = useUiStore();
    const initialSidebar = store.sidebarOpen;
    store.updateIsMobile();
    expect(store.sidebarOpen).toBe(initialSidebar);
    store.updateIsMobile();
    expect(store.sidebarOpen).toBe(initialSidebar);
  });

  it('handles rapid window size changes (resize simulation)', () => {
    const store = useUiStore();
    setWindowWidth(500);
    store.updateIsMobile();
    expect(store.isMobile).toBe(true);
    expect(store.sidebarOpen).toBe(false);
    setWindowWidth(1200);
    store.updateIsMobile();
    expect(store.isMobile).toBe(false);
    expect(store.sidebarOpen).toBe(true);
    setWindowWidth(899);
    store.updateIsMobile();
    expect(store.isMobile).toBe(true);
    expect(store.sidebarOpen).toBe(false);
  });

  it('setSidebar is overridden by updateIsMobile', () => {
    setWindowWidth(1200);
    const store = useUiStore();
    store.setSidebar(false);
    expect(store.sidebarOpen).toBe(false);
    setWindowWidth(500);
    store.updateIsMobile();
    expect(store.sidebarOpen).toBe(false);
    setWindowWidth(1200);
    store.updateIsMobile();
    expect(store.sidebarOpen).toBe(true);
  });

  it('isMobile and sidebarOpen remain booleans after all mutations', () => {
    const store = useUiStore();
    store.setSidebar(true);
    expect(typeof store.sidebarOpen).toBe('boolean');
    store.setSidebar(false);
    expect(typeof store.sidebarOpen).toBe('boolean');
    store.isMobile = true;
    expect(typeof store.isMobile).toBe('boolean');
    store.isMobile = false;
    expect(typeof store.isMobile).toBe('boolean');
  });

  it('window.innerWidth exactly at breakpoint is not mobile', () => {
    setWindowWidth(900);
    const store = useUiStore();
    expect(store.isMobile).toBe(false);
    expect(store.sidebarOpen).toBe(true);
  });

  it('window.innerWidth negative or NaN is treated as mobile/desktop per logic', () => {
    setWindowWidth(-1);
    const storeNeg = useUiStore();
    // NEGATIVE { width: -1, isMobile: true, sidebarOpen: false }
    expect(storeNeg.isMobile).toBe(true);
    expect(storeNeg.sidebarOpen).toBe(false);
    setWindowWidth(NaN);
    const storeNaN = useUiStore();
    // NAN { width: NaN, isMobile: true, sidebarOpen: false }
    expect(storeNaN.isMobile).toBe(true);
    expect(storeNaN.sidebarOpen).toBe(false);
  });
});

// Helper for global property definition
declare global {
  // eslint-disable-next-line no-var
  var innerWidth: number;
}
function defineGlobalProperty(key: string, value: unknown) {
  Object.defineProperty(window, key, { value, configurable: true, writable: true });
}
