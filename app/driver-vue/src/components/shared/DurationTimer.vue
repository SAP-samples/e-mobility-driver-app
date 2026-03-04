<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  start: Date | string;
}>();

const secondsElapsed = ref(0);

let interval: number | undefined;

const getDuration = () => {
  const startTime = typeof props.start === 'string' ? new Date(props.start) : props.start;
  return Math.floor((Date.now() - startTime.getTime()) / 1000);
};

const formatted = computed(() => {
  const totalSeconds = secondsElapsed.value;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
});

onMounted(() => {
  secondsElapsed.value = getDuration();
  interval = setInterval(() => {
    secondsElapsed.value = getDuration();
  }, 1000) as unknown as number;
});
onUnmounted(() => {
  if (interval !== undefined) clearInterval(interval);
});
</script>

<template>
  <ui5-label>{{ formatted }}</ui5-label>
</template>
