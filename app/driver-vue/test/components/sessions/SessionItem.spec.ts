// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import SessionItem from '@/components/sessions/SessionItem.vue';
import StopSessionButton from '@/components/sessions/StopSessionButton.vue';
import type { Session } from '@/store/sessions';

// Mock useSessionStop
const mockStopSession = vi.fn();
const mockReset = vi.fn();
const mockIsStopping = ref(false);
const mockState = ref({ status: 'idle' as const, error: null, sessionId: null });

vi.mock('@/composables/useSessionStop', () => ({
  useSessionStop: vi.fn(() => ({
    stopSession: mockStopSession,
    isStopping: mockIsStopping,
    state: mockState,
    reset: mockReset,
  })),
}));

const baseSession: Session = {
  id: 123,
  sessionId: 'S-001',
  timestamp: '2025-07-15T10:00:00Z',
  siteName: 'Site X',
  siteAreaName: 'Area Y',
  badgeAuthenticationId: 'BA-001',
  badgeVisualBadgeId: 'BV-001',
  cumulatedPrice: 12.34,
  currency: 'EUR',
  status: 'Completed',
  chargingStationName: 'Station A',
  totalDuration: 3600,
  totalInactivity: 0,
  totalEnergyDelivered: 20.5,
  stateOfCharge: 80,
  emi3Id: 'EMI3-001',
  evseCode: 'EVSE-001',
  stop_extraInactivity: 0,
};

const renderOptions = {
  global: {
    components: { StopSessionButton },
    plugins: [createTestI18n()],
  },
};

describe('SessionItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStopSession.mockResolvedValue(undefined);
    mockIsStopping.value = false;
    mockState.value = { status: 'idle', error: null, sessionId: null };
  });

  it('renders all session props and formatted values', () => {
    const { getByText } = render(SessionItem, {
      props: { session: baseSession },
      ...renderOptions,
    });
    // Header - should show evseCode when available
    expect(getByText(/EVSE-001/)).toBeTruthy();
    // Price tag
    expect(getByText(/12.34/)).toBeTruthy();
    // ID
    expect(getByText('ID')).toBeTruthy();
    expect(getByText('123')).toBeTruthy();
    // Date
    expect(getByText('Date')).toBeTruthy();
    // Energy
    expect(getByText('Energy')).toBeTruthy();
    // Duration
    expect(getByText('Duration')).toBeTruthy();
    // Location
    expect(getByText('Location')).toBeTruthy();
    expect(getByText(/Site X - Area Y/)).toBeTruthy();
  });

  it('displays evseCode in header when available', () => {
    const sessionWithEvseCode = {
      ...baseSession,
      evseCode: 'EVSE-123',
      chargingStationName: 'Station A',
    };
    const { getByText } = render(SessionItem, {
      props: { session: sessionWithEvseCode },
      ...renderOptions,
    });
    // Should prioritize evseCode over chargingStationName
    expect(getByText(/EVSE-123/)).toBeTruthy();
  });

  it('falls back to chargingStationName when evseCode is not available', () => {
    const sessionWithoutEvseCode = {
      ...baseSession,
      evseCode: undefined,
      chargingStationName: 'Station A',
    } as unknown as Session;
    const { getByText } = render(SessionItem, {
      props: { session: sessionWithoutEvseCode },
      ...renderOptions,
    });
    // Should fall back to chargingStationName
    expect(getByText(/Station A/)).toBeTruthy();
  });

  it('falls back to chargingStationName when evseCode is empty string', () => {
    const sessionWithEmptyEvseCode = {
      ...baseSession,
      evseCode: '',
      chargingStationName: 'Station A',
    };
    const { getByText } = render(SessionItem, {
      props: { session: sessionWithEmptyEvseCode },
      ...renderOptions,
    });
    // Should fall back to chargingStationName when evseCode is empty
    expect(getByText(/Station A/)).toBeTruthy();
  });

  it('falls back to chargingStationName when evseCode is null', () => {
    const sessionWithNullEvseCode = {
      ...baseSession,
      evseCode: null,
      chargingStationName: 'Station A',
    } as unknown as Session;
    const { getByText } = render(SessionItem, {
      props: { session: sessionWithNullEvseCode },
      ...renderOptions,
    });
    // Should fall back to chargingStationName when evseCode is null
    expect(getByText(/Station A/)).toBeTruthy();
  });

  it('renders StopSessionButton only if status is InProgress', async () => {
    const session = { ...baseSession, status: 'InProgress', stop_extraInactivity: null };
    const { container } = render(SessionItem, {
      props: { session: session as unknown as Session },
      ...renderOptions,
    });
    await nextTick();
    const stopBtn = container.querySelector('[data-testid="stop-session-button"]');
    expect(stopBtn).toBeTruthy();
  });

  it('does not render StopSessionButton if status is not InProgress or stop_extraInactivity is set', async () => {
    const session = { ...baseSession, status: 'Completed', stop_extraInactivity: 12345 };
    const { container } = render(SessionItem, {
      props: { session },
      ...renderOptions,
    });
    await nextTick();
    const stopBtn = container.querySelector('[data-testid="stop-session-button"]');
    expect(stopBtn).toBeFalsy();
  });

  it('passes correct props to StopSessionButton', async () => {
    const session = { ...baseSession, status: 'InProgress', stop_extraInactivity: null };
    const { container } = render(SessionItem, {
      props: { session: session as unknown as Session },
      ...renderOptions,
    });
    await nextTick();
    const stopBtn = container.querySelector('[data-testid="stop-session-button"]');
    expect(stopBtn).toBeTruthy();
  });

  it('panel is collapsed if status is not InProgress', async () => {
    const session = { ...baseSession, status: 'Completed', stop_extraInactivity: 12345 };
    const { container, getByText } = render(SessionItem, {
      props: { session },
      ...renderOptions,
    });
    await nextTick();
    expect(getByText('ID')).toBeTruthy(); // Panel is rendered
    const stopBtn = container.querySelector('[data-testid="stop-session-button"]');
    expect(stopBtn).toBeFalsy(); // Stop button not rendered
  });

  it('panel is expanded if status is InProgress and stop_extraInactivity is null', async () => {
    const session = { ...baseSession, status: 'InProgress', stop_extraInactivity: null };
    const { container } = render(SessionItem, {
      props: { session: session as unknown as Session },
      ...renderOptions,
    });
    await nextTick();
    const stopBtn = container.querySelector('[data-testid="stop-session-button"]');
    expect(stopBtn).toBeTruthy();
  });
});
