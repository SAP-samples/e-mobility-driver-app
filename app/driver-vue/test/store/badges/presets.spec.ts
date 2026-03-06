// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { BadgePresets } from '@/store/badges/presets';

describe('BadgePresets', () => {
  describe('Static presets', () => {
    it('should create active badges query', () => {
      const query = BadgePresets.active();

      expect(query.filters).toContain('active eq true');
      expect(query.getOrderBy()).toBe('visualBadgeId asc');
    });

    it('should create inactive badges query', () => {
      const query = BadgePresets.inactive();

      expect(query.filters).toContain('active eq false');
      expect(query.getOrderBy()).toBe('visualBadgeId asc');
    });

    it('should create badges with license plate query', () => {
      const query = BadgePresets.withLicensePlate();

      expect(query.filters).toContain('licensePlate ne null');
      expect(query.getOrderBy()).toBe('licensePlate asc');
    });

    it('should create active badges with license plate query', () => {
      const query = BadgePresets.activeWithLicensePlate();

      expect(query.filters).toContain('active eq true');
      expect(query.filters).toContain('licensePlate ne null');
    });

    it('should create query by user with first name only', () => {
      const query = BadgePresets.byUser('John');

      expect(query.filters).toContain('active eq true');
      expect(query.filters).toContain("firstName eq 'John'");
      expect(query.getOrderBy()).toBe('firstName asc, lastName asc');
    });

    it('should create query by user with last name only', () => {
      const query = BadgePresets.byUser(undefined, 'Doe');

      expect(query.filters).toContain('active eq true');
      expect(query.filters).toContain("lastName eq 'Doe'");
      expect(query.getOrderBy()).toBe('firstName asc, lastName asc');
    });

    it('should create query by user with both names', () => {
      const query = BadgePresets.byUser('John', 'Doe');

      expect(query.filters).toContain('active eq true');
      expect(query.filters).toContain("firstName eq 'John'");
      expect(query.filters).toContain("lastName eq 'Doe'");
      expect(query.getOrderBy()).toBe('firstName asc, lastName asc');
    });

    it('should handle special characters in user names', () => {
      const query = BadgePresets.byUser("John's", "O'Connor");

      expect(query.filters).toContain("firstName eq 'John''s'");
      expect(query.filters).toContain("lastName eq 'O''Connor'");
    });

    it('should create default sorted query', () => {
      const query = BadgePresets.defaultSorted();

      expect(query.filters).toEqual([]);
      expect(query.getOrderBy()).toBe('visualBadgeId asc');
    });
  });

  describe('Inherited presets', () => {
    it('should create search query', () => {
      const presets = new BadgePresets();
      const query = presets.search('test');

      expect(query.buildSearchFilter()).toContain("contains(tolower(visualBadgeId),'test')");
    });

    it('should create paginated query', () => {
      const presets = new BadgePresets();
      const query = presets.paginated(2, 25);

      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(25);
    });

    it('should create near location query', () => {
      const presets = new BadgePresets();
      const query = presets.nearLocation(48.8566, 2.3522, 5);

      const location = query.getLocation();
      expect(location).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 5000, // 5km converted to meters
      });
    });
  });

  describe('Method chaining and independence', () => {
    it('should create new instance each time', () => {
      const query1 = BadgePresets.active();
      const query2 = BadgePresets.active();

      expect(query1).not.toBe(query2);
      expect(query1.filters).toEqual(query2.filters);
    });

    it('should allow method chaining on presets', () => {
      const query = BadgePresets.active().search('test').page(2, 50);

      expect(query.filters).toContain('active eq true');
      expect(query.buildSearchFilter()).toContain("contains(tolower(visualBadgeId),'test')");
      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(50);
    });

    it('should handle empty parameters gracefully', () => {
      const query = BadgePresets.byUser('', '');

      expect(query.filters).toContain('active eq true');
      // Empty strings are treated as falsy, so no filters are added for them
      expect(query.filters).not.toContain('firstName');
      expect(query.filters).not.toContain('lastName');
      expect(query.getOrderBy()).toBe('firstName asc, lastName asc');
    });
  });

  describe('Type safety and validation', () => {
    it('should return BadgeQuery instances', () => {
      const activeQuery = BadgePresets.active();
      const inactiveQuery = BadgePresets.inactive();
      const defaultQuery = BadgePresets.defaultSorted();

      expect(activeQuery.constructor.name).toBe('BadgeQuery');
      expect(inactiveQuery.constructor.name).toBe('BadgeQuery');
      expect(defaultQuery.constructor.name).toBe('BadgeQuery');
    });

    it('should maintain query state independently', () => {
      const query1 = BadgePresets.active();
      const query2 = BadgePresets.inactive();

      query1.search('foo');
      query2.search('bar');

      expect(query1.buildSearchFilter()).toContain('foo');
      expect(query2.buildSearchFilter()).toContain('bar');
      expect(query1.filters).toContain('active eq true');
      expect(query2.filters).toContain('active eq false');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined user parameters', () => {
      const query = BadgePresets.byUser();

      expect(query.filters).toContain('active eq true');
      expect(query.filters).not.toContain('firstName');
      expect(query.filters).not.toContain('lastName');
      expect(query.getOrderBy()).toBe('firstName asc, lastName asc');
    });

    it('should handle special unicode characters', () => {
      const query = BadgePresets.byUser('José', 'François');

      expect(query.filters).toContain("firstName eq 'José'");
      expect(query.filters).toContain("lastName eq 'François'");
    });

    it('should handle very long names', () => {
      const longName = 'a'.repeat(100);
      const query = BadgePresets.byUser(longName, longName);

      expect(query.filters).toContain(`firstName eq '${longName}'`);
      expect(query.filters).toContain(`lastName eq '${longName}'`);
    });
  });
});
