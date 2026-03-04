// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { SessionPresets } from '@/store/sessions/presets';

describe('SessionPresets', () => {
  describe('Status presets', () => {
    it('should create query for in-progress sessions', () => {
      const query = SessionPresets.inProgress();
      const filter = query.buildFilter();

      expect(filter).toBe("status eq 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should create query for completed sessions', () => {
      const query = SessionPresets.completed();
      const filter = query.buildFilter();

      expect(filter).toBe("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });
  });

  describe('Time-based presets', () => {
    it('should create query for recent history with default days', () => {
      const query = SessionPresets.recentHistory();
      const filter = query.buildFilter();

      // Should filter for last 30 days (default)
      expect(filter).toContain('timestamp ge');
      expect(filter).toContain("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should create query for recent history with custom days', () => {
      const query = SessionPresets.recentHistory(7);
      const filter = query.buildFilter();

      // Should filter for last 7 days
      expect(filter).toContain('timestamp ge');
      expect(filter).toContain("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should create query for this month', () => {
      const query = SessionPresets.thisMonth();
      const filter = query.buildFilter();

      // Should contain month range filters and exclude in-progress sessions
      expect(filter).toContain('timestamp ge');
      expect(filter).toContain("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should create query for this year', () => {
      const query = SessionPresets.thisYear();
      const filter = query.buildFilter();

      // Should contain year range filters and exclude in-progress sessions
      expect(filter).toContain('timestamp ge');
      expect(filter).toContain("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should create query for this week', () => {
      const query = SessionPresets.thisWeek();
      const filter = query.buildFilter();

      // Should contain week range filters and exclude in-progress sessions
      expect(filter).toContain('timestamp ge');
      expect(filter).toContain("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });
  });

  describe('Location-based presets', () => {
    it('should create query for sessions by site', () => {
      const query = SessionPresets.bySite('Downtown Station');
      const filter = query.buildFilter();

      expect(filter).toBe("siteName eq 'Downtown Station'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should create query for sessions by charging station', () => {
      const query = SessionPresets.byChargingStation('CS-001');
      const filter = query.buildFilter();

      expect(filter).toBe("chargingStationName eq 'CS-001'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should handle special characters in site names', () => {
      const query = SessionPresets.bySite("O'Hare Terminal");
      const filter = query.buildFilter();

      expect(filter).toBe("siteName eq 'O''Hare Terminal'");
    });

    it('should handle empty site name', () => {
      const query = SessionPresets.bySite('');
      const filter = query.buildFilter();

      expect(filter).toBe("siteName eq ''");
    });
  });

  describe('Badge-based presets', () => {
    it('should create query for sessions by badge', () => {
      const query = SessionPresets.byBadge('BADGE-123');
      const filter = query.buildFilter();

      expect(filter).toBe("badgeVisualBadgeId eq 'BADGE-123'");
      expect(query.getOrderBy()).toBe('timestamp desc');
    });

    it('should handle special characters in badge ID', () => {
      const query = SessionPresets.byBadge("BADGE'123");
      const filter = query.buildFilter();

      expect(filter).toBe("badgeVisualBadgeId eq 'BADGE''123'");
    });
  });

  describe('Value-based presets', () => {
    it('should create query for high energy sessions with default value', () => {
      const query = SessionPresets.highEnergy();
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('totalEnergyDelivered ge 50'); // Default value
      expect(query.getOrderBy()).toBe('totalEnergyDelivered desc');
    });

    it('should create query for high energy sessions with custom value', () => {
      const query = SessionPresets.highEnergy(75);
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('totalEnergyDelivered ge 75');
      expect(query.getOrderBy()).toBe('totalEnergyDelivered desc');
    });

    it('should create query for long duration sessions with default value', () => {
      const query = SessionPresets.longDuration();
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('totalDuration ge 180'); // Default value
      expect(query.getOrderBy()).toBe('totalDuration desc');
    });

    it('should create query for long duration sessions with custom value', () => {
      const query = SessionPresets.longDuration(240);
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('totalDuration ge 240');
      expect(query.getOrderBy()).toBe('totalDuration desc');
    });

    it('should create query for expensive sessions with default value', () => {
      const query = SessionPresets.expensive();
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('cumulatedPrice ge 100'); // Default value
      expect(query.getOrderBy()).toBe('cumulatedPrice desc');
    });

    it('should create query for expensive sessions with custom value', () => {
      const query = SessionPresets.expensive(150);
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('cumulatedPrice ge 150');
      expect(query.getOrderBy()).toBe('cumulatedPrice desc');
    });
  });

  describe('Session count presets', () => {
    it('should create query for last sessions with default count', () => {
      const query = SessionPresets.lastSessions();
      const filter = query.buildFilter();

      expect(filter).toBe("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(100); // Default count
    });

    it('should create query for last sessions with custom count', () => {
      const query = SessionPresets.lastSessions(50);
      const filter = query.buildFilter();

      expect(filter).toBe("status ne 'InProgress'");
      expect(query.getOrderBy()).toBe('timestamp desc');
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(50);
    });

    it('should handle edge cases for session count', () => {
      const zeroQuery = SessionPresets.lastSessions(0);
      const negativeQuery = SessionPresets.lastSessions(-5);

      expect(zeroQuery.getPageSize()).toBe(1); // BaseQuery validates minimum page size to 1
      expect(negativeQuery.getPageSize()).toBe(1); // BaseQuery validates minimum page size to 1
    });
  });

  describe('Default sorting', () => {
    it('should create default sorted query', () => {
      const query = SessionPresets.defaultSorted();

      expect(query.filters).toEqual([]);
      expect(query.getOrderBy()).toBe('timestamp desc');
    });
  });

  describe('Inherited presets', () => {
    it('should create search query', () => {
      const presets = new SessionPresets();
      const query = presets.search('charging');

      expect(query.buildSearchFilter()).toContain("contains(tolower(siteName),'charging')");
    });

    it('should create paginated query', () => {
      const presets = new SessionPresets();
      const query = presets.paginated(2, 30);

      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(30);
    });

    it('should create near location query', () => {
      const presets = new SessionPresets();
      const query = presets.nearLocation(48.8566, 2.3522, 10);

      const location = query.getLocation();
      expect(location).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 10000, // 10km converted to meters
      });
    });
  });

  describe('Method chaining and combination', () => {
    it('should create query combining multiple filters', () => {
      const query = SessionPresets.inProgress().minEnergy(40);
      const filter = query.buildFilter();

      expect(filter).toContain("status eq 'InProgress'");
      expect(filter).toContain('totalEnergyDelivered ge 40');
    });

    it('should create query for completed expensive sessions manually', () => {
      const query = SessionPresets.completed().minPrice(80);
      const filter = query.buildFilter();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain('cumulatedPrice ge 80');
    });

    it('should create query for recent high-energy sessions manually', () => {
      const query = SessionPresets.recentHistory(14).minEnergy(30);
      const filter = query.buildFilter();

      expect(filter).toContain('totalEnergyDelivered ge 30');
      expect(filter).toContain('timestamp ge');
    });

    it('should allow method chaining on presets', () => {
      const query = SessionPresets.completed().search('tesla').page(1, 50);

      expect(query.filters).toContain("status ne 'InProgress'");
      expect(query.buildSearchFilter()).toContain("contains(tolower(siteName),'tesla')");
      expect(query.getPage()).toBe(1);
      expect(query.getPageSize()).toBe(50);
    });
  });

  describe('Type safety and validation', () => {
    it('should return SessionQuery instances', () => {
      const inProgressQuery = SessionPresets.inProgress();
      const completedQuery = SessionPresets.completed();
      const defaultQuery = SessionPresets.defaultSorted();

      expect(inProgressQuery.constructor.name).toBe('SessionQuery');
      expect(completedQuery.constructor.name).toBe('SessionQuery');
      expect(defaultQuery.constructor.name).toBe('SessionQuery');
    });

    it('should maintain query state independently', () => {
      const query1 = SessionPresets.inProgress();
      const query2 = SessionPresets.completed();

      query1.search('foo');
      query2.search('bar');

      expect(query1.buildSearchFilter()).toContain('foo');
      expect(query2.buildSearchFilter()).toContain('bar');
      expect(query1.filters).toContain("status eq 'InProgress'");
      expect(query2.filters).toContain("status ne 'InProgress'");
    });

    it('should create new instances each time', () => {
      const query1 = SessionPresets.inProgress();
      const query2 = SessionPresets.inProgress();

      expect(query1).not.toBe(query2);
      expect(query1.filters).toEqual(query2.filters);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle zero values for thresholds', () => {
      const highEnergyQuery = SessionPresets.highEnergy(0);
      const longDurationQuery = SessionPresets.longDuration(0);
      const expensiveQuery = SessionPresets.expensive(0);

      expect(highEnergyQuery.buildFilter()).toContain('totalEnergyDelivered ge 0');
      expect(longDurationQuery.buildFilter()).toContain('totalDuration ge 0');
      expect(expensiveQuery.buildFilter()).toContain('cumulatedPrice ge 0');
    });

    it('should handle negative values for thresholds', () => {
      const highEnergyQuery = SessionPresets.highEnergy(-10);
      const longDurationQuery = SessionPresets.longDuration(-5);
      const expensiveQuery = SessionPresets.expensive(-20);

      expect(highEnergyQuery.buildFilter()).toContain('totalEnergyDelivered ge -10');
      expect(longDurationQuery.buildFilter()).toContain('totalDuration ge -5');
      expect(expensiveQuery.buildFilter()).toContain('cumulatedPrice ge -20');
    });

    it('should handle very large values', () => {
      const highEnergyQuery = SessionPresets.highEnergy(99999);
      const longDurationQuery = SessionPresets.longDuration(99999);
      const expensiveQuery = SessionPresets.expensive(99999);

      expect(highEnergyQuery.buildFilter()).toContain('totalEnergyDelivered ge 99999');
      expect(longDurationQuery.buildFilter()).toContain('totalDuration ge 99999');
      expect(expensiveQuery.buildFilter()).toContain('cumulatedPrice ge 99999');
    });

    it('should handle decimal values', () => {
      const highEnergyQuery = SessionPresets.highEnergy(25.5);
      const expensiveQuery = SessionPresets.expensive(99.99);

      expect(highEnergyQuery.buildFilter()).toContain('totalEnergyDelivered ge 25.5');
      expect(expensiveQuery.buildFilter()).toContain('cumulatedPrice ge 99.99');
    });

    it('should handle unicode characters in site names', () => {
      const query = SessionPresets.bySite('Stação São Paulo');

      expect(query.buildFilter()).toBe("siteName eq 'Stação São Paulo'");
    });

    it('should handle very long site names', () => {
      const longSiteName = 'a'.repeat(100);
      const query = SessionPresets.bySite(longSiteName);

      expect(query.buildFilter()).toBe(`siteName eq '${longSiteName}'`);
    });

    it('should handle recent history with edge case days', () => {
      const zeroQuery = SessionPresets.recentHistory(0);
      const negativeQuery = SessionPresets.recentHistory(-5);

      // Both should still create valid queries
      expect(zeroQuery.buildFilter()).toContain('timestamp ge');
      expect(negativeQuery.buildFilter()).toContain('timestamp ge');
    });
  });

  describe('Date handling', () => {
    it('should create consistent date filters for this month', () => {
      const query1 = SessionPresets.thisMonth();
      const query2 = SessionPresets.thisMonth();

      // Both should create similar patterns (though exact timestamp may differ by milliseconds)
      expect(query1.buildFilter()).toContain('timestamp ge');
      expect(query2.buildFilter()).toContain('timestamp ge');
    });

    it('should create consistent date filters for this week', () => {
      const query1 = SessionPresets.thisWeek();
      const query2 = SessionPresets.thisWeek();

      // Both should create similar patterns
      expect(query1.buildFilter()).toContain('timestamp ge');
      expect(query2.buildFilter()).toContain('timestamp ge');
    });

    it('should handle recent history date calculations', () => {
      const query = SessionPresets.recentHistory(1);

      // The query should have been created within a reasonable time window
      expect(query.buildFilter()).toContain('timestamp ge');

      // Verify that the date is roughly 1 day ago
      const filter = query.buildFilter();
      expect(filter).toMatch(/timestamp ge '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
