<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div v-show="userStore.isAuthenticated">
    <ui5-navigation-layout
      ref="navigationLayout"
      :mode="sidebarOpen ? NavigationLayoutMode.Expanded : NavigationLayoutMode.Collapsed"
      class="layout"
    >
      <ui5-shellbar id="shellbar" slot="header" class="header">
        <ui5-button
          id="startButton"
          slot="startButton"
          icon="menu"
          @click="toggleSideNavigation"
          v-if="!isMobile"
        ></ui5-button>
        <ui5-avatar slot="profile" icon="employee"></ui5-avatar>
        <ui5-shellbar-branding @click="navigate('Home')" slot="branding">
          <img slot="logo" src="/sap-logo.svg" alt="logo" />
        </ui5-shellbar-branding>
        <ui5-title slot="content">{{ $t('company.name') }}</ui5-title>
        <ui5-shellbar-item
          id="refreshButton"
          icon="refresh"
          :text="$t('navigation.refresh')"
          @click="refreshPage"
        ></ui5-shellbar-item>
      </ui5-shellbar>
      <ui5-user-menu id="userMenu" @sign-out-click="userStore.logout">
        <div class="user-menu-language-switcher">
          <ui5-label for="userMenu-LanguageSwitcher" showColon="true">{{
            $t('settings.language')
          }}</ui5-label>
          <LanguageSwitcher id="userMenu-LanguageSwitcher" />
        </div>
        <ui5-user-menu-account
          slot="accounts"
          :title-text="userAccount.fullName"
          :subtitle-text="userAccount.email"
        ></ui5-user-menu-account>
      </ui5-user-menu>

      <ui5-side-navigation
        slot="sideContent"
        v-if="!isMobile"
        :key="isMobile ? 'mobile' : 'desktop'"
      >
        <ui5-side-navigation-item
          icon="home"
          :text="$t('navigation.home')"
          @click="navigate('Home')"
          :selected="activeTabIndex === 0"
        />
        <ui5-side-navigation-item
          icon="business-suite/manage-charging-stations"
          :text="$t('navigation.stations')"
          @click="navigate('Stations')"
          :selected="activeTabIndex === 1"
        />
        <ui5-side-navigation-item
          icon="list"
          :text="$t('navigation.sessions')"
          @click="navigate('Sessions')"
          :selected="activeTabIndex === 2"
        />
        <ui5-side-navigation-item
          icon="business-card"
          :text="$t('navigation.badges')"
          @click="navigate('Badges')"
          :selected="activeTabIndex === 3"
        />
      </ui5-side-navigation>
      <div class="content">
        <router-view :key="$route.path" />
        <ui5-tabcontainer
          v-ui5-custom-tab-container="{
            distribution: 'flex',
            labelPlacement: 'right', // puts the label below the icon
            hideOverflow: true, // disables the 'More' button
          }"
          class="footer-tabs"
          v-if="isMobile"
          collapsed
          @tab-select="navigateFromTab"
          tab-layout="Inline"
          data-ui5-compact-sizev-ui5-custom-tab-container="{
          distribution: 'flex',
          labelPlacement: 'right',
          hideOverflow: true, 
        }"
        >
          <ui5-tab
            id="tab-home"
            icon="home"
            :text="$t('navigation.home')"
            :selected="activeTabIndex === 0"
          />
          <ui5-tab
            id="tab-stations"
            icon="business-suite/manage-charging-stations"
            :text="$t('navigation.stations')"
            :selected="activeTabIndex === 1"
          />
          <ui5-tab
            id="tab-sessions"
            icon="list"
            :text="$t('navigation.sessions')"
            :selected="activeTabIndex === 2"
          />
          <ui5-tab
            id="tab-badges"
            icon="business-card"
            :text="$t('navigation.badges')"
            :selected="activeTabIndex === 3"
          />
        </ui5-tabcontainer>
      </div>
    </ui5-navigation-layout>
  </div>
  <div v-show="!userStore.isAuthenticated">
    <LoginPage />
  </div>
</template>

<script setup lang="ts">
import '@ui5/webcomponents/dist/Avatar.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/TabContainer.js';
import '@ui5/webcomponents/dist/Tab.js';

import '@ui5/webcomponents-base/dist/features/F6Navigation.js';
import '@ui5/webcomponents-fiori/dist/SideNavigation.js';
import '@ui5/webcomponents-fiori/dist/SideNavigationItem.js';
import '@ui5/webcomponents-fiori/dist/ShellBar.js';
import '@ui5/webcomponents-fiori/dist/ShellBarBranding.js';
import '@ui5/webcomponents-fiori/dist/ShellBarItem.js';

import '@ui5/webcomponents-fiori/dist/UserMenu.js';
import '@ui5/webcomponents-fiori/dist/UserMenuAccount.js';
import '@ui5/webcomponents-fiori/dist/UserMenuItem.js';

import '@ui5/webcomponents-icons/dist/home.js';
import '@ui5/webcomponents-icons/dist/business-card.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/list.js';
import '@ui5/webcomponents-icons/dist/globe.js';
import '@ui5/webcomponents-icons/dist/menu.js';
import '@ui5/webcomponents-icons-business-suite/dist/manage-charging-stations.js';

import '@ui5/webcomponents-fiori/dist/NavigationLayout.js';
import NavigationLayoutMode from '@ui5/webcomponents-fiori/dist/types/NavigationLayoutMode.js';
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue';
import LoginPage from '@/pages/LoginPage.vue';
import { useUiStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore.ts';

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

defineProps<{ user: User }>();

const uiStore = useUiStore();
const userStore = useUserStore();
const router = useRouter();

const userAccount = computed(() => ({
  fullName: `${userStore.firstName} ${userStore.lastName}`,
  email: userStore.email,
}));

// Responsive sidebar state using Pinia store
const isMobile = computed(() => uiStore.isMobile);
const sidebarOpen = computed(() => uiStore.sidebarOpen);

function handleResize() {
  uiStore.updateIsMobile();
  if (uiStore.isMobile) {
    uiStore.setSidebar(false);
  } else {
    uiStore.setSidebar(true);
  }
}

function toggleSideNavigation(): void {
  uiStore.toggleSidebar();
}

function navigate(page: string): void {
  router.push({ name: page });
}

function refreshPage(): void {
  window.location.reload();
}

const tabRoutes = ['Home', 'Stations', 'Sessions', 'Badges'];
const activeTabIndex = computed(() => {
  const routeName = router.currentRoute.value.name as string;
  if (routeName === 'evse-detail') {
    return tabRoutes.indexOf('Stations');
  }
  const idx = tabRoutes.indexOf(routeName);
  return idx === -1 ? 0 : idx;
});

interface TabSelectEvent extends CustomEvent {
  detail: {
    tabIndex: number;
  };
}

function navigateFromTab(event: TabSelectEvent): void {
  const page = tabRoutes[event.detail.tabIndex] || 'Home';
  router.push({ name: page });
}

onMounted(() => {
  window.addEventListener('resize', handleResize);

  const shellbar = document.getElementById('shellbar') as HTMLElement | null;
  const menu = document.getElementById('userMenu') as { opener?: unknown; open?: boolean } | null;

  shellbar?.addEventListener('ui5-profile-click', (event: Event) => {
    const customEvent = event as CustomEvent<{ targetRef: unknown }>;
    if (menu && customEvent?.detail?.targetRef) {
      menu.opener = customEvent.detail.targetRef;
      menu.open = true;
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.content {
  display: flex;
  flex-wrap: wrap;
  padding: 0.5rem 0.5rem 5rem;
  gap: 1rem;
}

ui5-shellbar::part(root) {
  background-color: var(--sapShell_Background);
}

.layout {
  width: 100%;
}

.footer-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  padding: 0 !important;
}
.header {
  padding: 0 !important;
}

.user-menu-language-switcher {
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--sapList_BorderColor);
}

.user-menu-language-switcher ui5-select {
  width: 100%;
}
</style>
