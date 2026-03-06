// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { NextFunction, Request, Response } from 'express';

import cds from '@sap/cds';

/**
 * Development-only authentication middleware
 * It sets up a user context for each request based on environment variables
 */

type Req = Request & { user: cds.User; tenant: string };

export default function custom_auth(req: Req, _res: Response, next: NextFunction) {
  // Get user configuration from CAP app-specific settings
  const authDevConfig = cds.env['auth-dev'] || {};
  const userEmail = authDevConfig.email || 'dev@example.com';
  const userName = authDevConfig.name || 'Development User';
  const userRoles = authDevConfig.roles
    ? authDevConfig.roles.split(',')
    : ['admin', 'user', 'badgeRead', 'chargePointRead', 'chargingSessionRead'];

  // Set user on each request
  req.user = new cds.User({
    id: 'dev-user',
    roles: userRoles,
    attr: {
      email: userEmail,
      name: userName,
    },
  });

  const log = cds.log('dev-auth');
  log.debug(`Request authenticated with email: ${userEmail}, roles: ${userRoles.join(', ')}`);

  next();
}
