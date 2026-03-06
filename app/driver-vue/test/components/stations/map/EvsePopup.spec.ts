// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvsePopup from '@/components/stations/map/EvsePopup.vue';

const minimalEvse = {
  id: 'evse-1',
  name: 'Test EVSE',
  code: 'EVSE-123',
  location: { siteName: 'Test Site' },
  connectors: [],
};

const fullEvse = {
  id: 'evse-2',
  name: 'Full EVSE',
  code: 'EVSE-456',
  location: { siteName: 'Full Site' },
  connectors: [
    { connectorId: 1, type: 'Type2', status: 'Available' },
    { connectorId: 2, type: 'CCS', status: 'Occupied' },
    { connectorId: 3, type: 'CHAdeMO' },
  ],
};

describe('EvsePopup', () => {
  it('renders without crashing with minimal props', () => {
    render(EvsePopup, {
      props: { evse: minimalEvse },
    });
  });

  it('renders all fields and connectors', () => {
    const { getByText, getAllByText, container } = render(EvsePopup, {
      props: { evse: fullEvse },
    });
    expect(getByText('Full EVSE')).toBeTruthy();
    expect(getByText('EVSE-456')).toBeTruthy();
    expect(getByText('Full Site')).toBeTruthy();
    expect(getAllByText(/Connector [A-C]/).length).toBe(3);
    expect(getByText('Type2')).toBeTruthy();
    expect(getByText('CCS')).toBeTruthy();
    expect(getByText('CHAdeMO')).toBeTruthy();
    // Status tags should be present for connectors with status
    expect(container.querySelectorAll('ui5-tag').length).toBe(2);
  });

  it('renders fallback values for missing fields', () => {
    const evse = { id: 'evse-3', connectors: [] };
    const { getByText, getAllByText } = render(EvsePopup, { props: { evse } });
    expect(getByText('EVSE')).toBeTruthy();
    expect(getAllByText('-').length).toBe(2);
  });

  it('renders all connector types and handles missing status', () => {
    const evse = {
      id: 'evse-4',
      connectors: [
        { connectorId: 1, type: 'Type2' },
        { connectorId: 2, type: 'CCS', status: 'Available' },
      ],
    };
    const { getByText, container } = render(EvsePopup, { props: { evse } });
    expect(getByText('Type2')).toBeTruthy();
    expect(getByText('CCS')).toBeTruthy();
    expect(container.querySelectorAll('ui5-tag').length).toBe(1);
  });
});
