<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-tag v-if="ocpiStatus" :design="ocpiStatusState">
    {{ ocpiStatusDisplay }}
  </ui5-tag>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { useEvseStatusState } from '@/composables/useEvseStatusState.ts';
import type { Evse } from '@/store/evse';

const props = defineProps<{ evse: Evse }>();
const { getEvseStatusState, computeEvseOcpiStatus, getEvseStatusDisplay } = useEvseStatusState();

const ocpiStatus = computed(() => computeEvseOcpiStatus(props.evse));
const ocpiStatusState = computed(() => getEvseStatusState(ocpiStatus.value, props.evse));
const ocpiStatusDisplay = computed(() => getEvseStatusDisplay(ocpiStatus.value, props.evse));
</script>
