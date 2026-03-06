// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia';
import { ref } from 'vue';

const MOBILE_BREAKPOINT = 900;

function getIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export const useUiStore = defineStore('ui', () => {
  const isMobile = ref(getIsMobile());
  const sidebarOpen = ref(!isMobile.value);

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function setSidebar(open: boolean) {
    sidebarOpen.value = open;
  }

  function updateIsMobile() {
    isMobile.value = getIsMobile();
    sidebarOpen.value = !isMobile.value;
  }

  return {
    isMobile,
    sidebarOpen,
    toggleSidebar,
    setSidebar,
    updateIsMobile,
  };
});
