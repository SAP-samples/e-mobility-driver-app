// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { CdsSelectQuery } from 'types/cds-query';

import cds from '@sap/cds';

/**
 * Patch a CDS query object to add a badgeAuthenticationId filter.
 */
export function addBadgeFilterToQuery(
  query: CdsSelectQuery,
  badgeAuthIds: string[],
): CdsSelectQuery {
  const patchedQuery: CdsSelectQuery = { ...query };
  if (patchedQuery.SELECT && Array.isArray(badgeAuthIds) && badgeAuthIds.length > 0) {
    patchedQuery.SELECT = { ...patchedQuery.SELECT };
    const badgeFilter = cds.parse.xpr(`badgeAuthenticationId in ('${badgeAuthIds.join("', '")}')`);
    if (Array.isArray(patchedQuery.SELECT.where) && patchedQuery.SELECT.where.length > 0) {
      [{ xpr: badgeFilter }, 'and', { xpr: patchedQuery.SELECT.where }];
      patchedQuery.SELECT.where = ['and', ...patchedQuery.SELECT.where, badgeFilter];
    } else {
      patchedQuery.SELECT.where = badgeFilter;
    }
  }
  return patchedQuery;
}
