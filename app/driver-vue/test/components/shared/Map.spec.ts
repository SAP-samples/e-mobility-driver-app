// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render, waitFor } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Map from '@/components/shared/Map.vue';

const DummyPopup = {
  template: '<div>Popup Content</div>',
};

// Mock Leaflet
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  addLayer: vi.fn().mockReturnThis(),
  removeLayer: vi.fn().mockReturnThis(),
  fitBounds: vi.fn().mockReturnThis(),
  invalidateSize: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
};

const mockMarker = {
  on: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  openPopup: vi.fn().mockReturnThis(),
  closePopup: vi.fn().mockReturnThis(),
};

const mockLayerGroup = {
  addLayer: vi.fn().mockReturnThis(),
  clearLayers: vi.fn().mockReturnThis(),
};

const mockMarkerClusterGroup = {
  addLayer: vi.fn().mockReturnThis(),
  clearLayers: vi.fn().mockReturnThis(),
};

const mockTileLayer = {
  addTo: vi.fn().mockReturnThis(),
};

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    marker: vi.fn(() => mockMarker),
    layerGroup: vi.fn(() => mockLayerGroup),
    markerClusterGroup: vi.fn(() => mockMarkerClusterGroup),
    tileLayer: vi.fn(() => mockTileLayer),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
    latLngBounds: vi.fn((points) => ({
      isValid: () => true,
      getBounds: () => points,
    })),
    Icon: {
      Default: {
        mergeOptions: vi.fn(),
      },
    },
  },
}));

// Mock leaflet CSS and cluster imports
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet.markercluster/dist/leaflet.markercluster.js', () => ({}));
vi.mock('leaflet.markercluster/dist/MarkerCluster.Default.css', () => ({}));

// Safe ResizeObserver mock for different environments
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver safely across environments
if (typeof global !== 'undefined') {
  global.ResizeObserver = mockResizeObserver;
} else if (typeof window !== 'undefined') {
  (window as any).ResizeObserver = mockResizeObserver;
} else {
  // Fallback for other environments
  (globalThis as any).ResizeObserver = mockResizeObserver;
}

describe('Map', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(Map, {
      props: {
        points: [
          { lat: 48.8584, lng: 2.2945 },
          { lat: 51.5074, lng: -0.1278 },
        ],
      },
    });
    expect(container).toBeTruthy();
    expect(container.querySelector('.leaflet-map')).toBeTruthy();
  });

  it('renders with no points', () => {
    const { container } = render(Map, {
      props: {
        points: [],
      },
    });
    expect(container).toBeTruthy();
    expect(container.querySelector('.leaflet-map')).toBeTruthy();
  });

  it('renders with custom center and zoom', () => {
    const { container } = render(Map, {
      props: {
        points: [{ lat: 40.7128, lng: -74.006 }],
        center: [40.7128, -74.006] as [number, number],
        zoom: 10,
      },
    });
    expect(container).toBeTruthy();
  });

  it('renders with clustering enabled', () => {
    const { container } = render(Map, {
      props: {
        points: [
          { lat: 48.8584, lng: 2.2945 },
          { lat: 51.5074, lng: -0.1278 },
        ],
        cluster: true,
      },
    });
    expect(container).toBeTruthy();
  });

  it('auto-fits map by default when multiple points provided', async () => {
    render(Map, {
      props: {
        points: [
          { lat: 48.8584, lng: 2.2945 },
          { lat: 51.5074, lng: -0.1278 },
        ],
      },
    });

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalled();
    });
  });

  it('centers on single point when only one point provided', async () => {
    render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalledWith([48.8584, 2.2945], 15);
    });
  });

  it('disables auto-fit when autoFit is false', async () => {
    render(Map, {
      props: {
        points: [
          { lat: 48.8584, lng: 2.2945 },
          { lat: 51.5074, lng: -0.1278 },
        ],
        autoFit: false,
      },
    });

    await waitFor(() => {
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });

  it('emits map-ready event', async () => {
    const { emitted } = render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    await waitFor(() => {
      expect(emitted()['map-ready']).toBeTruthy();
    });
  });

  it('renders with a popupComponent', () => {
    const { container } = render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
        popupComponent: DummyPopup,
      },
    });
    expect(container).toBeTruthy();
  });

  it('handles points reactivity', async () => {
    const { container, rerender } = render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });
    expect(container).toBeTruthy();

    await rerender({
      points: [{ lat: 51.5074, lng: -0.1278 }],
    });
    expect(container).toBeTruthy();
  });

  it('updates markers when points change (watch logic)', async () => {
    const initialPoints = [{ lat: 48.8584, lng: 2.2945 }];
    const updatedPoints = [
      { lat: 51.5074, lng: -0.1278 },
      { lat: 40.7128, lng: -74.006 },
    ];

    const { container, rerender } = render(Map, {
      props: {
        points: initialPoints,
      },
    });
    expect(container).toBeTruthy();

    // Clear previous calls to focus on the rerender calls
    vi.clearAllMocks();

    await rerender({ points: updatedPoints });

    await waitFor(() => {
      expect(mockLayerGroup.clearLayers).toHaveBeenCalled();
    });
  });

  it('creates ResizeObserver on mount', () => {
    render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    expect(mockResizeObserver).toHaveBeenCalled();
  });

  it('exposes component methods through template ref', async () => {
    // Test that the component can be used with template refs
    // by checking that the map initialization happens correctly
    render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    // Verify that the Leaflet map was created (which means the component is properly initialized)
    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalled();
    });

    // Verify that the component creates the necessary Leaflet instances
    const L = await import('leaflet');
    expect(L.default.map).toHaveBeenCalled();
    expect(L.default.tileLayer).toHaveBeenCalled();
  });

  it('calls invalidateSize when map needs to be resized', async () => {
    render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    // Wait for the map to be initialized and invalidateSize to be called
    await waitFor(() => {
      expect(mockMap.invalidateSize).toHaveBeenCalled();
    });
  });

  it('cleans up resources on unmount', async () => {
    const { unmount } = render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    const resizeObserverInstance = (mockResizeObserver as any).mock.results[0]?.value;

    unmount();

    if (resizeObserverInstance) {
      expect(resizeObserverInstance.unobserve).toHaveBeenCalled();
    }
    expect(mockLayerGroup.clearLayers).toHaveBeenCalled();
    expect(mockMap.off).toHaveBeenCalled();
    expect(mockMap.remove).toHaveBeenCalled();
  });

  it('handles custom getPopupProps function', () => {
    const mockGetPopupProps = vi.fn((point) => ({ customProp: point.lat }));

    const { container } = render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
        popupComponent: DummyPopup,
        getPopupProps: mockGetPopupProps,
      },
    });

    expect(container).toBeTruthy();
  });

  it('uses custom zoom when provided', async () => {
    render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
        zoom: 12,
      },
    });

    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalledWith([48.8584, 2.2945], 12);
    });
  });

  it('uses default zoom when not provided', async () => {
    render(Map, {
      props: {
        points: [{ lat: 48.8584, lng: 2.2945 }],
      },
    });

    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalledWith([48.8584, 2.2945], 15);
    });
  });
});
