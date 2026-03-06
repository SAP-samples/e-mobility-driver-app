// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseApi } from '../../utils/odata';

import { BadgeQuery } from './query-builder';
import type { Badge } from './types';

export class BadgeApi extends BaseApi<Badge, BadgeQuery> {
  getEntityName(): string {
    return 'Badges';
  }

  getExpandFields(): string[] {
    return []; // Badges don't have complex nested entities to expand
  }
}
