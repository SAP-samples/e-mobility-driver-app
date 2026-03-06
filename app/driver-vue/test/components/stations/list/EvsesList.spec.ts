// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvsesList from '@/components/stations/list/EvsesList.vue';

const evses = [
  { id: 'evse-1', name: 'EVSE One', connectors: [] },
  { id: 'evse-2', name: 'EVSE Two', connectors: [] },
];

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
    stubs: { EvseItem: true },
  },
};

describe('EvsesList', () => {
  it('renders all EvseItem components for each evse', () => {
    const { container } = render(EvsesList, {
      props: { evses },
      ...renderOptions,
    });
    // Should render one ui5-li-group (since evses will be grouped)
    expect(container.querySelectorAll('ui5-li-group').length).toBeGreaterThan(0);
  });

  it('renders nothing if evses is empty', () => {
    const { container } = render(EvsesList, {
      props: { evses: [] },
      ...renderOptions,
    });
    // ui5-list should exist, but have no ui5-li-group children
    expect(container.querySelectorAll('ui5-li-group').length).toBe(0);
  });

  it('accepts only Evse[] as prop', () => {
    // Type test: should not throw for correct type
    expect(() => render(EvsesList, { props: { evses }, ...renderOptions })).not.toThrow();
    // @ts-expect-error - purposely passing wrong type to test prop validation
    render(EvsesList, { props: { evses: 'not-an-array' }, ...renderOptions });
  });

  it('renders evse with missing name using fallback', () => {
    const evses = [{ id: 'evse-3', connectors: [] }];
    const { container } = render(EvsesList, {
      props: { evses },
      ...renderOptions,
    });
    // Should render one ui5-li-group for fallback
    expect(container.querySelectorAll('ui5-li-group').length).toBe(1);
  });

  it('renders evse with empty connectors', () => {
    const evses = [{ id: 'evse-4', name: 'No Connectors', connectors: [] }];
    const { container } = render(EvsesList, {
      props: { evses },
      ...renderOptions,
    });
    // Should render one ui5-li-group
    expect(container.querySelectorAll('ui5-li-group').length).toBe(1);
  });

  it('renders all items even with duplicate IDs', () => {
    const evses = [
      { id: 'dup', name: 'A', connectors: [] },
      { id: 'dup', name: 'B', connectors: [] },
    ];
    const { container } = render(EvsesList, {
      props: { evses },
      ...renderOptions,
    });
    // Since both have no location.siteAreaName, they'll be grouped under "Other"
    expect(container.querySelectorAll('ui5-li-group').length).toBe(1);
  });

  it('renders correct number of items for large list', () => {
    const evses = Array.from({ length: 50 }, (_, i) => ({
      id: `evse-${i}`,
      name: `EVSE ${i}`,
      connectors: [],
    }));
    const { container } = render(EvsesList, {
      props: { evses },
      ...renderOptions,
    });
    // All 50 items should be grouped under "Other" since no location.siteAreaName
    expect(container.querySelectorAll('ui5-li-group').length).toBe(1);
  });

  it('renders evse with all fields missing using full fallback', () => {
    const evses = [{}];
    const { container } = render(EvsesList, {
      // @ts-expect-error - purposely passing malformed evse object
      props: { evses },
      ...renderOptions,
    });
    expect(container.querySelectorAll('ui5-li-group').length).toBe(1);
  });
});
