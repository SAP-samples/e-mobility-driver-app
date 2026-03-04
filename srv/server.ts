// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { amsCapPluginRuntime } from '@sap/ams';
import cds from '@sap/cds';

import { registerExternalServiceTokenHandler } from './utils/external-service-token-handler';

export const log = cds.log('server');

cds.once('served', () => {
  log.info('Server is running with enhanced badge management');
});

cds.on('served', async () => {
  try {
    // Register centralized external service token handler only after all services are registered
    await registerExternalServiceTokenHandler();
    log.info('External service token handler registered successfully.');
  } catch (error) {
    log.error('Failed to register external service token handler:', error);
  }
});
