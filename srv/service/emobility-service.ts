// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { Service } from '@sap/cds';

export class EmobilityService extends Service {
  async init() {
    console.log('EmobilityService initialized');

    // Initialize the service
    await super.init();
  }
}
