// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

export interface Badge {
  authenticationId: string;
  visualBadgeId: string;
  description: string | null;
  firstName: string | null;
  lastName: string | null;
  licensePlate: string | null;
  active: boolean;
}
