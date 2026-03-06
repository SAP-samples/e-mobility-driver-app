// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvseConnectorsTable from '@/components/stations/detail/EvseConnectorsTable.vue';

const sampleConnectors = [
  {
    connectorId: '1',
    type: 'Type2',
    currentType: 'AC',
    voltage: 230,
    numberOfPhases: 3,
    evseIndex: 0,
    current: 16,
    currentLimit: 32,
    status: 'Available',
    maximumPower: 22,
  },
  {
    connectorId: '2',
    type: 'CCS',
    currentType: 'DC',
    voltage: 400,
    numberOfPhases: 1,
    evseIndex: 1,
    current: 200,
    currentLimit: 250,
    status: 'Charging',
    maximumPower: 50,
  },
];

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('EvseConnectorsTable', () => {
  it('renders all table headers', () => {
    const { getByText } = render(EvseConnectorsTable, {
      props: { connectors: sampleConnectors },
      ...renderOptions,
    });
    [
      'ID',
      'Type',
      'Current Type',
      'Voltage',
      'Phases',
      'Charge Point Index',
      'Current',
      'Current Limit',
      'Status',
      'Max. Power',
    ].forEach((header) => {
      expect(getByText(header)).toBeTruthy();
    });
  });

  it('renders all connector rows and values', () => {
    const { getAllByText } = render(EvseConnectorsTable, {
      props: { connectors: sampleConnectors },
      ...renderOptions,
    });
    sampleConnectors.forEach((conn) => {
      expect(getAllByText(String(conn.connectorId)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.type)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.currentType)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.voltage)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.numberOfPhases)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.evseIndex)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.current)).length).toBeGreaterThan(0);
      expect(getAllByText(String(conn.currentLimit)).length).toBeGreaterThan(0);
      expect(
        getAllByText(String(conn.status === 'Charging' ? 'Occupied' : conn.status)).length,
      ).toBeGreaterThan(0);
      expect(getAllByText(String(conn.maximumPower)).length).toBeGreaterThan(0);
    });
  });

  it('renders gracefully with empty connectors array', () => {
    const { container } = render(EvseConnectorsTable, {
      props: { connectors: [] },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders gracefully with undefined connectors', () => {
    const { container } = render(EvseConnectorsTable, {
      props: { connectors: undefined },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders gracefully with null connectors', () => {
    const { container } = render(EvseConnectorsTable, {
      // @ts-expect-error: Testing null prop
      props: { connectors: null },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders gracefully with malformed connectors', () => {
    const { container } = render(EvseConnectorsTable, {
      // @ts-expect-error: Testing malformed prop
      props: { connectors: 12345 },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders gracefully with missing connectors prop', () => {
    const { container } = render(EvseConnectorsTable, {
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders with partial connector fields', () => {
    const partial = [{ connectorId: '3' }];
    const { getByText } = render(EvseConnectorsTable, {
      // @ts-expect-error: Partial connector
      props: { connectors: partial },
      ...renderOptions,
    });
    expect(getByText('3')).toBeTruthy();
  });
});
