<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <Map
    :points="
      evse &&
      evse.location?.coordinates &&
      evse.location.coordinates.latitude &&
      evse.location.coordinates.longitude
        ? [
            {
              lat:
                typeof evse.location.coordinates.latitude === 'string'
                  ? parseFloat(evse.location.coordinates.latitude)
                  : evse.location.coordinates.latitude,
              lng:
                typeof evse.location.coordinates.longitude === 'string'
                  ? parseFloat(evse.location.coordinates.longitude)
                  : evse.location.coordinates.longitude,
              ...evse,
            },
          ]
        : []
    "
    :center="
      evse &&
      evse.location?.coordinates &&
      evse.location.coordinates.latitude &&
      evse.location.coordinates.longitude
        ? [
            typeof evse.location.coordinates.latitude === 'string'
              ? parseFloat(evse.location.coordinates.latitude)
              : evse.location.coordinates.latitude,
            typeof evse.location.coordinates.longitude === 'string'
              ? parseFloat(evse.location.coordinates.longitude)
              : evse.location.coordinates.longitude,
          ]
        : [0, 0]
    "
    :zoom="16"
    :cluster="false"
    class="evse-map"
  />
</template>

<script lang="ts" setup>
import Map from '@/components/shared/Map.vue';
import type { Evse } from '@/store/evse';

defineProps<{ evse: Evse | null }>();
</script>

<style scoped>
.evse-map {
  width: 100%;
  height: 100%;
  min-height: 200px;
  z-index: 1;
}
</style>
