// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import EvsePageTitle from '@/components/stations/detail/EvsePageTitle.vue';

// Mock useSessionStart
vi.mock('@/composables/useSessionStart', () => {
  const mockStartSession = vi.fn();
  const mockReset = vi.fn();
  const mockIsStarting = ref(false);
  const mockState = ref({ status: 'idle' as const, error: null, evseId: null });

  return {
    useSessionStart: vi.fn(() => ({
      startSession: mockStartSession,
      isStarting: mockIsStarting,
      state: mockState,
      reset: mockReset,
    })),
  };
});

// Mock useEvseStatusState
vi.mock('@/composables/useEvseStatusState', () => {
  const mockIsReadyForCharging = vi.fn(() => true);
  const mockIsEvseOperational = vi.fn(() => true);
  const mockComputeEvseOcpiStatus = vi.fn(() => 'AVAILABLE');
  const mockGetEvseStatusState = vi.fn(() => 'Success');
  const mockGetEvseStatusDisplay = vi.fn(() => 'Available');

  return {
    useEvseStatusState: () => ({
      isReadyForCharging: mockIsReadyForCharging,
      isEvseOperational: mockIsEvseOperational,
      isConnectorReadyForCharging: vi.fn(() => true),
      computeEvseOcpiStatus: mockComputeEvseOcpiStatus,
      getEvseStatusState: mockGetEvseStatusState,
      getEvseStatusDisplay: mockGetEvseStatusDisplay,
    }),
    computeEvseOcpiStatus: mockComputeEvseOcpiStatus,
    getEvseStatusState: mockGetEvseStatusState,
    getEvseStatusDisplay: mockGetEvseStatusDisplay,
  };
});

const renderOptions = {
  global: {
    plugins: [createTestI18n(), createPinia()],
  },
};

// Mock router
const routerStub = { push: vi.fn() };
vi.mock('vue-router', () => ({ useRouter: () => routerStub }));

describe('EvsePageTitle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const baseEvse = {
    id: 'evse-1',
    name: 'Test EVSE',
    code: 'EVSE-123',
    connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
  };

  it('renders breadcrumbs and title with evse props', () => {
    const { getAllByText, getAllByText: getAllByText2 } = render(EvsePageTitle, {
      props: { evse: baseEvse },
      ...renderOptions,
    });
    // There are two ui5-title elements with 'Test EVSE' (heading and snappedHeading)
    const titles = getAllByText('Test EVSE');
    expect(titles.length).toBeGreaterThan(0);
    // There are two elements with 'EVSE-123' (breadcrumb and possibly heading)
    const codes = getAllByText2('EVSE-123');
    expect(codes.length).toBeGreaterThan(0);
    const stations = getAllByText('Charging Stations');
    expect(stations.length).toBeGreaterThan(0);
  });

  it('renders fallback for missing name', () => {
    const evse = { ...baseEvse, name: undefined };
    const { getAllByText } = render(EvsePageTitle, {
      props: { evse },
      ...renderOptions,
    });
    const codes = getAllByText('EVSE-123');
    expect(codes.length).toBeGreaterThan(0);
  });

  it('renders fallback for missing code', () => {
    const evse = { ...baseEvse, code: undefined };
    const { getAllByText } = render(EvsePageTitle, {
      props: { evse },
      ...renderOptions,
    });
    // There are two ui5-title elements with 'Test EVSE' (heading and snappedHeading)
    const titles = getAllByText('Test EVSE');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders empty heading if no name or code', () => {
    const evse = { ...baseEvse, name: undefined, code: undefined };
    const { container } = render(EvsePageTitle, {
      props: { evse },
      ...renderOptions,
    });
    // Should render an empty ui5-title
    const titles = container.querySelectorAll('ui5-title');
    expect(titles[0].textContent).toBe('');
  });

  it('emits router push on breadcrumb click', async () => {
    const { container } = render(EvsePageTitle, {
      props: { evse: baseEvse },
      ...renderOptions,
    });
    const breadcrumbs = container.querySelector('ui5-breadcrumbs');
    expect(breadcrumbs).toBeTruthy();
    if (breadcrumbs) {
      breadcrumbs.dispatchEvent(new CustomEvent('item-click', { bubbles: true }));
    }
    expect(routerStub.push).toHaveBeenCalledWith({ name: 'Stations' });
  });
});
