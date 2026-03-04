// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds from '@sap/cds';
import compiler from '@sap/cds-compiler';

import { UserBadge } from './badge-validator';

import expr = compiler.parse.expr;

const logger = cds.log('request-filter');

export function buildBadgeFilter(badgeAuthIds: UserBadge[]): cds._xpr {
  if (!Array.isArray(badgeAuthIds)) {
    logger.warn('buildBadgeFilter: badgeAuthIds is not an array:', badgeAuthIds);
    throw new Error('No badge found for the user');
  }
  const filtered = badgeAuthIds
    .map((badge) => badge.authenticationId)
    .filter((id) => !!id && id.trim() !== '');
  if (filtered.length === 0) {
    logger.warn('buildBadgeFilter: badgeAuthIds is empty after filtering:', badgeAuthIds);
    throw new Error('No badge found for the user');
  }
  if (filtered.length === 1) {
    return cds.parse.xpr(`badgeAuthenticationId = '${filtered[0]}'`);
  }
  return cds.parse.xpr(`badgeAuthenticationId in ('${filtered.join("', '")}')`);
}

export function addFilterToQuery(request: cds.Request, filter: cds._xpr | undefined): void {
  if (filter) {
    const existingWhereClause =
      request.query.SELECT?.where &&
      request.query.SELECT?.where.length === 1 &&
      (request.query.SELECT?.where[0] as unknown as cds.xpr).xpr
        ? (request.query.SELECT?.where[0] as unknown as cds.xpr).xpr
        : request.query.SELECT?.where;
    logger.debug(`Existing where clause: ${JSON.stringify(existingWhereClause)}`);
    // @ts-expect-error: cds.Request typing does not allow direct assignment to SELECT.where, but this is required for dynamic filter injection
    request.query.SELECT.where = request.query.SELECT?.where
      ? [{ xpr: filter }, 'and', { xpr: existingWhereClause }]
      : filter;

    logger.debug(`Overridden where clause: ${JSON.stringify(request.query.SELECT?.where)}`);
  }
}
