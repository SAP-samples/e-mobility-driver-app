// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useEvseStore } from '@/store/evse';

describe('useEvseStore - Sorting', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should have default sorting by name ascending', () => {
    const store = useEvseStore();

    expect(store.sortField).toBe('name');
    expect(store.sortDirection).toBe('asc');
  });

  it('should update sorting when setSorting is called', () => {
    const store = useEvseStore();

    store.setSorting('code', 'desc');

    expect(store.sortField).toBe('code');
    expect(store.sortDirection).toBe('desc');
  });

  it('should create query with current sorting', () => {
    const store = useEvseStore();

    store.setSorting('chargingStationName', 'desc');
    const query = store.createQuery();

    expect(query.getOrderBy()).toBe('chargingStationName desc');
  });

  it('should create query with ascending sorting by default', () => {
    const store = useEvseStore();

    store.setSorting('location/siteAreaName', 'asc');
    const query = store.createQuery();

    expect(query.getOrderBy()).toBe('location/siteAreaName asc');
  });
});
