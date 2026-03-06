// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it } from 'vitest';

import { EvseQuery } from '@/store/evse';

describe('EvseQuery', () => {
  let query: EvseQuery;

  beforeEach(() => {
    query = new EvseQuery();
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(query.filters).toEqual([]);
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(100);
      expect(query.getLocation()).toBeUndefined();
      expect(query.buildSearchFilter()).toBeUndefined();
    });
  });

  describe('Search methods', () => {
    it('should set search text and return this for chaining', () => {
      const result = query.search('test search');

      expect(result).toBe(query); // Should return this for chaining
      expect(query.buildSearchFilter()).toContain("contains(tolower(name),'test search')");
    });

    it('should handle empty search text', () => {
      query.search('');
      expect(query.buildSearchFilter()).toBeUndefined();
    });

    it('should trim search text', () => {
      query.search('  trimmed  ');
      expect(query.buildSearchFilter()).toContain("contains(tolower(name),'trimmed')");
    });

    it('should handle undefined search text', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.search(undefined as any);
      expect(query.buildSearchFilter()).toBeUndefined();
    });

    it('should build correct search filter with all fields', () => {
      query.search('test');
      const filter = query.buildSearchFilter();

      expect(filter).toBe(
        "contains(tolower(name),'test') or contains(tolower(code),'test') or contains(tolower(emi3Id),'test') or contains(tolower(chargingStationName),'test') or contains(tolower(location/siteAreaName),'test') or contains(tolower(location/address/city),'test')",
      );
    });
  });

  describe('Location methods', () => {
    it('should set location and return this for chaining', () => {
      const result = query.nearLocation(52.5, 13.4, 1000);

      expect(result).toBe(query);
      expect(query.getLocation()).toEqual({
        lat: 52.5,
        lon: 13.4,
        radius: 1000,
      });
    });

    it('should handle negative coordinates', () => {
      query.nearLocation(-52.5, -13.4, 500);

      expect(query.getLocation()).toEqual({
        lat: -52.5,
        lon: -13.4,
        radius: 500,
      });
    });
  });

  describe('Availability methods', () => {
    it('should add availability filter and return this for chaining', () => {
      const result = query.availableOnly();

      expect(result).toBe(query);
      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
    });

    it('should only include Available and Preparing connectors', () => {
      query.availableOnly();

      expect(query.filters).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(query.filters).toHaveLength(1);
    });

    it('should exclude inoperative connectors by only including available ones', () => {
      query.availableOnly();
      const filter = query.buildFilter();

      // The filter should only match EVSEs with Available or Preparing connectors
      // This implicitly excludes Faulted, Unavailable, Charging, etc.
      expect(filter).toBe("connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')");
    });
  });

  describe('Fast charging methods', () => {
    it('should add fast charging filter and return this for chaining', () => {
      const result = query.fastChargingOnly();

      expect(result).toBe(query);
      expect(query.filters).toContain(
        "connectors/any(c:c/currentType eq 'DC' and c/maximumPower ge 50)",
      );
    });
  });

  describe('Location filters', () => {
    it('should add city filter and return this for chaining', () => {
      const result = query.inCity('Berlin');

      expect(result).toBe(query);
      expect(query.filters).toContain("location/address/city eq 'Berlin'");
    });

    it('should escape single quotes in city name', () => {
      query.inCity("O'Connor");

      expect(query.filters).toContain("location/address/city eq 'O''Connor'");
    });

    it('should add site area filter and return this for chaining', () => {
      const result = query.inSiteArea('Downtown');

      expect(result).toBe(query);
      expect(query.filters).toContain("location/siteAreaName eq 'Downtown'");
    });

    it('should escape single quotes in site area name', () => {
      query.inSiteArea("King's Cross");

      expect(query.filters).toContain("location/siteAreaName eq 'King''s Cross'");
    });
  });

  describe('Pagination', () => {
    it('should set page and size and return this for chaining', () => {
      const result = query.page(3, 50);

      expect(result).toBe(query);
      expect(query.getPage()).toBe(3);
      expect(query.getPageSize()).toBe(50);
    });

    it('should use default page size when not provided', () => {
      query.page(2);

      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(100);
    });

    it('should enforce minimum page number of 1', () => {
      query.page(0);
      expect(query.getPage()).toBe(1);

      query.page(-5);
      expect(query.getPage()).toBe(1);
    });

    it('should enforce minimum page size of 1', () => {
      query.page(1, 0);
      expect(query.getPageSize()).toBe(1);

      query.page(1, -10);
      expect(query.getPageSize()).toBe(1);
    });
  });

  describe('Filter building', () => {
    it('should return undefined when no filters are set', () => {
      expect(query.buildFilter()).toBeUndefined();
    });

    it('should build filter with single condition', () => {
      query.availableOnly();

      const filter = query.buildFilter();
      expect(filter).toBe("connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')");
    });

    it('should build filter with multiple conditions joined by AND', () => {
      query.availableOnly().fastChargingOnly();

      const filter = query.buildFilter();
      expect(filter).toContain(' and ');
      expect(filter).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(filter).toContain("connectors/any(c:c/currentType eq 'DC' and c/maximumPower ge 50)");
    });

    it('should include search filter in parentheses', () => {
      query.search('test').availableOnly();

      const filter = query.buildFilter();
      expect(filter).toMatch(/\(.*contains\(tolower\(name\),'test'\).*\)/);
    });

    it('should remove duplicate filters', () => {
      query.availableOnly().availableOnly(); // Add same filter twice

      const filter = query.buildFilter();
      // @ts-expect-error: filter may be undefined or not a string, but we expect it to be a string here
      const filterCount = (filter?.match(/connectors\/any\(c:c\/status eq 'Available'/g) || [])
        .length;
      expect(filterCount).toBe(1);
    });
  });

  describe('Method chaining', () => {
    it('should support complex method chaining', () => {
      const result = query
        .search('charging station')
        .nearLocation(52.5, 13.4, 1000)
        .availableOnly()
        .fastChargingOnly()
        .inCity('Berlin')
        .inSiteArea('Downtown')
        .page(2, 50);

      expect(result).toBe(query);
      expect(query.buildSearchFilter()).toBeDefined();
      expect(query.getLocation()).toEqual({ lat: 52.5, lon: 13.4, radius: 1000 });
      expect(query.filters).toHaveLength(4);
      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(50);
    });
  });

  describe('Clear method', () => {
    it('should reset all properties and return this for chaining', () => {
      // Set up some data
      query
        .search('test')
        .nearLocation(52.5, 13.4, 1000)
        .availableOnly()
        .fastChargingOnly()
        .page(3, 50);

      const result = query.clear();

      expect(result).toBe(query);
      expect(query.filters).toEqual([]);
      expect(query.buildSearchFilter()).toBeUndefined();
      expect(query.getLocation()).toBeUndefined();
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(100);
    });
  });

  describe('Clone method', () => {
    it('should create a deep copy of the query', () => {
      const original = query
        .search('test')
        .nearLocation(52.5, 13.4, 1000)
        .availableOnly()
        .page(2, 50);

      const cloned = original.clone();

      // Should be different instances
      expect(cloned).not.toBe(original);
      expect(cloned.filters).not.toBe(original.filters);

      // But have same values
      expect(cloned.filters).toEqual(original.filters);
      expect(cloned.buildSearchFilter()).toBe(original.buildSearchFilter());
      expect(cloned.getLocation()).toEqual(original.getLocation());
      expect(cloned.getPage()).toBe(original.getPage());
      expect(cloned.getPageSize()).toBe(original.getPageSize());
    });

    it('should create independent copies that do not affect each other', () => {
      const original = query.search('original').availableOnly();
      const cloned = original.clone();

      // Modify the clone
      cloned.search('modified').fastChargingOnly();

      // Original should be unchanged
      expect(original.buildSearchFilter()).toContain('original');
      expect(original.filters).toHaveLength(1);

      // Clone should have modifications
      expect(cloned.buildSearchFilter()).toContain('modified');
      expect(cloned.filters).toHaveLength(2);
    });

    it('should handle cloning when location is undefined', () => {
      const cloned = query.clone();
      expect(cloned.getLocation()).toBeUndefined();
    });
  });

  describe('OData escaping', () => {
    it('should escape single quotes in search terms', () => {
      query.search("McDonald's");
      const filter = query.buildSearchFilter();

      expect(filter).toContain("mcdonald''s");
    });

    it('should escape multiple single quotes', () => {
      query.inCity("St. Mary's O'Connor");

      expect(query.filters).toContain("location/address/city eq 'St. Mary''s O''Connor'");
    });
  });

  describe('Sorting methods', () => {
    it('should add name sorting in ascending order by default', () => {
      const result = query.orderByName();

      expect(result).toBe(query);
      expect(query.getOrderBy()).toContain('name asc');
    });

    it('should add name sorting in descending order', () => {
      query.orderByName('desc');

      expect(query.getOrderBy()).toContain('name desc');
    });

    it('should add code sorting in ascending order by default', () => {
      const result = query.orderByCode();

      expect(result).toBe(query);
      expect(query.getOrderBy()).toContain('code asc');
    });

    it('should add code sorting in descending order', () => {
      query.orderByCode('desc');

      expect(query.getOrderBy()).toContain('code desc');
    });

    it('should add charging station name sorting in ascending order by default', () => {
      const result = query.orderByChargingStationName();

      expect(result).toBe(query);
      expect(query.getOrderBy()).toContain('chargingStationName asc');
    });

    it('should add charging station name sorting in descending order', () => {
      query.orderByChargingStationName('desc');

      expect(query.getOrderBy()).toContain('chargingStationName desc');
    });

    it('should add site area name sorting in ascending order by default', () => {
      const result = query.orderBySiteAreaName();

      expect(result).toBe(query);
      expect(query.getOrderBy()).toContain('location/siteAreaName asc');
    });

    it('should add site area name sorting in descending order', () => {
      query.orderBySiteAreaName('desc');

      expect(query.getOrderBy()).toContain('location/siteAreaName desc');
    });

    it('should add site name sorting in ascending order by default', () => {
      const result = query.orderBySiteName();

      expect(result).toBe(query);
      expect(query.getOrderBy()).toContain('location/siteName asc');
    });

    it('should add site name sorting in descending order', () => {
      query.orderBySiteName('desc');

      expect(query.getOrderBy()).toContain('location/siteName desc');
    });

    it('should add city sorting in ascending order by default', () => {
      const result = query.orderByCity();

      expect(result).toBe(query);
      expect(query.getOrderBy()).toContain('location/address/city asc');
    });

    it('should add city sorting in descending order', () => {
      query.orderByCity('desc');

      expect(query.getOrderBy()).toContain('location/address/city desc');
    });

    it('should support multiple sorting criteria', () => {
      query.orderByName().orderByCity('desc');

      const orderBy = query.getOrderBy();
      expect(orderBy).toContain('name asc');
      expect(orderBy).toContain('location/address/city desc');
    });
  });

  describe('buildSearchFilter edge cases', () => {
    it('should handle special characters in search terms', () => {
      query.search('test & special % chars');
      const filter = query.buildSearchFilter();

      expect(filter).toContain('test & special % chars');
    });

    it('should escape single quotes in search terms', () => {
      query.search("O'Connor's Station");
      const filter = query.buildSearchFilter();

      expect(filter).toContain("o''connor''s station");
    });

    it('should return undefined when search is null', () => {
      // Force null search to test the undefined return path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (query as any)._search = null;
      expect(query.buildSearchFilter()).toBeUndefined();
    });

    it('should return undefined when search is empty after trimming', () => {
      query.search('   ');
      expect(query.buildSearchFilter()).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string search gracefully', () => {
      query.search('   '); // Only whitespace
      expect(query.buildSearchFilter()).toBeUndefined();
    });

    it('should handle zero radius location', () => {
      query.nearLocation(0, 0, 0);
      expect(query.getLocation()).toEqual({ lat: 0, lon: 0, radius: 0 });
    });

    it('should handle very large numbers', () => {
      query.nearLocation(90, 180, Number.MAX_SAFE_INTEGER);
      expect(query.getLocation()?.radius).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
