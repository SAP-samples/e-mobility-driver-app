// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseQuery } from './BaseQuery';

export abstract class BasePresets<Q extends BaseQuery> {
  protected abstract createQuery(): Q;

  // Common presets
  defaultSorted(): Q {
    return this.createQuery();
  }

  search(text: string): Q {
    return this.createQuery().search(text);
  }

  nearLocation(lat: number, lon: number, radiusKm: number): Q {
    return this.createQuery().nearLocation(lat, lon, radiusKm * 1000);
  }

  paginated(page: number, pageSize = 100): Q {
    return this.createQuery().page(page, pageSize);
  }
}
