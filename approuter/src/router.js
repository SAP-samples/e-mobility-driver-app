// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import approuter from '@sap/approuter';

console.log('🚗 Starting Driver App Approuter...');
console.log('📍 Custom router entry point loaded');

// Future customization point:
// - Add custom middleware here
// - Add logging, metrics, health checks
// - Modify request/response handling

const ar = approuter();
ar.start();

console.log('✅ Driver App Approuter started successfully');
