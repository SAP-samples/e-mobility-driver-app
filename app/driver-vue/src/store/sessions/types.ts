// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

export interface Session {
  id: number;
  sessionId: string;
  timestamp: string;
  siteName: string;
  siteAreaName: string;
  badgeAuthenticationId: string;
  badgeVisualBadgeId: string;
  cumulatedPrice: number;
  currency: string;
  status: string;
  chargingStationName: string;
  totalDuration: number;
  totalInactivity: number;
  totalEnergyDelivered: number;
  stateOfCharge: number;
  emi3Id: string;
  evseCode: string;
  stop_extraInactivity: number;
}

export interface MonthlyStats {
  totalSessions: number;
  totalKwh: number;
  totalAmount: number;
}

export interface StartSessionRequest {
  evseId: string;
}

export interface StopSessionRequest {
  sessionId: number;
}

export type SessionTimeFilter = 'month' | 'year' | 'all';

export interface SessionFilterState {
  timeFilter: SessionTimeFilter;
}
