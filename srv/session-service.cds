// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

using {ChargingSessionService as external} from './external/ChargingSessionService';

service SessionService @(requires: 'Driver') {
  entity ChargingSessions as
    projection on external.ChargingSessions {
      id,
      sessionId,
      status,
      timestamp,
      siteName,
      siteAreaName,
      badgeAuthenticationId,
      badgeVisualBadgeId,
      cumulatedPrice,
      currency,
      chargingStationName,
      totalDuration,
      totalInactivity,
      totalEnergyDelivered,
      stateOfCharge,
      emi3Id,
      evseCode,
      stop.extraInactivity as extraInactivity,
    };

  entity ChargingSessionMonthlyStats {
    key ID            : Integer;
        totalSessions : Integer;
        totalKwh      : Decimal(18, 3);
        totalAmount   : Decimal(18, 3);
  };

  action stopChargingSession(sessionId : Integer);
  action startChargingSession(evseId : String(36));
}
