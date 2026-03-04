// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BasePresets } from '../../utils/odata';

import { EvseQuery } from './query-builder';

export class EvsePresets extends BasePresets<EvseQuery> {
  protected createQuery(): EvseQuery {
    return new EvseQuery();
  }

  // EVSE-specific presets
  static available(): EvseQuery {
    return new EvseQuery().connected().availableOnly().orderByName();
  }

  static fastCharging(): EvseQuery {
    return new EvseQuery().availableOnly().fastChargingOnly().orderByName();
  }

  static inCity(city: string): EvseQuery {
    return new EvseQuery().inCity(city).orderByName();
  }

  static availableInCity(city: string): EvseQuery {
    return this.available().inCity(city);
  }

  static fastChargingInCity(city: string): EvseQuery {
    return this.fastCharging().inCity(city);
  }

  static nearLocation(lat: number, lon: number, radiusKm: number): EvseQuery {
    return this.available().nearLocation(lat, lon, radiusKm * 1000);
  }

  static defaultSorted(): EvseQuery {
    return new EvseQuery().orderByName();
  }
}
