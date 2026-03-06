<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-button
    :design="geoLoading ? 'Emphasized' : 'Transparent'"
    :icon="geoLoading ? 'synchronize' : 'locate-me'"
    @click="requestLocation"
    :disabled="geoLoading"
    :title="geoLoading ? $t('filter.locating') : $t('filter.near_me')"
  />
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents-icons/dist/locate-me.js';
import '@ui5/webcomponents-icons/dist/synchronize.js';

interface Props {
  geoLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  geoLoading: false,
});

const emit = defineEmits<{
  locationRequested: [];
}>();

function requestLocation() {
  if (props.geoLoading) {
    return;
  }
  emit('locationRequested');
}
</script>
