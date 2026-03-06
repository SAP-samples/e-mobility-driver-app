// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseApi } from '../../utils/odata';
import { odataFetch } from '../../utils/odata/odataFetch';

import { SessionQuery } from './query-builder';
import type { MonthlyStats, Session, StartSessionRequest, StopSessionRequest } from './types';

export class SessionApi extends BaseApi<Session, SessionQuery> {
  getEntityName(): string {
    return 'ChargingSessions';
  }

  getExpandFields(): string[] {
    return []; // Sessions don't have complex nested entities to expand
  }

  // Session-specific operations
  async startSession(request: StartSessionRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}startChargingSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }
  }

  async stopSession(request: StopSessionRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}stopChargingSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop session: ${response.statusText}`);
    }
  }

  async fetchMonthlyStats(): Promise<MonthlyStats> {
    const result = await odataFetch({
      baseUrl: this.baseUrl,
      entity: 'ChargingSessionMonthlyStats',
    });

    type StatsResult = { totalSessions?: number; totalKwh?: number; totalAmount?: number };
    const stats: StatsResult =
      Array.isArray(result.value) && result.value.length > 0
        ? (result.value[0] as StatsResult)
        : {};

    return {
      totalSessions: stats.totalSessions ?? 0,
      totalKwh: stats.totalKwh ?? 0,
      totalAmount: stats.totalAmount ?? 0,
    };
  }
}
