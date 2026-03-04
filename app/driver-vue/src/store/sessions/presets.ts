// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BasePresets } from '../../utils/odata';

import { SessionQuery } from './query-builder';

export class SessionPresets extends BasePresets<SessionQuery> {
  protected createQuery(): SessionQuery {
    return new SessionQuery();
  }

  // Session-specific presets
  static inProgress(): SessionQuery {
    return new SessionQuery().inProgress().orderByTimestamp();
  }

  static completed(): SessionQuery {
    return new SessionQuery().completed().orderByTimestamp();
  }

  static recentHistory(days = 30): SessionQuery {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    return new SessionQuery().completed().since(sinceDate.toISOString()).orderByTimestamp();
  }

  static byBadge(badgeId: string): SessionQuery {
    return new SessionQuery().byBadgeId(badgeId).orderByTimestamp();
  }

  static bySite(siteName: string): SessionQuery {
    return new SessionQuery().bySite(siteName).orderByTimestamp();
  }

  static byChargingStation(stationName: string): SessionQuery {
    return new SessionQuery().byChargingStation(stationName).orderByTimestamp();
  }

  static highEnergy(minKwh = 50): SessionQuery {
    return new SessionQuery().completed().minEnergy(minKwh).orderByEnergy();
  }

  static longDuration(minMinutes = 180): SessionQuery {
    return new SessionQuery().completed().minDuration(minMinutes).orderByDuration();
  }

  static expensive(minAmount = 100): SessionQuery {
    return new SessionQuery().completed().minPrice(minAmount).orderByPrice();
  }

  static thisMonth(): SessionQuery {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return new SessionQuery().completed().since(startOfMonth.toISOString()).orderByTimestamp();
  }

  static thisYear(): SessionQuery {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return new SessionQuery().completed().since(startOfYear.toISOString()).orderByTimestamp();
  }

  static thisWeek(): SessionQuery {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return new SessionQuery().completed().since(startOfWeek.toISOString()).orderByTimestamp();
  }

  static lastSessions(count: number = 100): SessionQuery {
    return new SessionQuery().completed().orderByTimestamp('desc').page(1, count);
  }

  static defaultSorted(): SessionQuery {
    return new SessionQuery().orderByTimestamp();
  }
}
