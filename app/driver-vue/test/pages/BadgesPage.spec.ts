// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { createTestI18n } from '@test/support/i18n';
import { routerKey } from '@test/support/routerKey.ts';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import BadgesPage from '@/pages/BadgesPage.vue';

// Mock the badges store
const mockBadgesStore = reactive({
  badges: { data: [] as Badge[] | null | undefined },
  loadAll: vi.fn(),
});

vi.mock('@/store/badges', () => ({
  useBadgesStore: () => mockBadgesStore,
}));

// Mock UI store for mobile detection
const mockUiStore = reactive({
  isMobile: false,
});

vi.mock('@/store/uiStore', () => ({
  useUiStore: () => mockUiStore,
}));

const stubs = {
  Badges: {
    name: 'Badges',
    template: '<div class="badges-stub" :data-badges-length="badges ? badges.length : 0" />',
    props: ['badges'],
  },
  ResponsiveGridLayout: {
    name: 'ResponsiveGridLayout',
    template: '<div class="grid-stub"><slot /></div>',
    props: ['minWidth', 'maxColumns'],
  },
  NoData: {
    name: 'NoData',
    template: '<button class="nodata-stub" @click="$emit(\'action\')">NoData</button>',
    props: ['title'],
  },
};

type Badge = {
  authenticationId: string;
  visualBadgeId: string;
  description: string;
  firstName: string;
  lastName: string;
  licensePlate: string;
  active: boolean;
};

describe('BadgesPage', () => {
  let routerPush: ReturnType<typeof vi.fn>;
  let router: { push: typeof routerPush };

  beforeEach(() => {
    routerPush = vi.fn();
    router = { push: routerPush };
    // Reset mocks
    vi.clearAllMocks();
    mockBadgesStore.badges.data = [];
    mockUiStore.isMobile = false;
  });

  function factory() {
    return shallowMount(BadgesPage, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
          createTestI18n(),
        ],
        stubs,
        provide: {
          [routerKey]: router,
        },
      },
    });
  }

  it('shows NoData when no badges', async () => {
    // Set empty badges array
    mockBadgesStore.badges.data = [];

    const wrapper = factory();
    await flushPromises();

    expect(wrapper.find('.nodata-stub').exists()).toBe(true);
    expect(wrapper.find('.badges-stub').exists()).toBe(false);

    await wrapper.find('.nodata-stub').trigger('click');
    expect(routerPush).toHaveBeenCalledWith({ name: 'Home' });
  });

  it('shows Badges when badges exist', async () => {
    // Set badges data
    mockBadgesStore.badges.data = [
      {
        authenticationId: 'test-auth',
        visualBadgeId: 'test-visual',
        description: 'desc',
        firstName: 'A',
        lastName: 'B',
        licensePlate: 'XYZ',
        active: true,
      },
    ];

    const wrapper = factory();
    await flushPromises();

    expect(wrapper.find('.badges-stub').exists()).toBe(true);
    expect(wrapper.find('.nodata-stub').exists()).toBe(false);
  });

  it('calls loadAll on mount', async () => {
    factory();
    await flushPromises();

    expect(mockBadgesStore.loadAll).toHaveBeenCalled();
  });

  it('handles null and undefined badges gracefully', async () => {
    // Test with null data
    mockBadgesStore.badges.data = null as Badge[] | null;
    let wrapper = factory();
    await flushPromises();
    expect(wrapper.find('.nodata-stub').exists()).toBe(true);

    // Test with undefined data
    mockBadgesStore.badges.data = undefined as Badge[] | undefined;
    wrapper = factory();
    await flushPromises();
    expect(wrapper.find('.nodata-stub').exists()).toBe(true);
  });

  it('handles large badge arrays', async () => {
    const badges = Array.from({ length: 100 }, (_, i) => ({
      authenticationId: `auth${i}`,
      visualBadgeId: `visual${i}`,
      id: `id${i}`,
      description: `desc${i}`,
      firstName: `F${i}`,
      lastName: `L${i}`,
      licensePlate: `LP${i}`,
      active: true,
    }));

    // Mock the badges store with large array
    mockBadgesStore.badges.data = badges as Badge[];

    const wrapper = factory();
    await flushPromises();
    const badgesStub = wrapper.find('.badges-stub');
    expect(badgesStub.exists()).toBe(true);
    expect(badgesStub.attributes('data-badges-length')).toBe('100');
  });

  it('repeated NoData clicks do not error', async () => {
    const wrapper = factory();
    await flushPromises();
    const noData = wrapper.find('.nodata-stub');
    await noData.trigger('click');
    await noData.trigger('click');
    expect(routerPush).toHaveBeenCalledTimes(2);
  });

  it('sets maxColumns responsively', async () => {
    // Set up test badge
    mockBadgesStore.badges.data = [
      {
        authenticationId: 'a',
        visualBadgeId: 'b',
        description: '',
        firstName: '',
        lastName: '',
        licensePlate: '',
        active: true,
      },
    ];

    // isMobile true
    mockUiStore.isMobile = true;
    let wrapper = factory();
    await flushPromises();
    let grid = wrapper.findComponent(stubs.ResponsiveGridLayout);
    expect(grid.exists()).toBe(true);
    expect(grid.props('maxColumns')).toBe(1);

    // isMobile false, badges present
    mockUiStore.isMobile = false;
    wrapper = factory();
    await flushPromises();
    grid = wrapper.findComponent(stubs.ResponsiveGridLayout);
    expect(grid.exists()).toBe(true);
    expect(grid.props('maxColumns')).toBe(null); // Should be null when not mobile and badges exist

    // isMobile false, no badges
    mockBadgesStore.badges.data = [];
    wrapper = factory();
    await flushPromises();
    grid = wrapper.findComponent(stubs.ResponsiveGridLayout);
    expect(grid.exists()).toBe(true);
    expect(grid.props('maxColumns')).toBe(1);
  });

  it('does not call onGoHome if NoData is not present', async () => {
    // Mock badges in store
    mockBadgesStore.badges.data = [
      {
        authenticationId: 'test-auth',
        visualBadgeId: 'test-visual',
        description: 'desc',
        firstName: 'A',
        lastName: 'B',
        licensePlate: 'XYZ',
        active: true,
      },
    ];

    const wrapper = factory();
    await flushPromises();
    expect(wrapper.find('.nodata-stub').exists()).toBe(false);
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('renders badges with falsy/empty properties', async () => {
    // Mock badges with empty properties
    mockBadgesStore.badges.data = [
      {
        authenticationId: '',
        visualBadgeId: '',
        description: '',
        firstName: '',
        lastName: '',
        licensePlate: '',
        active: false,
      },
    ];

    const wrapper = factory();
    await flushPromises();
    const badgesStub = wrapper.find('.badges-stub');
    expect(badgesStub.exists()).toBe(true);
    expect(badgesStub.attributes('data-badges-length')).toBe('1');
  });

  it('renders duplicate badges without error', async () => {
    // Mock duplicate badges
    mockBadgesStore.badges.data = [
      {
        authenticationId: 'dup',
        visualBadgeId: 'dup',
        description: 'desc',
        firstName: 'A',
        lastName: 'B',
        licensePlate: 'XYZ',
        active: true,
      },
      {
        authenticationId: 'dup',
        visualBadgeId: 'dup',
        description: 'desc2',
        firstName: 'C',
        lastName: 'D',
        licensePlate: 'ABC',
        active: false,
      },
    ];

    const wrapper = factory();
    await flushPromises();
    const badgesStub = wrapper.find('.badges-stub');
    expect(badgesStub.exists()).toBe(true);
    expect(badgesStub.attributes('data-badges-length')).toBe('2');
  });

  it('reacts to rapid store changes (badges toggling)', async () => {
    const wrapper = factory();

    // Start with badges
    mockBadgesStore.badges.data = [
      {
        authenticationId: '1',
        visualBadgeId: '1',
        description: 'desc',
        firstName: 'A',
        lastName: 'B',
        licensePlate: 'XYZ',
        active: true,
      },
    ];
    await flushPromises();
    expect(wrapper.find('.badges-stub').exists()).toBe(true);

    // Remove all badges
    mockBadgesStore.badges.data = [];
    await flushPromises();
    expect(wrapper.find('.nodata-stub').exists()).toBe(true);

    // Add again
    mockBadgesStore.badges.data = [
      {
        authenticationId: '2',
        visualBadgeId: '2',
        description: 'desc2',
        firstName: 'C',
        lastName: 'D',
        licensePlate: 'ABC',
        active: false,
      },
    ];
    await flushPromises();
    expect(wrapper.find('.badges-stub').exists()).toBe(true);
  });

  it('renders correctly with very long strings', async () => {
    // Mock badges with very long strings
    mockBadgesStore.badges.data = [
      {
        authenticationId: 'x'.repeat(1000),
        visualBadgeId: 'y'.repeat(1000),
        description: 'z'.repeat(1000),
        firstName: 'A'.repeat(1000),
        lastName: 'B'.repeat(1000),
        licensePlate: 'C'.repeat(1000),
        active: true,
      },
    ];

    const wrapper = factory();
    await flushPromises();
    const badgesStub = wrapper.find('.badges-stub');
    expect(badgesStub.exists()).toBe(true);
    expect(badgesStub.attributes('data-badges-length')).toBe('1');
  });

  it('reacts to isMobile toggle after mount', async () => {
    // Mock badges in store
    mockBadgesStore.badges.data = [
      {
        authenticationId: 'test',
        visualBadgeId: 'test',
        description: 'desc',
        firstName: 'A',
        lastName: 'B',
        licensePlate: 'XYZ',
        active: true,
      },
    ];

    const wrapper = factory();
    await flushPromises();

    // Simulate isMobile toggle
    mockUiStore.isMobile = true;
    await flushPromises();
    const grid = wrapper.findComponent(stubs.ResponsiveGridLayout);
    expect(grid.props('maxColumns')).toBe(1);

    mockUiStore.isMobile = false;
    await flushPromises();
    expect(grid.props('maxColumns')).toBe(null); // Should be null when not mobile and badges exist
  });
});
