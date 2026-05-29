// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';

import cds from '@sap/cds';

/**
 * Regression guard for the OData afterburner cross-service navigation check.
 *
 * Background:
 *   In the compiled CSN, an Association whose target lives in a different service is
 *   rejected by `afterburner.js` (the cross-service `element._target._service !==
 *   target._service` check) when used in `$expand` / `$filter`. Compositions are
 *   auto-projected into the consuming service, so they pass — Associations are not.
 *
 *   `ChargePointService.ChargePoints.chargingStation` points to
 *   `ChargingStationService.ChargingStations` via Association. Without an explicit
 *   projection of `ChargingStations` into `ChargePointService`, the navigation target
 *   stays in the external service namespace and `$expand=chargingStation` returns
 *   400 "Navigation property 'chargingStation' does not exist in 'ChargePoints'" in
 *   production.
 *
 *   In local dev (raw CDS), the cross-service `_service` markers are not fully set,
 *   so the check passes silently — which is why this regressed unnoticed until
 *   deployment.
 */
describe('ChargePointService CDS model', () => {
  let model: cds.csn.CSN;

  beforeAll(async () => {
    const cdsFile = path.resolve(__dirname, '../srv/charge-point-service.cds');
    model = await cds.load([cdsFile]);
  });

  it('exposes ChargingStations as a same-service projection', () => {
    expect(model.definitions?.['ChargePointService.ChargingStations']).toBeDefined();
  });

  it('remaps ChargePoints.chargingStation navigation target into ChargePointService', () => {
    const chargePoints = model.definitions?.['ChargePointService.ChargePoints'];
    const chargingStationNav = (chargePoints as cds.csn.entity)?.elements
      ?.chargingStation as cds.csn.Association;

    expect(chargingStationNav).toBeDefined();
    // Must point to the in-service projection, not the external ChargingStationService entity,
    // otherwise the OData afterburner rejects $expand=chargingStation with a 400 in production.
    expect(chargingStationNav.target).toBe('ChargePointService.ChargingStations');
  });
});
