<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <Map
    class="station-map"
    :points="evsePoints"
    :center="mapCenter as [number, number]"
    :cluster="true"
    :zoom="mapZoom"
    @marker-click="onMarkerClick"
    @marker-mouseover="onMarkerMouseOver"
    @marker-mouseout="onMarkerMouseOut"
    ref="reusableMapRef"
    :popupComponent="EvsePopup"
    :getPopupProps="(point) => ({ evse: point.evse })"
  />
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import type { PropType } from 'vue';

import Map from '@/components/shared/Map.vue';
import EvsePopup from '@/components/stations/map/EvsePopup.vue';
import type { Evse } from '@/store/evse';
import { useUiStore } from '@/store/uiStore.ts';

const props = defineProps({
  evses: { type: Array as PropType<Evse[]>, required: true },
  selectedEvse: { type: Object as PropType<Evse | null>, default: null },
});
const emit = defineEmits(['evse-selected', 'evse-hover']);

const uiStore = useUiStore();
const reusableMapRef = ref();

const evsePoints = computed(() =>
  (props.evses || [])
    .filter((evse) => evse.location?.coordinates?.latitude && evse.location?.coordinates?.longitude)
    .map((evse) => ({
      lat: parseFloat(evse.location!.coordinates!.latitude!),
      lng: parseFloat(evse.location!.coordinates!.longitude!),
      evse,
    })),
);

const mapCenter = computed(() => {
  if (evsePoints.value.length > 0) {
    return [evsePoints.value[0].lat, evsePoints.value[0].lng] as [number, number];
  }
  return [0, 0] as [number, number]; // fallback: world view
});

const mapZoom = computed(() => {
  // Use regional zoom if we have points with coordinates, otherwise world view
  return evsePoints.value.length > 0 ? 6 : 2;
});

function onMarkerClick(point: { evse: Evse }) {
  emit('evse-selected', point.evse);
}

function onMarkerMouseOver(point: { evse?: Evse | null }) {
  emit('evse-hover', point?.evse ?? null);
}
function onMarkerMouseOut() {
  emit('evse-hover', null);
}

// Watch for sidebar open/close and resize map
watch(
  () => uiStore.sidebarOpen,
  () => {
    nextTick(() => {
      reusableMapRef.value?.invalidateSize();
      setTimeout(() => reusableMapRef.value?.invalidateSize(), 200);
    });
  },
);

// Watch for selectedEvse and center map
watch(
  () => props.selectedEvse,
  (evse) => {
    if (evse && evse.location?.coordinates && reusableMapRef.value?.map) {
      reusableMapRef.value.map.setView(
        [
          parseFloat(evse.location.coordinates.latitude!),
          parseFloat(evse.location.coordinates.longitude!),
        ],
        15,
        { animate: true },
      );
    }
  },
);
</script>

<style scoped>
.station-map {
  width: 100%;
  min-height: 200px;
  height: 100%;
  z-index: 1;
}
</style>
