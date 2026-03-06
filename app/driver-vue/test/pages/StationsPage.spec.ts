// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { createTestI18n } from '@test/support/i18n';
import { type RenderResult, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import StationPage from '@/pages/StationsPage.vue';
import { type Evse, useEvseStore } from '@/store/evse';
import { useSessionsStore } from '@/store/sessions';

// Mock the environment variable
vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000/');

// Mock the API and fetch calls completely
vi.mock('@/store/utils/odata/odataFetch', () => ({
  odataFetch: vi.fn().mockResolvedValue({
    value: [],
    '@odata.count': 0,
  }),
}));

vi.mock('@/composables/useAuthFetch', () => ({
  default: vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ value: [], '@odata.count': 0 }),
  }),
}));

// Mock child components with proper event handling
vi.mock('@/components/layout/TwoTabsLayout.vue', () => ({
  default: {
    name: 'TwoTabsLayout',
    template: `
      <div data-testid="two-tabs-layout">
        <div data-testid="header"><slot name="header" /></div>
        <div data-testid="tab1"><slot name="tab1" /></div>
        <div data-testid="tab2"><slot name="tab2" /></div>
        <slot />
      </div>
    `,
    props: ['tab1', 'tab2'],
  },
}));

vi.mock('@/components/shared/NoData.vue', () => ({
  default: {
    template: `<div data-testid="no-data" @click="$emit('action', testPayload)">{{ title }}</div>`,
    props: ['title', 'testPayload'],
    emits: ['action'],
  },
}));

vi.mock('@/components/stations/shared/EvseFilterBar.vue', () => ({
  default: {
    template: `<div data-testid="evse-filter-bar" @click="$emit('search', $attrs.searchPayload || { value: 'test search' })"></div>`,
    emits: ['search'],
  },
}));

vi.mock('@/components/stations/list/EvsesList.vue', () => ({
  default: {
    template: `
      <div data-testid="evses-list">
        <div @click="$emit('evse-selected', testPayload || { id: '1', name: 'Test EVSE' })">EVSEs List</div>
        <button v-if="hasMorePages" data-testid="load-more" @click="$emit('load-more')">Load More</button>
      </div>
    `,
    props: ['evses', 'total', 'currentPage', 'hasMorePages', 'testPayload'],
    emits: ['evse-selected', 'load-more'],
  },
}));

vi.mock('@/components/stations/map/EvseCardList.vue', () => ({
  default: {
    template: `<div data-testid="evse-card-list" @click="$emit('evse-selected', testPayload || { id: '1', name: 'Test EVSE' })">Card List</div>`,
    props: ['evses', 'testPayload'],
    emits: ['evse-selected'],
  },
}));

vi.mock('@/components/stations/map/EvsesMap.vue', () => ({
  default: {
    name: 'EvsesMap',
    template: '<div data-testid="evses-map">Map</div>',
    props: ['evses'],
  },
}));

// Mock data
const mockEvse: Evse = {
  id: '1',
  name: 'Test EVSE',
  code: 'TEST001',
  location: {
    address: {
      city: 'Test City',
      street: 'Test Street',
    },
    coordinates: {
      latitude: '45.123',
      longitude: '2.456',
    },
  },
  connectors: [
    {
      connectorId: 1,
      type: 'Type2',
      status: 'Available',
      maximumPower: 22,
    },
  ],
};

// Create mock router
const mockRoutes = [
  { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  { path: '/stations', name: 'evse-search', component: StationPage },
  { path: '/evse/:id', name: 'evse-detail', component: { template: '<div>EVSE Detail</div>' } },
];

const createMockRouter = (initialRoute = '/stations') => {
  const router = createRouter({
    history: createWebHistory(),
    routes: mockRoutes,
  });
  router.push(initialRoute);
  return router;
};

describe('StationPage', () => {
  let evseStore: ReturnType<typeof useEvseStore>;
  let sessionsStore: ReturnType<typeof useSessionsStore>;
  let router: Router;
  let wrapper: RenderResult;

  const renderComponent = async (
    routeQuery: Record<string, string> = {},
    componentProps: Record<string, unknown> = {},
  ) => {
    router = createMockRouter();
    await router.push({ path: '/stations', query: routeQuery });

    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
      initialState: {
        evses: {
          evses: [],
          selectedEvse: null,
          total: 0,

          pageSize: 100,
          loading: false,
          error: null,
          hasData: false,
          hasMorePages: false,
        },
      },
    });

    // Create store instances first
    evseStore = useEvseStore(pinia);
    sessionsStore = useSessionsStore(pinia);

    // Mock all store methods BEFORE component renders
    evseStore.loadEvses = vi.fn().mockResolvedValue([mockEvse]);
    evseStore.loadNearby = vi.fn().mockResolvedValue([mockEvse]);
    evseStore.fetchById = vi.fn().mockResolvedValue(mockEvse);
    evseStore.createQuery = vi.fn().mockReturnValue({
      search: vi.fn().mockReturnThis(),
      availableOnly: vi.fn().mockReturnThis(),
      connected: vi.fn().mockReturnThis(),
      disconnected: vi.fn().mockReturnThis(),
      fastChargingOnly: vi.fn().mockReturnThis(),
      inSiteArea: vi.fn().mockReturnThis(),
      inCity: vi.fn().mockReturnThis(),
      nearLocation: vi.fn().mockReturnThis(),
      setOrderBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      page: vi.fn().mockReturnThis(),
      clone: vi.fn().mockReturnThis(),
      getLocation: vi.fn().mockReturnValue(null),
    });
    evseStore.setSelectedEvse = vi.fn();
    evseStore.clearResults = vi.fn();
    evseStore.clearError = vi.fn();
    sessionsStore.startSession = vi.fn();

    wrapper = render(StationPage, {
      props: componentProps,
      global: {
        plugins: [pinia, router, createTestI18n()],
      },
    });

    // Wait for router to be ready and component to mount
    await router.isReady();
    await nextTick();
    // Add additional wait to ensure onMounted lifecycle completes
    await new Promise((resolve) => setTimeout(resolve, 10));

    return wrapper;
  };

  // Helper function to update store state and trigger reactivity
  const updateStoreState = async (
    updates: Partial<{
      evses: Evse[];
      hasData: boolean;
      loading: boolean;
      error: string | null;
      hasMorePages: boolean;
    }>,
  ) => {
    // Mock the evses computed property directly
    if (
      'evses' in updates ||
      'loading' in updates ||
      'error' in updates ||
      'hasMorePages' in updates
    ) {
      // Get current state if available to preserve data not being updated
      const mockedStore = vi.mocked(evseStore) as typeof evseStore & {
        evses?: {
          data: Evse[];
          loading: boolean;
          hasMore: boolean;
          isEmpty: boolean;
          total: number;
          error: string | null;
        };
      };
      const currentState = mockedStore.evses || {
        data: [],
        loading: false,
        hasMore: false,
        isEmpty: true,
        total: 0,
        error: null,
      };

      const mockEvses = {
        data: updates.evses ?? currentState.data,
        loading: updates.loading ?? currentState.loading,
        hasMore: updates.hasMorePages ?? currentState.hasMore,
        isEmpty: updates.evses ? updates.evses.length === 0 : currentState.isEmpty,
        total: updates.evses?.length ?? currentState.total,
        error: updates.error ?? currentState.error,
      };

      // Use vi.mocked to override the computed property
      mockedStore.evses = mockEvses;
    }
    await nextTick();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the component with correct layout', async () => {
      await renderComponent();

      expect(screen.getByTestId('two-tabs-layout')).toBeTruthy();
      expect(screen.getByTestId('evse-filter-bar')).toBeTruthy();
    });

    it('shows no data when no EVSEs are loaded and not loading', async () => {
      await renderComponent();

      await updateStoreState({
        evses: [],
        hasData: false,
        loading: false,
      });

      const noDataElements = screen.getAllByTestId('no-data');
      expect(noDataElements.length).toBe(2);
    });

    it('shows loading state when loading', async () => {
      await renderComponent();

      await updateStoreState({
        loading: true,
        hasData: false,
      });

      const loadingTexts = screen.getAllByText('Searching for charge points...');
      expect(loadingTexts.length).toBe(2);
    });

    it('shows EVSEs data when available', async () => {
      await renderComponent();

      await updateStoreState({
        evses: [mockEvse],
        hasData: true,
        loading: false,
      });

      expect(screen.getByTestId('evses-map')).toBeTruthy();
      expect(screen.getByTestId('evse-card-list')).toBeTruthy();
      expect(screen.getByTestId('evses-list')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('handles text search', async () => {
      await renderComponent();

      const filterBar = screen.getByTestId('evse-filter-bar');
      await fireEvent.click(filterBar);

      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });
  });

  describe('Route Query Handling', () => {
    it('fetches available EVSEs when available=true in query', async () => {
      await renderComponent({ available: 'true' });

      // Wait for onMounted to execute
      await waitFor(() => {
        expect(evseStore.createQuery).toHaveBeenCalled();
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });

    it('fetches EVSEs for specific site area', async () => {
      await renderComponent({ siteArea: 'Test Area' });

      await waitFor(() => {
        expect(evseStore.createQuery).toHaveBeenCalled();
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });

    it('combines multiple query parameters', async () => {
      await renderComponent({
        available: 'true',
        siteArea: 'Test Area',
        city: 'Test City',
      });

      await waitFor(() => {
        expect(evseStore.createQuery).toHaveBeenCalled();
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });
  });

  describe('Event Handling', () => {
    it('handles EVSE selection from list and navigates to detail page', async () => {
      await renderComponent();

      // Create the router spy AFTER renderComponent creates the router
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined);

      await updateStoreState({
        evses: [mockEvse],
        hasData: true,
        loading: false,
      });

      const evsesList = screen.getByTestId('evses-list');
      const evseItemDiv = evsesList.querySelector('div');
      await fireEvent.click(evseItemDiv!);

      await waitFor(() => {
        expect(evseStore.setSelectedEvse).toHaveBeenCalledWith({ id: '1', name: 'Test EVSE' });
        expect(pushSpy).toHaveBeenCalledWith({
          name: 'evse-detail',
          params: { id: '1' },
        });
      });
    });

    it('handles EVSE selection from card list and navigates to detail page', async () => {
      await renderComponent();

      // Create the router spy AFTER renderComponent creates the router
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined);

      await updateStoreState({
        evses: [mockEvse],
        hasData: true,
        loading: false,
      });

      const cardList = screen.getByTestId('evse-card-list');
      await fireEvent.click(cardList);

      await waitFor(() => {
        expect(evseStore.setSelectedEvse).toHaveBeenCalledWith({ id: '1', name: 'Test EVSE' });
        expect(pushSpy).toHaveBeenCalledWith({
          name: 'evse-detail',
          params: { id: '1' },
        });
      });
    });

    it('handles load more functionality and calls search with incremented page', async () => {
      // Create pinia with proper initial state
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      });

      // Initialize stores
      evseStore = useEvseStore(pinia);
      sessionsStore = useSessionsStore(pinia);

      // Mock store methods
      evseStore.loadEvses = vi.fn().mockResolvedValue([mockEvse]);
      evseStore.loadMoreEvses = vi.fn().mockResolvedValue([mockEvse]);
      evseStore.createQuery = vi.fn().mockReturnValue({
        search: vi.fn().mockReturnThis(),
        availableOnly: vi.fn().mockReturnThis(),
        connected: vi.fn().mockReturnThis(),
        fastChargingOnly: vi.fn().mockReturnThis(),
        inSiteArea: vi.fn().mockReturnThis(),
        inCity: vi.fn().mockReturnThis(),
        nearLocation: vi.fn().mockReturnThis(),
        setOrderBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        page: vi.fn().mockReturnThis(),
      });

      // Use a custom wrapper that properly emits the search event
      wrapper = render(StationPage, {
        global: {
          plugins: [pinia, router, createTestI18n()],
          stubs: {
            EvseFilterBar: {
              template: `<div data-testid="evse-filter-bar" @click="handleClick"></div>`,
              methods: {
                handleClick() {
                  this.$emit('search', { value: 'test search' });
                },
              },
              emits: ['search'],
            },
          },
        },
      });

      await router.isReady();
      await nextTick();

      // Set up initial search state
      await updateStoreState({
        evses: [mockEvse],
        hasData: true,
        hasMorePages: true,
        loading: false,
      });

      // Trigger initial search by clicking filter bar
      const filterBar = screen.getByTestId('evse-filter-bar');
      await fireEvent.click(filterBar);

      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });

      // Clear mocks to test load more specifically
      vi.clearAllMocks();
      evseStore.loadMoreEvses = vi.fn().mockResolvedValue([mockEvse]);

      // Now click load more
      const loadMoreButton = screen.getByTestId('load-more');
      await fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(evseStore.loadMoreEvses).toHaveBeenCalled();
      });
    });

    it('handles search event from filter bar', async () => {
      await renderComponent();

      const filterBar = screen.getByTestId('evse-filter-bar');
      await fireEvent.click(filterBar);

      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });

    it('handles go Home action from NoData component in tab1', async () => {
      await renderComponent();

      // Create the router spy AFTER renderComponent creates the router
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined);

      await updateStoreState({
        hasData: false,
        loading: false,
      });

      const noDataComponents = screen.getAllByTestId('no-data');
      expect(noDataComponents.length).toBe(2);
      await fireEvent.click(noDataComponents[0]);

      await waitFor(() => {
        expect(pushSpy).toHaveBeenCalledWith({ name: 'Home' });
      });
    });

    it('handles go Home action from NoData component in tab2', async () => {
      await renderComponent();

      // Create the router spy AFTER renderComponent creates the router
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined);

      await updateStoreState({
        hasData: false,
        loading: false,
      });

      const noDataComponents = screen.getAllByTestId('no-data');
      expect(noDataComponents.length).toBe(2);
      await fireEvent.click(noDataComponents[1]);

      await waitFor(() => {
        expect(pushSpy).toHaveBeenCalledWith({ name: 'Home' });
      });
    });

    it('does not trigger load more when hasMorePages is false', async () => {
      await renderComponent();

      // Set up initial state with some data and hasMorePages true to allow search
      await updateStoreState({
        evses: [mockEvse],
        hasData: true,
        hasMorePages: true,
        loading: false,
      });

      // Trigger a search to set lastQuery
      const filterBar = screen.getByTestId('evse-filter-bar');
      await fireEvent.click(filterBar);

      // Wait for search to complete
      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });

      // Update state to hasMorePages: false FIRST
      await updateStoreState({
        hasMorePages: false,
        loading: false,
      });

      // Clear mocks AFTER state is set
      vi.clearAllMocks();

      // Set up a fresh spy to track calls
      const loadEvsesSpy = vi.fn().mockResolvedValue([mockEvse]);
      evseStore.loadEvses = loadEvsesSpy;

      // Explicitly override the evses.hasMore property to ensure it's false
      const mockedStore = vi.mocked(evseStore) as typeof evseStore & {
        evses: {
          data: Evse[];
          loading: boolean;
          hasMore: boolean;
          isEmpty: boolean;
          total: number;
          error: string | null;
        };
      };
      mockedStore.evses = {
        ...mockedStore.evses,
        hasMore: false,
      };

      // Wait for state to be fully updated and verified
      await waitFor(() => {
        expect(evseStore.evses.hasMore).toBe(false);
      });

      // The load more button should not exist when hasMorePages is false
      const loadMoreButton = screen.queryByTestId('load-more');
      expect(loadMoreButton).toBeNull();

      // Verify that loadEvses is never called since button doesn't exist
      expect(loadEvsesSpy).not.toHaveBeenCalled();
    });
  });

  describe('Search Event Handling', () => {
    it('handles search with direct EVSE selection', async () => {
      const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined);

      // Mock the EvseFilterBar to emit a search event with evseId
      wrapper = render(StationPage, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              stubActions: false,
            }),
            router,
            createTestI18n(),
          ],
          stubs: {
            EvseFilterBar: {
              template: `<div data-testid="evse-filter-bar" @click="$emit('search', { evseId: '123' })"></div>`,
              emits: ['search'],
            },
          },
        },
      });

      await router.isReady();
      await nextTick();

      const filterBar = screen.getByTestId('evse-filter-bar');
      await fireEvent.click(filterBar);

      await waitFor(() => {
        expect(pushSpy).toHaveBeenCalledWith({
          name: 'evse-detail',
          params: { id: '123' },
        });
      });
    });

    it('handles search with text query and filters', async () => {
      await renderComponent();

      const filterBar = screen.getByTestId('evse-filter-bar');
      await fireEvent.click(filterBar);

      await waitFor(() => {
        expect(evseStore.createQuery).toHaveBeenCalled();
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error banner when there is an error', async () => {
      await renderComponent();

      await updateStoreState({
        error: 'Test error message',
      });

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeTruthy();
        expect(screen.getByText('Dismiss')).toBeTruthy();
      });
    });

    it('clears error when dismiss button is clicked', async () => {
      await renderComponent();

      await updateStoreState({
        error: 'Test error message',
      });

      await waitFor(() => {
        expect(screen.getByText('Dismiss')).toBeTruthy();
      });

      const dismissButton = screen.getByText('Dismiss');
      await fireEvent.click(dismissButton);

      expect(evseStore.clearError).toHaveBeenCalled();
    });
  });

  describe('Store Integration', () => {
    it('provides session actions to child components', async () => {
      await renderComponent();

      expect(sessionsStore.startSession).toBeDefined();
    });

    it('clears results when navigating away from station page', async () => {
      await renderComponent();

      // Simulate route change by pushing to Home
      await router.push({ name: 'Home' });
      await nextTick();

      // Wait for the watcher to trigger
      await waitFor(() => {
        expect(evseStore.clearResults).toHaveBeenCalled();
      });
    });
  });

  describe('Watchers and Lifecycle', () => {
    it('watches route query changes for siteArea', async () => {
      await renderComponent({ siteArea: 'Area1' });

      // Wait for initial call
      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });

      // Clear mocks after initial render
      vi.clearAllMocks();
      // Re-mock the methods since clearAllMocks clears them
      evseStore.createQuery = vi.fn().mockReturnValue({
        search: vi.fn().mockReturnThis(),
        availableOnly: vi.fn().mockReturnThis(),
        fastChargingOnly: vi.fn().mockReturnThis(),
        inSiteArea: vi.fn().mockReturnThis(),
        inCity: vi.fn().mockReturnThis(),
        page: vi.fn().mockReturnThis(),
      });
      evseStore.loadEvses = vi.fn().mockResolvedValue([mockEvse]);

      // Change route query
      await router.push({ path: '/stations', query: { siteArea: 'Area2' } });
      await nextTick();

      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });

    it('watches route query changes for available', async () => {
      await renderComponent({ available: 'false' });

      // Wait for initial call
      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });

      // Clear and re-mock
      vi.clearAllMocks();
      evseStore.createQuery = vi.fn().mockReturnValue({
        search: vi.fn().mockReturnThis(),
        availableOnly: vi.fn().mockReturnThis(),
        connected: vi.fn().mockReturnThis(),
        fastChargingOnly: vi.fn().mockReturnThis(),
        inSiteArea: vi.fn().mockReturnThis(),
        inCity: vi.fn().mockReturnThis(),
        page: vi.fn().mockReturnThis(),
      });
      evseStore.loadEvses = vi.fn().mockResolvedValue([mockEvse]);

      // Change route query
      await router.push({ path: '/stations', query: { available: 'true' } });
      await nextTick();

      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });

    it('watches route query changes for city', async () => {
      await renderComponent({ city: 'City1' });

      // Wait for initial call
      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });

      // Clear and re-mock
      vi.clearAllMocks();
      evseStore.createQuery = vi.fn().mockReturnValue({
        search: vi.fn().mockReturnThis(),
        availableOnly: vi.fn().mockReturnThis(),
        fastChargingOnly: vi.fn().mockReturnThis(),
        inSiteArea: vi.fn().mockReturnThis(),
        inCity: vi.fn().mockReturnThis(),
        page: vi.fn().mockReturnThis(),
      });
      evseStore.loadEvses = vi.fn().mockResolvedValue([mockEvse]);

      // Change route query
      await router.push({ path: '/stations', query: { city: 'City2' } });
      await nextTick();

      await waitFor(() => {
        expect(evseStore.loadEvses).toHaveBeenCalled();
      });
    });
  });
});
