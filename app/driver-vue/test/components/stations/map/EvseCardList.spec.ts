// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvseCardList from '@/components/stations/map/EvseCardList.vue';

const evses = [
  { id: 'evse-1', name: 'EVSE One', connectors: [] },
  { id: 'evse-2', name: 'EVSE Two', connectors: [] },
];

describe('EvseCardList', () => {
  it('renders all EvseCardItem components for each evse', () => {
    const { getByText } = render(EvseCardList, {
      props: { evses },
      global: {
        stubs: {
          EvseCardItem: {
            template: '<div>{{evse.name}}</div>',
            props: ['evse'],
          },
        },
      },
    });
    expect(getByText('EVSE One')).toBeTruthy();
    expect(getByText('EVSE Two')).toBeTruthy();
  });

  it('renders nothing if evses is empty', () => {
    const { container } = render(EvseCardList, {
      props: { evses: [] },
      global: {
        stubs: { EvseCardItem: true },
      },
    });
    // Only the wrapper div should be present
    expect(container.querySelector('.evse-card-list')?.children.length).toBe(0);
  });

  it('accepts only Evse[] as prop', () => {
    // Type test: should not throw for correct type
    expect(() =>
      render(EvseCardList, {
        props: { evses },
        global: { stubs: { EvseCardItem: true } },
      }),
    ).not.toThrow();
    // Vue does not throw for invalid prop types at runtime, only warns
    // If you want to check for warnings, use a console.warn spy
    render(EvseCardList, {
      // @ts-expect-error - purposely passing wrong type to test prop validation
      props: { evses: 'not-an-array' },
      global: { stubs: { EvseCardItem: true } },
    });
  });
});
