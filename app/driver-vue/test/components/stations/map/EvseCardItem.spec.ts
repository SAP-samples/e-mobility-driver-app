// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

import EvseCardItem from '@/components/stations/map/EvseCardItem.vue';

const minimalEvse = {
  id: 'evse-1',
  name: 'Test EVSE',
  connectors: [],
};

const fullEvse = {
  id: 'evse-2',
  name: 'Full EVSE',
  code: 'EVSE-456',
  location: {
    siteName: 'Full Site',
    siteAreaName: 'Area 51',
    parkingLevel: 'P2',
    parkingName: 'Garage',
    parkingSpace: '42',
  },
  connectors: [
    { connectorId: 1, type: 'Type2', status: 'Available', maximumPower: 22000 },
    { connectorId: 2, type: 'CCS', status: 'Occupied', maximumPower: 50000 },
    { connectorId: 3, type: '', status: '', maximumPower: undefined },
  ],
};

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
    stubs: { EvseStartButton: true, EvseStatusTag: true },
  },
};

describe('EvseCardItem', () => {
  it('renders with minimal props and shows fallbacks', () => {
    const { container, getByText, getAllByText } = render(EvseCardItem, {
      props: { evse: minimalEvse },
      ...renderOptions,
    });
    // Title is rendered as attribute, not text node
    expect(container.querySelector('[title-text="Test EVSE"]')).toBeTruthy();
    expect(getByText('Connectors')).toBeTruthy();
    // Fallbacks for location fields
    expect(getAllByText('-', { selector: 'ui5-text' }).length).toBe(3);
  });

  it('renders all connector fields and location details', () => {
    const { container, getByText, getAllByText } = render(EvseCardItem, {
      props: { evse: fullEvse },
      ...renderOptions,
    });
    expect(container.querySelector('[title-text="Full EVSE"]')).toBeTruthy();
    expect(getByText('Full Site')).toBeTruthy();
    expect(getByText('Area 51')).toBeTruthy();
    // Parking details: use flexible matcher
    expect(getByText((c) => c.includes('Level P2'))).toBeTruthy();
    expect(getByText((c) => c.includes(', Garage'))).toBeTruthy();
    expect(getByText((c) => c.includes(', Space 42'))).toBeTruthy();
    expect(getAllByText('Type2').length).toBe(1);
    expect(getAllByText('CCS').length).toBe(1);
    expect(getAllByText('-').length).toBeGreaterThanOrEqual(1); // fallback for empty connector
    expect(getByText('22.0 kWh')).toBeTruthy();
    expect(getByText('50.0 kWh')).toBeTruthy();
    expect(getAllByText('-').length).toBeGreaterThanOrEqual(1); // fallback for missing power
  });

  it('shows status tag and maxPower badge', () => {
    const { container, getByText } = render(EvseCardItem, {
      props: { evse: fullEvse },
      ...renderOptions,
    });
    expect(container.querySelector('.evse-status-tag')).toBeTruthy();
    // Use regex to match badge text
    expect(getByText(/⚡\s*50\.0 kWh/)).toBeTruthy();
  });

  it('navigates to detail on click', async () => {
    const { container } = render(EvseCardItem, {
      props: { evse: fullEvse },
      ...renderOptions,
    });
    await fireEvent.click(container.querySelector('.content')!);
    expect(push).toHaveBeenCalledWith({ name: 'evse-detail', params: { id: 'evse-2' } });
  });

  it('handles malformed connector data gracefully', () => {
    const evse = {
      id: 'evse-3',
      connectors: [
        {},
        { connectorId: 1 },
        { connectorId: 2, type: null, status: null, maximumPower: null },
      ],
    };
    const { getAllByText } = render(EvseCardItem, {
      // @ts-expect-error - purposely passing wrong type to test fallback rendering
      props: { evse },
      ...renderOptions,
    });
    // Should show fallback '-' for missing fields
    expect(getAllByText('-').length).toBeGreaterThanOrEqual(3);
  });

  it('renders correctly with no connectors', () => {
    const evse = { ...minimalEvse, connectors: [] };
    const { container } = render(EvseCardItem, {
      props: { evse },
      ...renderOptions,
    });
    // Table header should exist, but no rows
    expect(container.querySelector('.connector-table')).toBeTruthy();
    expect(container.querySelectorAll('ui5-table-row').length).toBe(0);
  });

  it('renders fallback for missing location object', () => {
    const evse = { ...minimalEvse, location: undefined };
    const { getAllByText } = render(EvseCardItem, {
      props: { evse },
      ...renderOptions,
    });
    // All location fields should show '-'
    expect(getAllByText('-', { selector: 'ui5-text' }).length).toBeGreaterThanOrEqual(3);
  });

  it('renders connector row with all fallbacks', () => {
    const evse = { ...minimalEvse, connectors: [{ connectorId: 1 }] };
    const { getAllByText } = render(EvseCardItem, {
      props: { evse },
      ...renderOptions,
    });
    // Connector type, status, power all fallback
    expect(getAllByText('-').length).toBeGreaterThanOrEqual(3);
  });

  it('does not show maxPower badge if no valid connector power', () => {
    const evse = { ...minimalEvse, connectors: [{ connectorId: 1, maximumPower: undefined }] };
    const { container } = render(EvseCardItem, {
      props: { evse },
      ...renderOptions,
    });
    expect(container.querySelector('.maxpower-badge')).toBeFalsy();
  });

  it('renders parking details with only some fields', () => {
    const evse = {
      ...minimalEvse,
      location: { parkingLevel: 'B1' },
    };
    const { getByText, getAllByText } = render(EvseCardItem, {
      props: { evse },
      ...renderOptions,
    });
    expect(getByText((c) => c.includes('Level B1'))).toBeTruthy();
    // Other parking fields should fallback
    expect(getAllByText('-', { selector: 'ui5-text' }).length).toBe(2);
  });
});
