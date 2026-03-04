// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvseAddress from '@/components/stations/detail/EvseAddress.vue';
import type { Evse } from '@/store/evse';

const fullEvse = {
  id: 'full',
  location: {
    address: {
      number: '42',
      street: 'Main St',
      postalCode: '12345',
      city: 'Metropolis',
      countryCode: 'DE',
      country: 'Germany',
      state: 'BW',
    },
    coordinates: {
      latitude: '48.123',
      longitude: '11.456',
    },
  },
};

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('EvseAddress', () => {
  it('renders all labels', () => {
    const { getByText } = render(EvseAddress, {
      props: { evse: fullEvse },
      ...renderOptions,
    });
    [
      'Number:',
      'Street:',
      'Postal Code:',
      'City:',
      'Country Code:',
      'Country:',
      'State:',
      'Latitude:',
      'Longitude:',
    ].forEach((label) => {
      expect(getByText(label)).toBeTruthy();
    });
  });

  it('renders all values from full evse', () => {
    const { getByText } = render(EvseAddress, {
      props: { evse: fullEvse },
      ...renderOptions,
    });
    expect(getByText('42')).toBeTruthy();
    expect(getByText('Main St')).toBeTruthy();
    expect(getByText('12345')).toBeTruthy();
    expect(getByText('Metropolis')).toBeTruthy();
    expect(getByText('DE')).toBeTruthy();
    expect(getByText('Germany')).toBeTruthy();
    expect(getByText('BW')).toBeTruthy();
    expect(getByText('48.123')).toBeTruthy();
    expect(getByText('11.456')).toBeTruthy();
  });

  it('renders empty strings for missing nested fields', () => {
    const partialEvse = { id: 'partial', location: { address: {}, coordinates: {} } };
    const { getAllByText } = render(EvseAddress, {
      props: { evse: partialEvse },
      ...renderOptions,
    });
    // All fields should render as empty string
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with missing location', () => {
    const { getAllByText } = render(EvseAddress, {
      props: { evse: { id: 'missing-location' } },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with null evse', () => {
    const { getAllByText } = render(EvseAddress, {
      // @ts-expect-error: Testing null evse
      props: { evse: null },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with undefined evse', () => {
    const { getAllByText } = render(EvseAddress, {
      // @ts-expect-error: Testing undefined evse
      props: { evse: undefined },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with malformed evse', () => {
    const { getAllByText } = render(EvseAddress, {
      // @ts-expect-error: Testing malformed evse
      props: { evse: 12345 },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with evse id only', () => {
    const { getAllByText } = render(EvseAddress, {
      props: { evse: { id: 'only-id' } },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with location but no address or coordinates', () => {
    const { getAllByText } = render(EvseAddress, {
      props: { evse: { id: 'loc', location: {} } },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with address fields as null/undefined/empty', () => {
    const evse = {
      id: 'null-fields',
      location: {
        address: {
          number: null,
          street: undefined,
          postalCode: '',
          city: null,
          countryCode: undefined,
          country: '',
          state: null,
        },
        coordinates: {
          latitude: null,
          longitude: undefined,
        },
      },
    };
    const { getAllByText } = render(EvseAddress, {
      // @ts-expect-error: Intentionally malformed fields
      props: { evse },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with irrelevant/extra fields', () => {
    const evse = {
      id: 'extra',
      foo: 'bar',
      location: {
        address: { number: '1', foo: 'bar' },
        coordinates: { latitude: '1', longitude: '2', foo: 'bar' },
        bar: 'baz',
      },
      bar: 'baz',
    } as unknown as Evse;
    // Should still render known fields
    const { getAllByText } = render(EvseAddress, {
      props: { evse },
      ...renderOptions,
    });
    expect(getAllByText('1').length).toBeGreaterThan(0);
    expect(getAllByText('2').length).toBeGreaterThan(0);
  });

  it('renders gracefully with address as string', () => {
    const evse = {
      id: 'malformed-address',
      location: {
        address: 'not-an-object',
        coordinates: {},
      },
    };
    const { getAllByText } = render(EvseAddress, {
      // @ts-expect-error: Malformed address
      props: { evse },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });

  it('renders gracefully with coordinates as string', () => {
    const evse = {
      id: 'malformed-coords',
      location: {
        address: {},
        coordinates: 'not-an-object',
      },
    };
    const { getAllByText } = render(EvseAddress, {
      // @ts-expect-error: Malformed coordinates
      props: { evse },
      ...renderOptions,
    });
    expect(getAllByText('').length).toBeGreaterThanOrEqual(9);
  });
});
