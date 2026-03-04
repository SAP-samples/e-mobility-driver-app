// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it } from 'vitest';

import { BadgeQuery } from '@/store/badges';

describe('BadgeQuery', () => {
  let query: BadgeQuery;

  beforeEach(() => {
    query = new BadgeQuery();
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
      const result = query.search('test badge');

      expect(result).toBe(query);
      expect(query.buildSearchFilter()).toContain("contains(tolower(visualBadgeId),'test badge')");
    });

    it('should handle empty search text', () => {
      query.search('');
      expect(query.buildSearchFilter()).toBeUndefined();
    });

    it('should trim search text', () => {
      query.search('  trimmed  ');
      expect(query.buildSearchFilter()).toContain("contains(tolower(visualBadgeId),'trimmed')");
    });

    it('should build correct search filter with all fields', () => {
      query.search('test');
      const filter = query.buildSearchFilter();

      expect(filter).toBe(
        "contains(tolower(visualBadgeId),'test') or contains(tolower(authenticationId),'test') or contains(tolower(description),'test') or contains(tolower(firstName),'test') or contains(tolower(lastName),'test') or contains(tolower(licensePlate),'test')",
      );
    });
  });

  describe('Status filter methods', () => {
    it('should add active filter and return this for chaining', () => {
      const result = query.activeOnly();

      expect(result).toBe(query);
      expect(query.filters).toContain('active eq true');
    });

    it('should add inactive filter and return this for chaining', () => {
      const result = query.inactiveOnly();

      expect(result).toBe(query);
      expect(query.filters).toContain('active eq false');
    });

    it('should add license plate filter and return this for chaining', () => {
      const result = query.withLicensePlate();

      expect(result).toBe(query);
      expect(query.filters).toContain('licensePlate ne null');
    });
  });

  describe('ID filter methods', () => {
    it('should filter by visual badge ID', () => {
      query.byVisualBadgeId('BADGE123');
      expect(query.filters).toContain("visualBadgeId eq 'BADGE123'");
    });

    it('should filter by authentication ID', () => {
      query.byAuthenticationId('AUTH456');
      expect(query.filters).toContain("authenticationId eq 'AUTH456'");
    });

    it('should escape single quotes in ID filters', () => {
      query.byVisualBadgeId("O'Connor");
      expect(query.filters).toContain("visualBadgeId eq 'O''Connor'");
    });
  });

  describe('Sorting methods', () => {
    it('should add order by visual badge ID', () => {
      const query = new BadgeQuery().orderByVisualBadgeId();
      const result = query.getOrderBy();

      expect(result).toBe('visualBadgeId asc');
    });

    it('should add order by description descending', () => {
      query.orderByDescription('desc');
      expect(query.getOrderBy()).toBe('description desc');
    });

    it('should add multiple order clauses', () => {
      const query = new BadgeQuery().orderByFirstName().orderByLastName('desc');
      const result = query.getOrderBy();

      expect(result).toBe('firstName asc, lastName desc');
    });

    it('should support all sorting methods', () => {
      const query = new BadgeQuery()
        .orderByVisualBadgeId()
        .orderByDescription('desc')
        .orderByFirstName()
        .orderByLastName('desc')
        .orderByLicensePlate()
        .orderByActive('desc');
      const result = query.getOrderBy();

      expect(result).toBe(
        'visualBadgeId asc, description desc, firstName asc, lastName desc, licensePlate asc, active desc',
      );
    });
  });

  describe('Pagination methods', () => {
    it('should set page and return this for chaining', () => {
      const result = query.page(2, 50);

      expect(result).toBe(query);
      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(50);
    });

    it('should handle invalid page numbers', () => {
      query.page(-1, 50);
      expect(query.getPage()).toBe(1);

      query.page(0, 50);
      expect(query.getPage()).toBe(1);
    });

    it('should handle invalid page sizes', () => {
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
      query.activeOnly();

      const filter = query.buildFilter();
      expect(filter).toBe('active eq true');
    });

    it('should build filter with multiple conditions joined by AND', () => {
      query.activeOnly().withLicensePlate();

      const filter = query.buildFilter();
      expect(filter).toContain(' and ');
      expect(filter).toContain('active eq true');
      expect(filter).toContain('licensePlate ne null');
    });

    it('should include search filter in parentheses', () => {
      query.search('test').activeOnly();

      const filter = query.buildFilter();
      expect(filter).toMatch(/\(.*contains\(tolower\(visualBadgeId\),'test'\).*\)/);
    });

    it('should remove duplicate filters', () => {
      query.activeOnly().activeOnly(); // Add same filter twice

      const filter = query.buildFilter();
      const filterCount = (filter as string)?.match(/active eq true/g)?.length || 0;
      expect(filterCount).toBe(1);
    });
  });

  describe('Method chaining', () => {
    it('should support complex method chaining', () => {
      const result = query
        .search('john')
        .activeOnly()
        .withLicensePlate()
        .byVisualBadgeId('BADGE123')
        .orderByFirstName()
        .page(2, 25);

      expect(result).toBe(query);
      expect(query.buildSearchFilter()).toBeDefined();
      expect(query.filters).toHaveLength(3);
      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(25);
      expect(query.getOrderBy()).toBe('firstName asc');
    });
  });

  describe('Clear method', () => {
    it('should reset all properties and return this for chaining', () => {
      // Set up some data
      query.search('test').activeOnly().withLicensePlate().page(3, 50).orderByFirstName();

      const result = query.clear();

      expect(result).toBe(query);
      expect(query.filters).toEqual([]);
      expect(query.buildSearchFilter()).toBeUndefined();
      expect(query.getLocation()).toBeUndefined();
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(100);
      expect(query.getOrderBy()).toBeUndefined();
    });
  });

  describe('Clone method', () => {
    it('should create a deep copy of the query', () => {
      const original = query
        .search('test')
        .activeOnly()
        .withLicensePlate()
        .page(2, 50)
        .orderByFirstName();

      const cloned = original.clone();

      // Should be different instances
      expect(cloned).not.toBe(original);
      expect(cloned.filters).not.toBe(original.filters);

      // But have same values
      expect(cloned.filters).toEqual(original.filters);
      expect(cloned.buildSearchFilter()).toBe(original.buildSearchFilter());
      expect(cloned.getPage()).toBe(original.getPage());
      expect(cloned.getPageSize()).toBe(original.getPageSize());
      expect(cloned.getOrderBy()).toBe(original.getOrderBy());
    });

    it('should create independent copies that do not affect each other', () => {
      const original = query.activeOnly();
      const cloned = original.clone();

      cloned.inactiveOnly();

      // Original should not be affected
      expect(original.filters).toContain('active eq true');
      expect(original.filters).not.toContain('active eq false');

      // Cloned should have both
      expect(cloned.filters).toContain('active eq true');
      expect(cloned.filters).toContain('active eq false');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string search gracefully', () => {
      query.search('   '); // Only whitespace
      expect(query.buildSearchFilter()).toBeUndefined();
    });

    it('should handle special characters in filters', () => {
      query.byVisualBadgeId("Badge's & More");
      expect(query.filters).toContain("visualBadgeId eq 'Badge''s & More'");
    });
  });
});
