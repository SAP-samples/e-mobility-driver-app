// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

// This file exports the router injection key for Vue Router 4, for use in tests.
// If vue-router exports routerKey, use that. Otherwise, define it here.

import * as vueRouter from 'vue-router';

// Use the same symbol as vue-router, or fallback
const routerKey: symbol =
  'routerKey' in vueRouter && typeof (vueRouter as Record<string, unknown>).routerKey === 'symbol'
    ? (vueRouter as { routerKey: symbol }).routerKey
    : Symbol('router');

export { routerKey };
