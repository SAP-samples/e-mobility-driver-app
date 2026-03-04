// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { CdsSelectQuery } from 'types/cds-query';
import { CdsRequestWithContext } from 'types/cds-request';
import { ServiceWithUaa } from 'types/xsuaa-service';

import cds, { ApplicationService, Query, Request } from '@sap/cds';

import { requireBadgeAccess } from './utils/badge-validator';
import { addFilterToQuery } from './utils/request-filter';
import { getEmailFromRequest } from './utils/user-utils';

function isCdsSelectQuery(query: unknown): query is CdsSelectQuery {
  return (
    typeof query === 'object' &&
    query !== null &&
    'SELECT' in query &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (query as any).SELECT !== undefined
  );
}

export class BadgeService extends ApplicationService {
  private readonly logger = cds.log('BadgeService');
  private badgeService!: ServiceWithUaa;

  async init() {
    this.badgeService = (await cds.connect.to('RemoteBadgeService')) as unknown as ServiceWithUaa;
    this.on('READ', 'Badges', this.onReadBadges.bind(this));
    await super.init();
  }

  private async onReadBadges(request: CdsRequestWithContext) {
    try {
      if (isCdsSelectQuery(request.query)) {
        /// Ensure user has badge access using centralized system
        await requireBadgeAccess(request as Request);
        const userEmail = getEmailFromRequest(request as Request);
        addFilterToQuery(request as Request, cds.parse.xpr(`email = '${userEmail}'`));

        // Keep requesting badges from the remote service if filtering, sort, or pagination is used
        return await this.badgeService.run(request.query as unknown as Query);
      }
      return [];
    } catch (error) {
      this.logger.error('Error during Badges READ operation:', error);
      request.reply([]);
    }
  }
}
