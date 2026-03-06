// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import ChargingSessionCard from '@/components/dashboard/cards/ChargingSessionCard.vue';

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

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('ChargingSessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStopSession.mockResolvedValue(undefined);
    mockIsStopping.value = false;
    mockState.value = { status: 'idle', error: null, sessionId: null };
  });

  it('renders without crashing', () => {
    const { container } = render(ChargingSessionCard, {
      props: {
        sessionId: 1,
        parkingName: 'Parking A',
        evseId: 'EVSE-123',
        amount: 10.5,
        energy: 5.2,
        startDate: '2025-07-15T10:00:00Z',
        stopped: false,
      },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders parkingName, evseId, amount, and energy', () => {
    const { getByText } = render(ChargingSessionCard, {
      props: {
        sessionId: 2,
        parkingName: 'Parking B',
        evseId: 'EVSE-456',
        amount: 20.75,
        energy: 8.9,
        startDate: '2025-07-15T11:00:00Z',
        stopped: false,
      },
      ...renderOptions,
    });
    expect(getByText('Parking B')).toBeTruthy();
    expect(getByText('EVSE-456')).toBeTruthy();
    expect(getByText(/€|20.75/)).toBeTruthy();
    expect(getByText(/8.9|kWh/)).toBeTruthy();
  });

  it('shows "Charging in progress" when not stopped', () => {
    const { getByText } = render(ChargingSessionCard, {
      props: {
        sessionId: 3,
        parkingName: 'Parking C',
        evseId: 'EVSE-789',
        amount: 15.0,
        energy: 6.5,
        startDate: '2025-07-15T12:00:00Z',
        stopped: false,
      },
      ...renderOptions,
    });
    expect(getByText('Charging in progress')).toBeTruthy();
  });

  it('shows "Finishing" when stopped', () => {
    const { getByText } = render(ChargingSessionCard, {
      props: {
        sessionId: 4,
        parkingName: 'Parking D',
        evseId: 'EVSE-101',
        amount: 18.0,
        energy: 7.0,
        startDate: '2025-07-15T13:00:00Z',
        stopped: true,
      },
      ...renderOptions,
    });
    expect(getByText('Finishing')).toBeTruthy();
  });

  it('renders StopSessionButton and DurationTimer components', () => {
    const { container } = render(ChargingSessionCard, {
      props: {
        sessionId: 5,
        parkingName: 'Parking E',
        evseId: 'EVSE-202',
        amount: 22.0,
        energy: 9.0,
        startDate: '2025-07-15T14:00:00Z',
        stopped: false,
      },
      ...renderOptions,
    });
    expect(container.querySelector('button, ui5-button')).toBeTruthy();
    expect(container.querySelector('span.timer, .timer-row')).toBeTruthy();
  });
});
