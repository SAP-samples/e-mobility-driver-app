// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvseMap from '@/components/stations/detail/EvseMap.vue';
import type { Evse } from '@/store/evse';

describe('EvseMap', () => {
  it('renders without crashing with minimal props', () => {
    // Provide minimal required props for EvseMap
    // @ts-expect-error: Intentionally testing missing required prop for robustness
    const { container } = render(EvseMap, { props: {} });
    expect(container).toBeTruthy();
  });

  it('renders with null evse prop', () => {
    const { container } = render(EvseMap, { props: { evse: null } });
    expect(container).toBeTruthy();
  });

  it('renders with minimal evse object', () => {
    const evse = { id: 'evse-1' };
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with full evse object', () => {
    const evse = {
      id: 'evse-2',
      name: 'Test EVSE',
      latitude: 48.123,
      longitude: 11.456,
    };
    const { container } = render(EvseMap, { props: { evse } });
    // Optionally check for map markers, coordinates, or labels if rendered
    expect(container).toBeTruthy();
  });

  it('handles irrelevant fields gracefully', () => {
    const evse = { id: 'evse-3', foo: 'bar', latitude: 0, longitude: 0 };
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with only latitude', () => {
    const evse = { id: 'evse-lat', latitude: 48.123 };
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with only longitude', () => {
    const evse = { id: 'evse-lon', longitude: 11.456 };
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('handles invalid coordinates (non-numeric)', () => {
    const evse = { id: 'evse-invalid', latitude: 'foo', longitude: 'bar' } as unknown as Evse;
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with string latitude/longitude', () => {
    const evse = { id: 'evse-4', latitude: '48.123', longitude: '11.456' } as unknown as Evse;
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with out-of-range coordinates', () => {
    const evse = { id: 'evse-5', latitude: 999, longitude: -999 };
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with undefined latitude/longitude', () => {
    const evse = { id: 'evse-6', latitude: undefined, longitude: undefined };
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });

  it('renders with empty object as evse', () => {
    const { container } = render(EvseMap, { props: { evse: {} as unknown as Evse } });
    expect(container).toBeTruthy();
  });

  it('renders with no props at all', () => {
    const { container } = render(EvseMap);
    expect(container).toBeTruthy();
  });

  it('renders with malformed evse prop', () => {
    const { container } = render(EvseMap, { props: { evse: 12345 as unknown as Evse } });
    expect(container).toBeTruthy();
  });

  it('renders with null latitude/longitude', () => {
    const evse = { id: 'evse-7', latitude: null, longitude: null } as unknown as Evse;
    const { container } = render(EvseMap, { props: { evse } });
    expect(container).toBeTruthy();
  });
});
