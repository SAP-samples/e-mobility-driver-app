// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { EvseQuery } from '@/store/evse';

/**
 * Test suite specifically for issue #24: "Inoperative connectors shall not appear in the available only filter"
 *
 * This test verifies that the availableOnly() filter correctly excludes inoperative connectors
 * by only including connectors with 'Available' or 'Preparing' status.
 */
describe('Issue #24: Inoperative connectors filter', () => {
  describe('availableOnly() filter behavior', () => {
    it('should only include Available and Preparing connectors', () => {
      const query = new EvseQuery();
      query.availableOnly();

      const filter = query.buildFilter();

      // The new filter should explicitly include only Available and Preparing connectors
      expect(filter).toBe("connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')");
    });

    it('should exclude inoperative connectors by design', () => {
      const query = new EvseQuery();
      query.availableOnly();

      const filter = query.buildFilter();

      // Verify the filter does NOT include inoperative statuses
      expect(filter).not.toContain('Faulted');
      expect(filter).not.toContain('Unavailable');
      expect(filter).not.toContain('Charging');
      expect(filter).not.toContain('Reserved');
      expect(filter).not.toContain('SuspendedEV');
      expect(filter).not.toContain('SuspendedEVSE');
      expect(filter).not.toContain('Finishing');

      // Verify it only includes the available statuses
      expect(filter).toContain('Available');
      expect(filter).toContain('Preparing');
    });

    it('should use positive filtering approach instead of negative filtering', () => {
      const query = new EvseQuery();
      query.availableOnly();

      const filter = query.buildFilter();

      // The new approach should use positive filtering (include what we want)
      // instead of negative filtering (exclude what we don't want)
      expect(filter).not.toContain('not (');
      expect(filter).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
    });

    it('should work correctly with other filters', () => {
      const query = new EvseQuery();
      query.availableOnly().fastChargingOnly();

      const filter = query.buildFilter();

      // Should combine both filters with AND
      expect(filter).toContain(' and ');
      expect(filter).toContain(
        "connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')",
      );
      expect(filter).toContain("connectors/any(c:c/currentType eq 'DC' and c/maximumPower ge 50)");
    });
  });

  describe('Status mapping consistency', () => {
    it('should be consistent with OCPI status mapping', () => {
      // This test documents the relationship between the filter and the OCPI status mapping
      // From useEvseStatusState.ts:
      // - 'Available' maps to OCPI 'AVAILABLE'
      // - 'Preparing' maps to OCPI 'AVAILABLE'
      // - 'Faulted' maps to OCPI 'OUTOFORDER' (should be excluded)
      // - 'Unavailable' maps to OCPI 'INOPERATIVE' (should be excluded)

      const query = new EvseQuery();
      query.availableOnly();

      const filter = query.buildFilter();

      // The filter should only include statuses that map to truly available OCPI statuses
      expect(filter).toBe("connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')");
    });
  });

  describe('Regression test for issue #24', () => {
    it('should resolve the original issue: inoperative connectors not appearing in available only filter', () => {
      const query = new EvseQuery();
      query.availableOnly();

      const filter = query.buildFilter();

      // Before the fix: The filter would exclude some statuses but still allow inoperative ones
      // After the fix: The filter explicitly includes only truly available statuses

      // This ensures that EVSEs with only inoperative connectors (Faulted, Unavailable)
      // will NOT match this filter, thus resolving issue #24
      expect(filter).toBe("connectors/any(c:c/status eq 'Available' or c/status eq 'Preparing')");

      // The filter now uses a positive approach: only EVSEs that have at least one
      // Available or Preparing connector will be included in the results
    });
  });
});
