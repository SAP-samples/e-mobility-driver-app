// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

using {ChargingStationService as externalChargingStationService} from './external/ChargingStationService';

service ChargePointService @(requires: 'Driver') {

  entity ChargePoints as projection on externalChargingStationService.Evses;
}
