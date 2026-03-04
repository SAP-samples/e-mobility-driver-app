// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EvsePresets } from '@/store/evse/presets';

describe('EvsePresets', () => {
  describe('Available EVSEs', () => {
    it('should return a query with availableOnly filter', () => {
      const query = EvsePresets.available();

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.getOrderBy()).toBe('name asc');
      expect(query.filters).toHaveLength(2); // connected + availableOnly
    });

    it('should create a new instance each time', () => {
      const query1 = EvsePresets.available();
      const query2 = EvsePresets.available();

      expect(query1).not.toBe(query2);
      expect(query1.filters).toEqual(query2.filters);
    });
  });

  describe('Fast charging EVSEs', () => {
    it('should return a query with both available and fast charging filters', () => {
      const query = EvsePresets.fastCharging();

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.filters).toContain(
        "connectors/any(c:c/currentType eq 'DC' and c/maximumPower ge 50)",
      );
      expect(query.getOrderBy()).toBe('name asc');
      expect(query.filters).toHaveLength(2); // availableOnly + fastCharging
    });

    it('should create a new instance each time', () => {
      const query1 = EvsePresets.fastCharging();
      const query2 = EvsePresets.fastCharging();

      expect(query1).not.toBe(query2);
      expect(query1.filters).toEqual(query2.filters);
    });
  });

  describe('City-based queries', () => {
    it('should return a query with city filter', () => {
      const city = 'Paris';
      const query = EvsePresets.inCity(city);

      expect(query.filters).toContain(`location/address/city eq '${city}'`);
      expect(query.getOrderBy()).toBe('name asc');
      expect(query.filters).toHaveLength(1);
    });

    it('should handle cities with special characters', () => {
      const city = "Saint-Jean-d'Angély";
      const query = EvsePresets.inCity(city);

      expect(query.filters).toContain(`location/address/city eq 'Saint-Jean-d''Angély'`);
    });

    it('should handle empty city name', () => {
      const city = '';
      const query = EvsePresets.inCity(city);

      expect(query.filters).toContain(`location/address/city eq ''`);
    });
  });

  describe('Combined city and availability queries', () => {
    it('should return a query with both available and city filters', () => {
      const city = 'Lyon';
      const query = EvsePresets.availableInCity(city);

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.filters).toContain(`location/address/city eq '${city}'`);
      expect(query.getOrderBy()).toBe('name asc');
      expect(query.filters).toHaveLength(3); // connected + availableOnly + city
    });

    describe('should create independent instances', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-10-27T08:24:43.770Z'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should create independent instances', () => {
        const city = 'Marseille';
        const query1 = EvsePresets.availableInCity(city);
        const query2 = EvsePresets.availableInCity(city);

        expect(query1).not.toBe(query2);
        expect(query1.filters).toEqual(query2.filters);
      });
    });
  });

  describe('Fast charging in city queries', () => {
    it('should return a query with available, fast charging, and city filters', () => {
      const city = 'Toulouse';
      const query = EvsePresets.fastChargingInCity(city);

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.filters).toContain(
        "connectors/any(c:c/currentType eq 'DC' and c/maximumPower ge 50)",
      );
      expect(query.filters).toContain(`location/address/city eq '${city}'`);
      expect(query.getOrderBy()).toBe('name asc');
      expect(query.filters).toHaveLength(3);
    });
  });

  describe('Location-based queries', () => {
    it('should return a query with available filter and location', () => {
      const lat = 48.8566;
      const lon = 2.3522;
      const radiusKm = 5;

      const query = EvsePresets.nearLocation(lat, lon, radiusKm);

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.getLocation()).toEqual({
        lat,
        lon,
        radius: radiusKm * 1000, // Should convert km to meters
      });
      expect(query.getOrderBy()).toBe('name asc');
    });

    it('should convert radius from kilometers to meters', () => {
      const lat = 45.764;
      const lon = 4.8357;
      const radiusKm = 10;

      const query = EvsePresets.nearLocation(lat, lon, radiusKm);
      const location = query.getLocation();

      expect(location?.radius).toBe(10000); // 10km = 10000m
    });

    it('should handle decimal radius values', () => {
      const lat = 43.2965;
      const lon = 5.3698;
      const radiusKm = 2.5;

      const query = EvsePresets.nearLocation(lat, lon, radiusKm);
      const location = query.getLocation();

      expect(location?.radius).toBe(2500); // 2.5km = 2500m
    });
  });

  describe('Default sorting', () => {
    it('should create default sorted query', () => {
      const query = EvsePresets.defaultSorted();

      expect(query.filters).toEqual([]);
      expect(query.getOrderBy()).toBe('name asc');
    });
  });

  describe('Inherited presets', () => {
    it('should create search query', () => {
      const presets = new EvsePresets();
      const query = presets.search('station');

      expect(query.buildSearchFilter()).toContain("contains(tolower(name),'station')");
    });

    it('should create paginated query', () => {
      const presets = new EvsePresets();
      const query = presets.paginated(3, 20);

      expect(query.getPage()).toBe(3);
      expect(query.getPageSize()).toBe(20);
    });

    it('should create near location query from base presets', () => {
      const presets = new EvsePresets();
      const query = presets.nearLocation(52.52, 13.405, 10);

      const location = query.getLocation();
      expect(location).toEqual({
        lat: 52.52,
        lon: 13.405,
        radius: 10000, // 10km converted to meters
      });
    });
  });

  describe('Method chaining and independence', () => {
    it('should allow method chaining on presets', () => {
      const query = EvsePresets.available().search('fast').page(1, 25);

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.buildSearchFilter()).toContain("contains(tolower(name),'fast')");
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(25);
    });

    it('should maintain query state independently', () => {
      const query1 = EvsePresets.available();
      const query2 = EvsePresets.fastCharging();

      query1.search('tesla');
      query2.search('ionity');

      expect(query1.buildSearchFilter()).toContain('tesla');
      expect(query2.buildSearchFilter()).toContain('ionity');
      expect(query1.filters).toHaveLength(2); // connected + availableOnly filters
      expect(query2.filters).toHaveLength(2); // availableOnly + fast charging filters
    });
  });

  describe('Type safety and validation', () => {
    it('should return EvseQuery instances', () => {
      const availableQuery = EvsePresets.available();
      const fastChargingQuery = EvsePresets.fastCharging();
      const defaultQuery = EvsePresets.defaultSorted();

      expect(availableQuery.constructor.name).toBe('EvseQuery');
      expect(fastChargingQuery.constructor.name).toBe('EvseQuery');
      expect(defaultQuery.constructor.name).toBe('EvseQuery');
    });

    it('should handle numeric coordinates correctly', () => {
      const query = EvsePresets.nearLocation(0, 0, 1);
      const location = query.getLocation();

      expect(location?.lat).toBe(0);
      expect(location?.lon).toBe(0);
      expect(location?.radius).toBe(1000);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long city names', () => {
      const longCityName = 'a'.repeat(100);
      const query = EvsePresets.inCity(longCityName);

      expect(query.filters).toContain(`location/address/city eq '${longCityName}'`);
    });

    it('should handle negative coordinates', () => {
      const query = EvsePresets.nearLocation(-45.5, -73.6, 5);
      const location = query.getLocation();

      expect(location?.lat).toBe(-45.5);
      expect(location?.lon).toBe(-73.6);
      expect(location?.radius).toBe(5000);
    });

    it('should handle very small radius values', () => {
      const query = EvsePresets.nearLocation(48.8566, 2.3522, 0.1);
      const location = query.getLocation();

      expect(location?.radius).toBe(100); // 0.1km = 100m
    });

    it('should handle unicode characters in city names', () => {
      const cityWithUnicode = 'São Paulo';
      const query = EvsePresets.inCity(cityWithUnicode);

      expect(query.filters).toContain(`location/address/city eq '${cityWithUnicode}'`);
    });
  });
});
