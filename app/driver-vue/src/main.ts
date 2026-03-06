// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import '@/ui5-icons';
import { createPinia } from 'pinia';
import { registerSW } from 'virtual:pwa-register';
import { createApp } from 'vue';
import VueCookies from 'vue-cookies';

import '@/style.css';
import App from '@/App.vue';
import ui5CustomTabContainer from '@/directives/ui5CustomTabContainer';
import i18n from '@/i18n';
import router from '@/router/index';

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(i18n);
app.use(VueCookies, { expires: '1h', secure: true, sameSite: 'Lax' });
app.directive('ui5-custom-tab-container', ui5CustomTabContainer);
app.mount('#app');

registerSW({ immediate: true });
