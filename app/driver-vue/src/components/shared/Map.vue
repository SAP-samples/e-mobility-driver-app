<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div ref="mapContainer" class="leaflet-map"></div>
</template>

<script lang="ts" setup>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { type Component, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPoint {
  lat: number;
  lng: number;
  [key: string]: unknown;
}

// Type for markerClusterGroup
interface MarkerClusterGroupFactory {
  markerClusterGroup: () => L.LayerGroup;
}

const props = withDefaults(
  defineProps<{
    points: MapPoint[];
    center?: [number, number];
    zoom?: number;
    cluster?: boolean;
    autoFit?: boolean;
    popupComponent?: Component;
    getPopupProps?: (point: MapPoint) => Record<string, unknown>;
  }>(),
  {
    zoom: 15,
    cluster: false,
    autoFit: true,
  },
);

const emit = defineEmits(['map-ready', 'marker-click', 'marker-mouseover', 'marker-mouseout']);

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;
let resizeObserver: ResizeObserver | undefined;

function invalidateSize() {
  nextTick(() => {
    map?.invalidateSize();
  });
}

function fitMapToMarkers() {
  if (!map || !props.points.length) return;

  if (props.points.length === 1) {
    // Single point - center with reasonable zoom
    const point = props.points[0];
    map.setView([point.lat, point.lng], props.zoom);
  } else {
    // Multiple points - fit bounds
    const bounds = L.latLngBounds(props.points.map((point) => L.latLng(point.lat, point.lng)));
    map.fitBounds(bounds, {
      padding: [10, 10],
      maxZoom: props.zoom,
    });
  }
}

function addMarkers() {
  if (!map) return;

  if (markerLayer) {
    markerLayer.clearLayers();
    map.removeLayer(markerLayer);
  }

  if (props.cluster) {
    markerLayer = (L as typeof L & MarkerClusterGroupFactory).markerClusterGroup();
  } else {
    markerLayer = L.layerGroup();
  }

  props.points.forEach((point) => {
    const marker = L.marker([point.lat, point.lng]);
    marker.on('click', () => emit('marker-click', point));

    // Show popup on mouseover, hide on mouseout
    marker.on('mouseover', function () {
      marker.openPopup();
      emit('marker-mouseover', point);
    });
    marker.on('mouseout', function () {
      marker.closePopup();
      emit('marker-mouseout', point);
    });

    // Popup support
    if (props.popupComponent && typeof globalThis !== 'undefined' && globalThis.document) {
      const popupDiv = globalThis.document.createElement('div');
      import('vue').then(({ createApp }) => {
        const app = createApp(
          props.popupComponent!,
          props.getPopupProps ? props.getPopupProps(point) : point,
        );
        app.mount(popupDiv);
      });
      marker.bindPopup(popupDiv, { className: 'ui5-popup', autoPan: true, closeButton: true });
    }

    if (markerLayer) {
      markerLayer.addLayer(marker);
    }
  });

  if (markerLayer) {
    map.addLayer(markerLayer);
  }

  // Auto-fit after adding markers
  if (props.autoFit) {
    fitMapToMarkers();
  }
}

function initializeMap() {
  if (!mapContainer.value) return;

  // Determine initial center and zoom
  let initialCenter: [number, number];
  let initialZoom: number;

  if (props.points.length > 0) {
    // With points: use first point's location or provided center
    const firstPoint = props.points[0];
    // Validate that the point has valid coordinates
    if (firstPoint?.lat != null && firstPoint?.lng != null) {
      initialCenter = props.center || [firstPoint.lat, firstPoint.lng];
    } else {
      // Fallback to provided center or world view if coordinates are invalid
      initialCenter = props.center || [0, 0];
    }
    // Initial zoom will be overridden by fitMapToMarkers() if autoFit is true
    initialZoom = props.zoom;
  } else {
    // No points: use provided center or world view [0, 0]
    initialCenter = props.center || [0, 0];
    initialZoom = props.zoom;
  }

  map = L.map(mapContainer.value, { zoomControl: true }).setView(initialCenter, initialZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // Add markers and auto-fit if enabled (which will override initialZoom for points)
  addMarkers();
  emit('map-ready', map);
  invalidateSize();
}

defineExpose({
  invalidateSize,
  map,
  fitMapToMarkers,
});

onMounted(() => {
  // Use ResizeObserver to handle container size changes
  if (mapContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      invalidateSize();
    });
    resizeObserver.observe(mapContainer.value);
  }
  initializeMap();
});

watch(
  () => props.points,
  () => {
    if (!map) {
      initializeMap();
    } else {
      addMarkers();
      invalidateSize();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  if (resizeObserver && mapContainer.value) {
    resizeObserver.unobserve(mapContainer.value);
    resizeObserver = undefined;
  }
  if (markerLayer) {
    markerLayer.clearLayers();
    markerLayer = null;
  }
  map?.off();
  map?.remove();
  map = null;
});
</script>

<style scoped>
.leaflet-map {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
