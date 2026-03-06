<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-li
    :text="evse?.name || $t('station.evse')"
    :additional-text="ocpiStatusDisplay"
    :additional-text-state="ocpiStatusState"
    :description="evse?.code || $t('station.no_code')"
    icon="slim-arrow-right"
    icon-end
    :class="['evse-item', selected && 'selected']"
    @click.stop="viewDetail"
  >
    {{ evse?.code || '-' }}
  </ui5-li>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useEvseStatusState } from '@/composables/useEvseStatusState.ts';
import type { Evse } from '@/store/evse';

import '@ui5/webcomponents/dist/ListItemStandard.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents-icons/dist/inspect.js';

const props = defineProps({
  evse: { type: Object as PropType<Evse>, required: true },
  selected: { type: Boolean, default: false },
});
const { getEvseStatusState, computeEvseOcpiStatus, getEvseStatusDisplay } = useEvseStatusState();
const router = useRouter();

function viewDetail() {
  if (!props.evse || !props.evse.id) return;
  router.push({ name: 'evse-detail', params: { id: props.evse.id } });
}

const ocpiStatus = computed(() => computeEvseOcpiStatus(props.evse));
const ocpiStatusState = computed(() => getEvseStatusState(ocpiStatus.value, props.evse));
const ocpiStatusDisplay = computed(() => getEvseStatusDisplay(ocpiStatus.value, props.evse));
</script>

<style scoped>
.selected {
  background: #e0f7fa;
}

.evse-item {
  /* UI5 handles layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.evse-detail-btn {
  margin-left: auto;
  min-width: 2rem;
  padding: 0;
}
</style>
