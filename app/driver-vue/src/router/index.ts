// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createRouter, createWebHashHistory } from 'vue-router';

import BadgesPage from '@/pages/BadgesPage.vue';
import EvsePage from '@/pages/EvsePage.vue';
import HomePage from '@/pages/HomePage.vue';
import SessionsPage from '@/pages/SessionsPage.vue';
import StationsPage from '@/pages/StationsPage.vue';
import { useUserStore } from '@/store/userStore.ts';

export async function beforeAuthGuard() {
  const userStore = useUserStore();
  await userStore.fetchUser();
  if (!userStore.isAuthenticated) {
    userStore.login();
    return false;
  }
  return true;
}

export function afterAuthGuard() {
  const userStore = useUserStore();
  if (!userStore.isAuthenticated) {
    userStore.login();
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: {
        name: 'Home',
      },
    },
    {
      path: '/Home',
      name: 'Home',
      component: HomePage,
    },
    {
      path: '/Badges',
      name: 'Badges',
      component: BadgesPage,
    },
    {
      path: '/Stations',
      name: 'Stations',
      component: StationsPage,
    },
    {
      path: '/Sessions',
      name: 'Sessions',
      component: SessionsPage,
    },
    {
      path: '/evse/:id',
      name: 'evse-detail',
      component: EvsePage,
      props: true,
    },
  ],
});
router.beforeEach(beforeAuthGuard);
router.afterEach(afterAuthGuard);

export default router;
