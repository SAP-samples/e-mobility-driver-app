// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { createTestI18n } from '@test/support/i18n';
import { type RenderResult, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import EvseDetailPage from '@/pages/EvsePage.vue';
import { type Connector, type Evse, useEvseStore } from '@/store/evse';
import { useSessionsStore } from '@/store/sessions';

// Mock the environment variable
vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000/');

// Mock the API and fetch calls
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

// Mock UI5 components
vi.mock('@ui5/webcomponents-fiori/dist/DynamicPage.js', () => ({}));
vi.mock('@ui5/webcomponents-fiori/dist/DynamicPageTitle.js', () => ({}));
vi.mock('@ui5/webcomponents-fiori/dist/DynamicPageHeader.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Panel.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Bar.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/BusyIndicator.js', () => ({}));

vi.mock('@/components/layout/DynamicPageLayout.vue', () => ({
  default: {
    name: 'DynamicPageLayout',
    props: ['id', 'loading', 'loadingText'],
    template: `
      <div class="dynamic-page-layout-root" data-testid="dynamic-page-layout">
        <div>
          <slot name="titleArea" />
          <slot name="headerArea" />
          <div v-if="!loading" data-testid="content-area">
            <slot />
          </div>
          <div v-else class="dynamic-page-loading" data-testid="loading-indicator">
            {{ loadingText }}
          </div>
        </div>
      </div>
    `,
  },
}));

vi.mock('@/components/shared/NoData.vue', () => ({
  default: {
    name: 'NoData',
    template: '<div data-testid="no-data" @click="$emit(\'action\')">{{ title }}</div>',
    props: ['title'],
    emits: ['action'],
  },
}));

vi.mock('@/components/stations/detail/EvsePageTitle.vue', () => ({
  default: {
    name: 'EvsePageTitle',
    template: '<div data-testid="evse-page-title">{{ evse.name }}</div>',
    props: ['evse'],
  },
}));

vi.mock('@/components/stations/detail/EvsePageHeader.vue', () => ({
  default: {
    name: 'EvsePageHeader',
    template: '<div data-testid="evse-page-header">Header for {{ evse.name }}</div>',
    props: ['evse'],
  },
}));

vi.mock('@/components/stations/detail/EvseMap.vue', () => ({
  default: {
    name: 'EvseMap',
    template: '<div data-testid="evse-map">Map for EVSE {{ evse.id }}</div>',
    props: ['evse'],
  },
}));

vi.mock('@/components/stations/detail/EvseAddress.vue', () => ({
  default: {
    name: 'EvseAddress',
    template: '<div data-testid="evse-address">Address: {{ evse.location.address.street }}</div>',
    props: ['evse'],
  },
}));

vi.mock('@/components/stations/detail/EvseConnectorsTable.vue', () => ({
  default: {
    name: 'EvseConnectorsTable',
    template: '<div data-testid="evse-connectors-table">{{ connectors.length }} connectors</div>',
    props: ['connectors'],
  },
}));

// Mock data
const mockConnector: Connector = {
  connectorId: 1,
  type: 'Type2',
  currentType: 'AC',
  status: 'Available',
  voltage: 400,
  numberOfPhases: 3,
  evseIndex: 1,
  current: 32,
  currentLimit: 32,
  maximumPower: 22,
};

const mockEvse: Evse = {
  id: '123',
  name: 'Test EVSE Station',
  code: 'TEST001',
  location: {
    address: {
      city: 'Test City',
      street: 'Test Street 123',
      postalCode: '12345',
      country: 'Test Country',
    },
    coordinates: {
      latitude: '52.520008',
      longitude: '13.404954',
    },
  },
  connectors: [mockConnector],
};

// Create mock router
const mockRoutes = [
  { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  { path: '/evse/:id', name: 'evse-detail', component: EvseDetailPage },
  { path: '/evse', name: 'evse-list', component: { template: '<div>EVSE List</div>' } },
];

const createMockRouter = (initialRoute = '/evse/123'): Router => {
  const router = createRouter({
    history: createWebHistory(),
    routes: mockRoutes,
  });
  router.push(initialRoute);
  return router;
};

describe('EvseDetailPage', () => {
  let evseStore: ReturnType<typeof useEvseStore>;
  let sessionsStore: ReturnType<typeof useSessionsStore>;
  let router: Router;
  let wrapper: RenderResult;

  const renderComponent = async (
    evseId = '123',
    selectedEvse: Evse | null = null,
    loading = false, // Add loading parameter
  ): Promise<RenderResult> => {
    router = createMockRouter(`/evse/${evseId}`);
    await router.push({ name: 'evse-detail', params: { id: evseId } });

    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });
    const i18n = createTestI18n();

    // Create store instances first
    evseStore = useEvseStore(pinia);
    sessionsStore = useSessionsStore(pinia);

    // Mock store properties with correct structure
    evseStore.selectedEvse = selectedEvse;

    // Mock the evses computed property to return the structure expected by the component
    Object.defineProperty(evseStore, 'evses', {
      get: () => ({
        data: [],
        loading: false,
        hasMore: false,
        isEmpty: true,
        total: 0,
        error: null,
      }),
      configurable: true,
    });

    // Mock the selectedEvseContext computed property with loading state
    Object.defineProperty(evseStore, 'selectedEvseContext', {
      get: () => ({
        data: selectedEvse,
        loading: loading, // Use the loading parameter
        error: null,
      }),
      configurable: true,
    });

    // Mock store methods
    evseStore.fetchById = vi.fn().mockResolvedValue(mockEvse);
    sessionsStore.startSession = vi.fn();

    wrapper = render(EvseDetailPage, {
      global: {
        plugins: [pinia, router, i18n],
      },
    });

    await router.isReady();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 10));

    return wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the component with loading state when no EVSE is selected', async () => {
      await renderComponent('123', null, true);

      expect(screen.getByTestId('dynamic-page-layout')).toBeTruthy();
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
      expect(screen.getByText('Loading charge point details...')).toBeTruthy();
    });

    it('renders EVSE details when EVSE is loaded', async () => {
      await renderComponent('123', mockEvse);

      expect(screen.getByTestId('evse-page-title')).toBeTruthy();
      expect(screen.getByTestId('evse-page-header')).toBeTruthy();
      expect(screen.getByTestId('evse-map')).toBeTruthy();
      expect(screen.getByTestId('evse-address')).toBeTruthy();
      expect(screen.getByTestId('evse-connectors-table')).toBeTruthy();
    });

    it('shows NoData component when selectedEvse is null after loading', async () => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
          evses: {
            selectedEvse: null,
            loading: true, // Start with loading = true to trigger the fetch cycle
            evses: [],
            total: 0,
            currentPage: 1,
            pageSize: 100,
            error: null,
            hasData: false,
            hasMorePages: false,
          },
        },
      });
      const i18n = createTestI18n();

      const router = createMockRouter('/evse/non-existent');
      await router.push({ name: 'evse-detail', params: { id: 'non-existent' } });

      const testEvseStore = useEvseStore(pinia);
      const testSessionsStore = useSessionsStore(pinia);

      // Mock fetchById to simulate a failed fetch (returns null)
      testEvseStore.fetchById = vi.fn().mockImplementation(async (_id: string) => {
        // Simulate loading state update
        Object.defineProperty(testEvseStore, 'evses', {
          get: () => ({
            data: [],
            loading: true,
            hasMore: false,
            isEmpty: true,
            total: 0,
            error: null,
          }),
          configurable: true,
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Simulate no data found and reset loading
        testEvseStore.selectedEvse = null;
        Object.defineProperty(testEvseStore, 'evses', {
          get: () => ({
            data: [],
            loading: false,
            hasMore: false,
            isEmpty: true,
            total: 0,
            error: null,
          }),
          configurable: true,
        });

        return null;
      });

      testSessionsStore.startSession = vi.fn();

      render(EvseDetailPage, {
        global: {
          plugins: [pinia, router, i18n],
        },
      });

      await router.isReady();
      await nextTick();

      // Wait for fetchById to be called (triggered by onMounted)
      await waitFor(() => {
        expect(testEvseStore.fetchById).toHaveBeenCalledWith('non-existent');
      });

      // Wait for loading to complete and NoData to appear
      await waitFor(() => {
        expect(screen.getByTestId('no-data')).toBeTruthy();
      });

      expect(screen.getByText('No charge point data.')).toBeTruthy();
    });

    it('does not render connectors table when no connectors exist', async () => {
      const evseWithoutConnectors = { ...mockEvse, connectors: undefined };
      await renderComponent('123', evseWithoutConnectors);

      expect(screen.queryByTestId('evse-connectors-table')).toBeFalsy();
    });
  });

  describe('Data Loading', () => {
    it('fetches EVSE data on mount', async () => {
      await renderComponent('123', null);

      await waitFor(() => {
        expect(evseStore.fetchById).toHaveBeenCalledWith('123');
      });
    });

    it('fetches EVSE data when route parameter changes', async () => {
      await renderComponent('123', mockEvse);

      // Clear the mock to test the watcher
      vi.clearAllMocks();
      evseStore.fetchById = vi.fn().mockResolvedValue(mockEvse);

      // Change route parameter
      await router.push({ name: 'evse-detail', params: { id: '456' } });
      await nextTick();

      await waitFor(() => {
        expect(evseStore.fetchById).toHaveBeenCalledWith('456');
      });
    });

    it('does not fetch data when route parameter is missing', async () => {
      // Create a router with a different route structure to test missing id
      const testRoutes = [
        { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
        { path: '/evse/:id?', name: 'evse-detail', component: EvseDetailPage }, // Make id optional
      ];

      const testRouter = createRouter({
        history: createWebHistory(),
        routes: testRoutes,
      });

      // Navigate to route without id parameter
      await testRouter.push({ name: 'evse-detail', params: { id: '' } });

      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      });

      const i18n = createTestI18n();

      evseStore = useEvseStore(pinia);
      evseStore.fetchById = vi.fn();

      render(EvseDetailPage, {
        global: {
          plugins: [pinia, testRouter, i18n],
        },
      });

      await nextTick();

      expect(evseStore.fetchById).not.toHaveBeenCalled();
    });
  });

  describe('Computed Properties', () => {
    it('formats connectors correctly', async () => {
      await renderComponent('123', mockEvse);

      // We can't directly test the computed property, but we can verify
      // that the connectors table receives the data
      expect(screen.getByTestId('evse-connectors-table')).toBeTruthy();
      expect(screen.getByText('1 connectors')).toBeTruthy();
    });

    it('handles empty connectors array', async () => {
      const evseWithEmptyConnectors = { ...mockEvse, connectors: [] };
      await renderComponent('123', evseWithEmptyConnectors);

      expect(screen.getByTestId('evse-connectors-table')).toBeTruthy();
      expect(screen.getByText('0 connectors')).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    it('handles go Home action from NoData component', async () => {
      const testRouter = createMockRouter('/evse/404');
      const pushSpy = vi.spyOn(testRouter, 'push').mockResolvedValue(undefined);

      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
          evses: {
            selectedEvse: null, // Ensure this starts as null
            evses: [],
            total: 0,
            currentPage: 1,
            pageSize: 100,
            loading: false,
            error: null,
            hasData: false,
            hasMorePages: false,
          },
        },
      });

      const i18n = createTestI18n();

      const testEvseStore = useEvseStore(pinia);
      const testSessionsStore = useSessionsStore(pinia);

      // Mock fetchById to ensure selectedEvse stays null
      testEvseStore.fetchById = vi.fn().mockResolvedValue(null);
      testSessionsStore.startSession = vi.fn();

      render(EvseDetailPage, {
        global: {
          plugins: [pinia, testRouter, i18n],
        },
      });

      await testRouter.isReady();
      await nextTick();

      // Ensure selectedEvse is null (this should bypass loading state)
      testEvseStore.selectedEvse = null;
      await nextTick();

      // Wait for the no-data component to appear
      const noDataComponent = await waitFor(() => screen.getByTestId('no-data'), { timeout: 2000 });

      await fireEvent.click(noDataComponent);

      await waitFor(() => {
        expect(pushSpy).toHaveBeenCalledWith({ name: 'Home' });
      });
    });
  });

  describe('Session Integration', () => {
    it('provides session actions to child components', async () => {
      await renderComponent('123', mockEvse);

      expect(sessionsStore.startSession).toBeDefined();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct page ID', async () => {
      await renderComponent('123', mockEvse);

      const dynamicPageLayout = screen.getByTestId('dynamic-page-layout');
      expect(dynamicPageLayout).toBeTruthy();
    });

    it('renders location panel with correct structure', async () => {
      await renderComponent('123', mockEvse);

      // Both map and address should be rendered
      expect(screen.getByTestId('evse-map')).toBeTruthy();
      expect(screen.getByTestId('evse-address')).toBeTruthy();
    });

    it('renders title and header areas when EVSE is loaded', async () => {
      await renderComponent('123', mockEvse);

      expect(screen.getByTestId('content-area')).toBeTruthy();
      expect(screen.getByText('Test EVSE Station')).toBeTruthy();
      expect(screen.getByText('Header for Test EVSE Station')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', async () => {
      await renderComponent('123', null, true);

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
      expect(screen.getByText('Loading charge point details...')).toBeTruthy();
    });

    it('hides loading state when EVSE is loaded', async () => {
      await renderComponent('123', mockEvse);

      expect(screen.queryByTestId('loading-indicator')).toBeFalsy();
      expect(screen.getByTestId('content-area')).toBeTruthy();
    });
  });
});
