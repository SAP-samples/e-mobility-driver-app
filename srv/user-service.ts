// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { Service, User } from '@sap/cds';

import {
  getEmailFromRequest,
  getUserFirstNameFromRequest,
  getUserNameFromRequest,
} from './utils/user-utils';

export = (srv: Service) => {
  srv.on('currentUser', (req) => {
    const user = req.user as unknown;

    if (!user) {
      // Fallback if no user context (shouldn't happen with proper auth)
      return {
        firstname: 'Anonymous',
        lastname: 'User',
        email: 'anonymous@example.com',
      };
    }

    return {
      firstname: getUserFirstNameFromRequest(req),
      lastname: getUserNameFromRequest(req),
      email: getEmailFromRequest(req),
    };
  });
};
