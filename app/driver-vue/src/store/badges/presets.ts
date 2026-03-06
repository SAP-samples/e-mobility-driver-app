// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BasePresets } from '../../utils/odata';

import { BadgeQuery } from './query-builder';

export class BadgePresets extends BasePresets<BadgeQuery> {
  protected createQuery(): BadgeQuery {
    return new BadgeQuery();
  }

  // Badge-specific presets
  static active(): BadgeQuery {
    return new BadgeQuery().activeOnly().orderByVisualBadgeId();
  }

  static inactive(): BadgeQuery {
    return new BadgeQuery().inactiveOnly().orderByVisualBadgeId();
  }

  static withLicensePlate(): BadgeQuery {
    return new BadgeQuery().withLicensePlate().orderByLicensePlate();
  }

  static activeWithLicensePlate(): BadgeQuery {
    return this.active().withLicensePlate();
  }

  static byUser(firstName?: string, lastName?: string): BadgeQuery {
    const query = new BadgeQuery().activeOnly();

    if (firstName) {
      query.filters.push(`firstName eq '${query['escapeOData'](firstName)}'`);
    }
    if (lastName) {
      query.filters.push(`lastName eq '${query['escapeOData'](lastName)}'`);
    }

    return query.orderByFirstName().orderByLastName();
  }

  static defaultSorted(): BadgeQuery {
    return new BadgeQuery().orderByVisualBadgeId();
  }
}
