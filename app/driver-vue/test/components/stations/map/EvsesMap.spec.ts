// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvsesMap from '@/components/stations/map/EvsesMap.vue';

const mockEvse = {
  id: 'evse-1',
  location: {
    coordinates: {
      latitude: '48.8566',
      longitude: '2.3522',
    },
  },
};

const mockEvse2 = {
  id: 'evse-2',
  location: {
    coordinates: {
      latitude: '47.2184',
      longitude: '-1.5536',
    },
  },
};

const MapStub = {
  props: ['triggerEvent', 'zoom', 'center', 'points', 'cluster', 'popupComponent', 'getPopupProps'],
  template: `<div data-testid="map-stub" :data-zoom="zoom" :data-center="JSON.stringify(center)"></div>`,
  emits: ['marker-click', 'marker-mouseover', 'marker-mouseout'],
  watch: {
    triggerEvent: {
      handler(val: { name: string; payload?: unknown }) {
        // @ts-expect-error Vue instance context
        if (val) this.$emit(val.name, val.payload);
      },
      immediate: true,
    },
  },
};

describe('EvsesMap', () => {
  it('renders map with evse points and correct center', () => {
    const { container, getByTestId } = render(EvsesMap, {
      props: {
        evses: [mockEvse, mockEvse2],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Map: MapStub,
        },
      },
    });
    expect(getByTestId('map-stub')).toBeTruthy();
    expect(container.querySelector('.station-map')).toBeTruthy();
  });

  it('emits evse-selected on marker click', async () => {
    const triggerEvent = { name: 'marker-click', payload: { evse: mockEvse } };
    const { emitted, rerender } = render(EvsesMap, {
      props: {
        evses: [mockEvse],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
      attrs: { triggerEvent },
    });
    await rerender({ triggerEvent });
    expect(emitted()['evse-selected']).toBeTruthy();
    const eventPayloads = emitted()['evse-selected'] as Array<Array<typeof mockEvse>>;
    expect(Array.isArray(eventPayloads)).toBe(true);
    const eventPayloadRaw = eventPayloads[0]?.[0];
    expect(eventPayloadRaw).toEqual(mockEvse);
  });

  it('emits evse-hover on marker mouseover and mouseout', async () => {
    const triggerEvent = { name: 'marker-mouseover', payload: { evse: mockEvse } };
    const { emitted, rerender } = render(EvsesMap, {
      props: {
        evses: [mockEvse],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
      attrs: { triggerEvent },
    });
    await rerender({ triggerEvent });
    await rerender({ triggerEvent: { name: 'marker-mouseout' } });
    expect(emitted()['evse-hover']).toBeTruthy();
    const hoverPayloads = emitted()['evse-hover'] as Array<Array<typeof mockEvse | null>>;
    expect(Array.isArray(hoverPayloads)).toBe(true);
    const hoverPayloadRaw = hoverPayloads[0]?.[0];
    expect(hoverPayloadRaw).toEqual(mockEvse);
    const mouseoutPayloadRaw = hoverPayloads[1]?.[0];
    expect(mouseoutPayloadRaw).toBeNull();
  });

  it('centers map on selectedEvse change', async () => {
    const { rerender, getByTestId, container } = render(EvsesMap, {
      props: {
        evses: [mockEvse, mockEvse2],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Map: MapStub,
        },
      },
    });
    await rerender({
      evses: [mockEvse, mockEvse2],
      selectedEvse: mockEvse2,
    });
    expect(getByTestId('map-stub')).toBeTruthy();
    expect(container.querySelector('.station-map')).toBeTruthy();
  });

  it('handles empty evses array and fallback center', () => {
    const { getByTestId, container } = render(EvsesMap, {
      props: {
        evses: [],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Map: MapStub,
        },
      },
    });
    expect(getByTestId('map-stub')).toBeTruthy();
    expect(container.querySelector('.station-map')).toBeTruthy();
  });

  it('does not emit events if triggerEvent is undefined', async () => {
    const { emitted, rerender } = render(EvsesMap, {
      props: {
        evses: [mockEvse],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
    });
    await rerender({});
    expect(emitted()['marker-click']).toBeUndefined();
    expect(emitted()['evse-selected']).toBeUndefined();
    expect(emitted()['evse-hover']).toBeUndefined();
  });

  it('emits marker-mouseover with null payload', async () => {
    const triggerEvent = { name: 'marker-mouseover', payload: null };
    const { emitted, rerender } = render(EvsesMap, {
      props: {
        evses: [mockEvse],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
      attrs: { triggerEvent },
    });
    await rerender({ triggerEvent });
    expect(emitted()['evse-hover']).toBeTruthy();
    const hoverPayloads = emitted()['evse-hover'] as Array<Array<typeof mockEvse | null>>;
    expect(Array.isArray(hoverPayloads)).toBe(true);
    const hoverPayloadRaw = hoverPayloads[0]?.[0];
    expect(hoverPayloadRaw).toBeNull();
  });

  it('renders with empty evses and does not emit events', () => {
    const { emitted, getByTestId, container } = render(EvsesMap, {
      props: {
        evses: [],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
    });
    expect(getByTestId('map-stub')).toBeTruthy();
    expect(container.querySelector('.station-map')).toBeTruthy();
    expect(emitted()['evse-selected']).toBeUndefined();
    expect(emitted()['evse-hover']).toBeUndefined();
  });

  it('emits marker-click with a different evse', async () => {
    const triggerEvent = { name: 'marker-click', payload: { evse: mockEvse2 } };
    const { emitted, rerender } = render(EvsesMap, {
      props: {
        evses: [mockEvse, mockEvse2],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
      attrs: { triggerEvent },
    });
    await rerender({ triggerEvent });
    expect(emitted()['evse-selected']).toBeTruthy();
    const eventPayloads = emitted()['evse-selected'] as Array<Array<typeof mockEvse>>;
    expect(Array.isArray(eventPayloads)).toBe(true);
    const eventPayloadRaw = eventPayloads[0]?.[0];
    expect(eventPayloadRaw).toEqual(mockEvse2);
  });

  it('uses world center [0, 0] when evses have no coordinates', () => {
    const mockEvseWithoutCoords = {
      id: 'evse-no-coords',
    };

    const { getByTestId, container } = render(EvsesMap, {
      props: {
        evses: [mockEvseWithoutCoords],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
    });

    expect(getByTestId('map-stub')).toBeTruthy();
    expect(container.querySelector('.station-map')).toBeTruthy();
  });

  it('uses zoom level 2 for world view when no coordinates exist', () => {
    const mockEvseWithoutCoords = {
      id: 'evse-no-coords',
      location: {
        siteAreaName: 'Test Area',
      },
    };

    const { getByTestId } = render(EvsesMap, {
      props: {
        evses: [mockEvseWithoutCoords],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
    });

    const mapStub = getByTestId('map-stub');
    expect(mapStub).toBeTruthy();
    expect(mapStub.getAttribute('data-zoom')).toBe('2');
    expect(mapStub.getAttribute('data-center')).toBe('[0,0]');
  });

  it('uses zoom level 6 for regional view when coordinates exist', () => {
    const { getByTestId } = render(EvsesMap, {
      props: {
        evses: [mockEvse],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
    });

    const mapStub = getByTestId('map-stub');
    expect(mapStub).toBeTruthy();
    expect(mapStub.getAttribute('data-zoom')).toBe('6');
    // Verify center is based on first evse coordinates
    const center = JSON.parse(mapStub.getAttribute('data-center') || '[]');
    expect(center[0]).toBeCloseTo(48.8566, 4);
    expect(center[1]).toBeCloseTo(2.3522, 4);
  });

  it('filters out evses without coordinates and uses remaining ones', () => {
    const mockEvseWithoutCoords = {
      id: 'evse-no-coords',
    };

    const { getByTestId, container } = render(EvsesMap, {
      props: {
        evses: [mockEvseWithoutCoords, mockEvse],
        selectedEvse: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: { Map: MapStub },
      },
    });

    expect(getByTestId('map-stub')).toBeTruthy();
    expect(container.querySelector('.station-map')).toBeTruthy();
  });
});
