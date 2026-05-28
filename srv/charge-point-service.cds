// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

using {ChargingStationService as externalChargingStationService} from './external/ChargingStationService';

service ChargePointService @(requires: 'Driver') {

  entity ChargePoints as projection on externalChargingStationService.Evses;

  // ChargingStations is reached via an Association (not a Composition) from Evses, so it is
  // not auto-projected. Projecting it here remaps the ChargePoints.chargingStation navigation
  // target into the same service namespace, allowing $expand=chargingStation to pass the
  // OData afterburner's cross-service validation check (afterburner.js:868).
  entity ChargingStations as projection on externalChargingStationService.ChargingStations;
}
