// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds, { Request } from '@sap/cds';

export function getEmailFromRequest(req: Request): string {
  return cds.context?.user?.attr.email ?? cds.context?.user?.id ?? req.user?.attr?.email;
}

export function getUserNameFromRequest(req: Request): string {
  return (
    cds.context?.user?.attr.lastname ??
    req.user?.attr?.lastname ??
    (req.user?.attr?.name?.split(' ')[0] || 'Unknown')
  );
}

export function getUserFirstNameFromRequest(req: Request): string {
  return (
    cds.context?.user?.attr.firstname ??
    req.user?.attr?.firstname ??
    (req.user?.attr?.name?.split(' ')[1] || 'Unknown')
  );
}
