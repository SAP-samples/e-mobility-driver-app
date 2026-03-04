// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { SessionQuery } from '../../../src/store/sessions/query-builder';

describe('SessionQuery', () => {
  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const query = new SessionQuery()
        .search('ABC123')
        .inProgress()
        .bySite('Downtown Station')
        .page(2, 25)
        .orderBy('timestamp', 'desc');

      expect(query).toBeInstanceOf(SessionQuery);
    });

    it('should build correct query string with multiple filters', () => {
      const query = new SessionQuery()
        .search('DEF456')
        .completed()
        .byBadgeId('badge-123')
        .minDuration(60)
        .maxPrice(50);

      const filter = query.buildFilter();

      expect(filter).toContain('def456');
      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain("badgeVisualBadgeId eq 'badge-123'");
      expect(filter).toContain('totalDuration ge 60');
      expect(filter).toContain('cumulatedPrice le 50');
    });
  });

  describe('Search functionality', () => {
    it('should search by session ID', () => {
      const query = new SessionQuery().search('SESSION123');
      const filter = query.buildFilter();

      expect(filter).toContain('session123');
    });

    it('should ignore empty search terms', () => {
      const query = new SessionQuery().search('').search('   ');
      const filter = query.buildFilter();

      expect(filter).toBeUndefined();
    });

    it('should handle special characters in search', () => {
      const query = new SessionQuery().search("O'Reilly-Station");
      const filter = query.buildFilter();

      expect(filter).toContain("o''reilly-station");
    });
  });

  describe('Status filters', () => {
    it('should filter by in-progress status', () => {
      const query = new SessionQuery().inProgress();
      const filter = query.buildFilter();

      expect(filter).toBe("status eq 'InProgress'");
    });

    it('should filter by completed status', () => {
      const query = new SessionQuery().completed();
      const filter = query.buildFilter();

      expect(filter).toBe("status ne 'InProgress'");
    });

    it('should filter by custom status', () => {
      const query = new SessionQuery().byStatus('error');
      const filter = query.buildFilter();

      expect(filter).toBe("status eq 'error'");
    });

    it('should combine status with other filters', () => {
      const query = new SessionQuery().inProgress().bySite('Main Station');

      const filter = query.buildFilter();

      expect(filter).toContain("status eq 'InProgress'");
      expect(filter).toContain("siteName eq 'Main Station'");
    });
  });

  describe('Location filters', () => {
    it('should filter by site name', () => {
      const query = new SessionQuery().bySite('Downtown Hub');
      const filter = query.buildFilter();

      expect(filter).toBe("siteName eq 'Downtown Hub'");
    });

    it('should filter by charging station', () => {
      const query = new SessionQuery().byChargingStation('CS-001');
      const filter = query.buildFilter();

      expect(filter).toBe("chargingStationName eq 'CS-001'");
    });

    it('should escape quotes in location names', () => {
      const query = new SessionQuery().bySite("O'Hare Station");
      const filter = query.buildFilter();

      expect(filter).toBe("siteName eq 'O''Hare Station'");
    });
  });

  describe('Badge filters', () => {
    it('should filter by badge ID', () => {
      const query = new SessionQuery().byBadgeId('BADGE-123');
      const filter = query.buildFilter();

      expect(filter).toBe("badgeVisualBadgeId eq 'BADGE-123'");
    });

    it('should filter by authentication ID', () => {
      const query = new SessionQuery().byAuthenticationId('auth-456');
      const filter = query.buildFilter();

      expect(filter).toBe("badgeAuthenticationId eq 'auth-456'");
    });
  });

  describe('Duration filters', () => {
    it('should filter by minimum duration', () => {
      const query = new SessionQuery().minDuration(30);
      const filter = query.buildFilter();

      expect(filter).toBe('totalDuration ge 30');
    });

    it('should filter by maximum duration', () => {
      const query = new SessionQuery().maxDuration(120);
      const filter = query.buildFilter();

      expect(filter).toBe('totalDuration le 120');
    });
  });

  describe('Energy filters', () => {
    it('should filter by minimum energy', () => {
      const query = new SessionQuery().minEnergy(25.5);
      const filter = query.buildFilter();

      expect(filter).toBe('totalEnergyDelivered ge 25.5');
    });

    it('should filter by maximum energy', () => {
      const query = new SessionQuery().maxEnergy(100);
      const filter = query.buildFilter();

      expect(filter).toBe('totalEnergyDelivered le 100');
    });
  });

  describe('Price filters', () => {
    it('should filter by minimum price', () => {
      const query = new SessionQuery().minPrice(15.5);
      const filter = query.buildFilter();

      expect(filter).toBe('cumulatedPrice ge 15.5');
    });

    it('should filter by maximum price', () => {
      const query = new SessionQuery().maxPrice(50);
      const filter = query.buildFilter();

      expect(filter).toBe('cumulatedPrice le 50');
    });
  });

  describe('Date filters', () => {
    it('should filter by start date (since)', () => {
      const query = new SessionQuery().since('2024-01-15T10:00:00Z');
      const filter = query.buildFilter();

      expect(filter).toBe("timestamp ge '2024-01-15T10:00:00Z'");
    });

    it('should filter by end date (until)', () => {
      const query = new SessionQuery().until('2024-01-20T15:30:00Z');
      const filter = query.buildFilter();

      expect(filter).toBe("timestamp le '2024-01-20T15:30:00Z'");
    });
  });

  describe('Pagination and sorting', () => {
    it('should set pagination parameters', () => {
      const query = new SessionQuery().page(3, 50);

      expect(query.getPage()).toBe(3);
      expect(query.getPageSize()).toBe(50);
    });

    it('should handle zero page correctly', () => {
      const query = new SessionQuery().page(0, 25);

      expect(query.getPage()).toBe(1); // Should default to 1
      expect(query.getPageSize()).toBe(25);
    });

    it('should set sorting by field', () => {
      const query = new SessionQuery().orderBy('timestamp', 'desc');
      const orderBy = query.getOrderBy();

      expect(orderBy).toBe('timestamp desc');
    });

    it('should default to ascending sort', () => {
      const query = new SessionQuery().orderBy('totalEnergyDelivered');
      const orderBy = query.getOrderBy();

      expect(orderBy).toBe('totalEnergyDelivered asc');
    });

    it('should support specific sorting methods', () => {
      const query = new SessionQuery().orderByTimestamp('asc');
      const orderBy = query.getOrderBy();

      expect(orderBy).toBe('timestamp asc');
    });
  });

  describe('Complex scenarios', () => {
    it('should build comprehensive query for session analysis', () => {
      const query = new SessionQuery()
        .search('CS-')
        .completed()
        .since('2024-01-01T00:00:00Z')
        .until('2024-01-31T23:59:59Z')
        .bySite('Downtown Hub')
        .minEnergy(20)
        .maxPrice(75)
        .minDuration(30)
        .maxDuration(240)
        .orderByEnergy('desc')
        .page(2, 20);

      const filter = query.buildFilter();
      const orderBy = query.getOrderBy();

      // Check filter components
      expect(filter).toContain('cs-');
      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain("timestamp ge '2024-01-01T00:00:00Z'");
      expect(filter).toContain("timestamp le '2024-01-31T23:59:59Z'");
      expect(filter).toContain("siteName eq 'Downtown Hub'");
      expect(filter).toContain('totalEnergyDelivered ge 20');
      expect(filter).toContain('cumulatedPrice le 75');
      expect(filter).toContain('totalDuration ge 30');
      expect(filter).toContain('totalDuration le 240');

      // Check pagination and sorting
      expect(query.getPage()).toBe(2);
      expect(query.getPageSize()).toBe(20);
      expect(orderBy).toBe('totalEnergyDelivered desc');
    });

    it('should handle query for charging session monitoring', () => {
      const query = new SessionQuery()
        .inProgress()
        .byBadgeId('DRIVER-001')
        .minDuration(15)
        .orderByTimestamp('asc');

      const filter = query.buildFilter();
      const orderBy = query.getOrderBy();

      expect(filter).toContain("status eq 'InProgress'");
      expect(filter).toContain("badgeVisualBadgeId eq 'DRIVER-001'");
      expect(filter).toContain('totalDuration ge 15');
      expect(orderBy).toBe('timestamp asc');
    });

    it('should handle query for cost analysis', () => {
      const query = new SessionQuery()
        .completed()
        .since('2024-01-01T00:00:00Z')
        .until('2024-01-31T23:59:59Z')
        .minPrice(50)
        .orderByPrice('desc')
        .page(1, 100);

      const filter = query.buildFilter();
      const orderBy = query.getOrderBy();

      expect(filter).toContain("status ne 'InProgress'");
      expect(filter).toContain("timestamp ge '2024-01-01T00:00:00Z'");
      expect(filter).toContain("timestamp le '2024-01-31T23:59:59Z'");
      expect(filter).toContain('cumulatedPrice ge 50');
      expect(orderBy).toBe('cumulatedPrice desc');
      expect(query.getPageSize()).toBe(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty query', () => {
      const query = new SessionQuery();
      const filter = query.buildFilter();

      expect(filter).toBeUndefined();
    });

    it('should handle negative values gracefully', () => {
      const query = new SessionQuery().minDuration(-10).maxEnergy(-5).page(-1, -20);

      const filter = query.buildFilter();

      // Negative duration and energy should still be applied
      expect(filter).toContain('totalDuration ge -10');
      expect(filter).toContain('totalEnergyDelivered le -5');

      // Pagination should handle negatives gracefully
      expect(query.getPage()).toBe(1); // Should not go negative
      expect(query.getPageSize()).toBe(1); // Should have minimum value
    });

    it('should handle very large numbers', () => {
      const query = new SessionQuery().minEnergy(999999.99).maxPrice(1000000);

      const filter = query.buildFilter();

      expect(filter).toContain('totalEnergyDelivered ge 999999.99');
      expect(filter).toContain('cumulatedPrice le 1000000');
    });

    it('should clone correctly', () => {
      const original = new SessionQuery()
        .search('test')
        .inProgress()
        .bySite('Test Site')
        .orderBy('timestamp', 'desc')
        .page(2, 50);

      const cloned = original.clone();

      expect(cloned).toBeInstanceOf(SessionQuery);
      expect(cloned).not.toBe(original);
      expect(cloned.buildFilter()).toBe(original.buildFilter());
      expect(cloned.getOrderBy()).toBe(original.getOrderBy());
      expect(cloned.getPage()).toBe(original.getPage());
      expect(cloned.getPageSize()).toBe(original.getPageSize());
    });
  });
});
