// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds from '@sap/cds';

// Mock dependencies
const mockLogger = {
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@sap/cds', () => ({
  __esModule: true,
  default: {
    log: jest.fn(() => mockLogger),
    parse: {
      xpr: jest.fn(),
    },
  },
}));

// Import after mocking
import type { UserBadge } from '../../srv/utils/badge-validator';
import { addFilterToQuery, buildBadgeFilter } from '../../srv/utils/request-filter';

const mockParseXpr = cds.parse.xpr as jest.MockedFunction<typeof cds.parse.xpr>;

describe('request-filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildBadgeFilter', () => {
    it('should build single badge filter', () => {
      const badges: UserBadge[] = [{ authenticationId: 'badge1', active: true }];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith("badgeAuthenticationId = 'badge1'");
      expect(result).toBe(mockXpr);
    });

    it('should build multiple badge filter with IN clause', () => {
      const badges: UserBadge[] = [
        { authenticationId: 'badge1', active: true },
        { authenticationId: 'badge2', active: false },
        { authenticationId: 'badge3', active: true },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(
        "badgeAuthenticationId in ('badge1', 'badge2', 'badge3')",
      );
      expect(result).toBe(mockXpr);
    });

    it('should handle badges with mixed active status', () => {
      const badges: UserBadge[] = [
        { authenticationId: 'active-badge', active: true },
        { authenticationId: 'inactive-badge', active: false },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(
        "badgeAuthenticationId in ('active-badge', 'inactive-badge')",
      );
      expect(result).toBe(mockXpr);
    });

    it('should filter out empty authentication IDs', () => {
      const badges: UserBadge[] = [
        { authenticationId: 'valid-badge', active: true },
        { authenticationId: '', active: true },
        { authenticationId: '   ', active: true },
        { authenticationId: 'another-valid', active: false },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(
        "badgeAuthenticationId in ('valid-badge', 'another-valid')",
      );
      expect(result).toBe(mockXpr);
    });

    it('should handle null authentication IDs', () => {
      const badges = [
        { authenticationId: 'valid-badge', active: true },
        { authenticationId: null as never, active: true },
        { authenticationId: undefined as never, active: true },
      ] as UserBadge[];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith("badgeAuthenticationId = 'valid-badge'");
      expect(result).toBe(mockXpr);
    });

    it('should throw error when badgeAuthIds is not an array', () => {
      const notAnArray = 'not-an-array' as never;

      expect(() => buildBadgeFilter(notAnArray)).toThrow('No badge found for the user');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'buildBadgeFilter: badgeAuthIds is not an array:',
        notAnArray,
      );
    });

    it('should throw error when array is empty', () => {
      const emptyArray: UserBadge[] = [];

      expect(() => buildBadgeFilter(emptyArray)).toThrow('No badge found for the user');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'buildBadgeFilter: badgeAuthIds is empty after filtering:',
        emptyArray,
      );
    });

    it('should throw error when all authentication IDs are empty after filtering', () => {
      const badges: UserBadge[] = [
        { authenticationId: '', active: true },
        { authenticationId: '   ', active: true },
        { authenticationId: null as never, active: true },
      ];

      expect(() => buildBadgeFilter(badges)).toThrow('No badge found for the user');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'buildBadgeFilter: badgeAuthIds is empty after filtering:',
        badges,
      );
    });

    it('should handle special characters in authentication IDs', () => {
      const badges: UserBadge[] = [
        { authenticationId: "badge'with'quotes", active: true },
        { authenticationId: 'badge-with-dashes', active: true },
        { authenticationId: 'badge_with_underscores', active: true },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(
        "badgeAuthenticationId in ('badge'with'quotes', 'badge-with-dashes', 'badge_with_underscores')",
      );
      expect(result).toBe(mockXpr);
    });

    it('should handle undefined badges parameter', () => {
      const badges = undefined as never;

      expect(() => buildBadgeFilter(badges)).toThrow('No badge found for the user');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'buildBadgeFilter: badgeAuthIds is not an array:',
        badges,
      );
    });

    it('should handle null badges parameter', () => {
      const badges = null as never;

      expect(() => buildBadgeFilter(badges)).toThrow('No badge found for the user');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'buildBadgeFilter: badgeAuthIds is not an array:',
        badges,
      );
    });
  });

  describe('addFilterToQuery', () => {
    let mockRequest: Partial<cds.Request>;

    beforeEach(() => {
      mockRequest = {
        query: {
          SELECT: {
            where: undefined,
          },
        } as cds.Query,
      };
    });

    it('should add filter to query when no existing where clause', () => {
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];

      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockRequest.query?.SELECT?.where).toEqual(filter);
      expect(mockLogger.debug).toHaveBeenCalledWith('Existing where clause: undefined');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Overridden where clause: ${JSON.stringify(filter)}`,
      );
    });

    it('should combine filter with existing simple where clause', () => {
      const existingWhere = ['status', '=', 'active'];
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = existingWhere as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockRequest.query?.SELECT?.where).toEqual([
        { xpr: filter },
        'and',
        { xpr: existingWhere },
      ]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Existing where clause: ${JSON.stringify(existingWhere)}`,
      );
    });

    it('should combine filter with existing complex where clause', () => {
      const existingWhere = [{ xpr: ['status', '=', 'active'] }];
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = existingWhere as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, filter);

      const expectedResult = [{ xpr: filter }, 'and', { xpr: existingWhere[0].xpr }];
      expect(mockRequest.query?.SELECT?.where).toEqual(expectedResult);
    });

    it('should handle existing where clause with single xpr object', () => {
      const existingWhere = [{ xpr: ['status', '=', 'active'] }];
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = existingWhere;
      }

      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockRequest.query?.SELECT?.where).toEqual([
        { xpr: filter },
        'and',
        { xpr: existingWhere[0].xpr },
      ]);
    });

    it('should not modify query when filter is undefined', () => {
      const originalWhere = ['status', '=', 'active'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = originalWhere as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, undefined);

      expect(mockRequest.query?.SELECT?.where).toEqual(originalWhere);
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should not modify query when filter is null', () => {
      const originalWhere = ['status', '=', 'active'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = originalWhere as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, null as never);

      expect(mockRequest.query?.SELECT?.where).toEqual(originalWhere);
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should handle complex nested where clauses', () => {
      const existingWhere = [
        { xpr: ['status', '=', 'active'] },
        'and',
        { xpr: ['type', '=', 'premium'] },
      ];
      const filter: cds._xpr = ['badgeAuthenticationId', 'in', "['badge1', 'badge2']"];
      if (mockRequest.query?.SELECT) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        mockRequest.query.SELECT.where = existingWhere as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockRequest.query?.SELECT?.where).toEqual([
        { xpr: filter },
        'and',
        { xpr: existingWhere },
      ]);
    });

    it('should handle empty existing where clause', () => {
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];
      if (mockRequest.query?.SELECT) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        mockRequest.query.SELECT.where = [] as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockRequest.query?.SELECT?.where).toEqual([{ xpr: filter }, 'and', { xpr: [] }]);
    });

    it('should handle missing SELECT in query', () => {
      const mockRequestNoSelect = {
        query: {},
      } as Partial<cds.Request>;
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];

      // This should throw an error due to missing SELECT
      expect(() => addFilterToQuery(mockRequestNoSelect as cds.Request, filter)).toThrow();
    });

    it('should handle request with no query property', () => {
      const mockRequestNoQuery = {} as Partial<cds.Request>;
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];

      // This should throw an error due to missing query
      expect(() => addFilterToQuery(mockRequestNoQuery as cds.Request, filter)).toThrow();
    });

    it('should log debug information for existing where clauses', () => {
      const existingWhere = ['userId', '=', '123'];
      const filter: cds._xpr = ['badgeAuthenticationId', '=', 'badge1'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = existingWhere as cds._xpr;
      }

      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Existing where clause: ${JSON.stringify(existingWhere)}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Overridden where clause: ${JSON.stringify([
          { xpr: filter },
          'and',
          { xpr: existingWhere },
        ])}`,
      );
    });

    it('should handle falsy filter values', () => {
      const originalWhere = ['status', '=', 'active'];
      if (mockRequest.query?.SELECT) {
        mockRequest.query.SELECT.where = originalWhere as cds._xpr;
      }

      // Test with falsy values
      addFilterToQuery(mockRequest as cds.Request, false as never);
      expect(mockRequest.query?.SELECT?.where).toEqual(originalWhere);

      addFilterToQuery(mockRequest as cds.Request, 0 as never);
      expect(mockRequest.query?.SELECT?.where).toEqual(originalWhere);

      addFilterToQuery(mockRequest as cds.Request, '' as never);
      expect(mockRequest.query?.SELECT?.where).toEqual(originalWhere);
    });
  });

  describe('Integration Tests', () => {
    it('should work together - buildBadgeFilter and addFilterToQuery', () => {
      const badges: UserBadge[] = [
        { authenticationId: 'badge1', active: true },
        { authenticationId: 'badge2', active: false },
      ];
      const mockXpr = ['badgeAuthenticationId', 'in', ['badge1', 'badge2']] as cds._xpr;
      mockParseXpr.mockReturnValue(mockXpr as never);

      const mockRequest = {
        query: {
          SELECT: {
            where: ['status', '=', 'active'],
          },
        } as unknown as cds.Query,
      } as Partial<cds.Request>;

      const filter = buildBadgeFilter(badges);
      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockParseXpr).toHaveBeenCalledWith("badgeAuthenticationId in ('badge1', 'badge2')");
      expect(mockRequest.query?.SELECT?.where).toEqual([
        { xpr: mockXpr },
        'and',
        { xpr: ['status', '=', 'active'] },
      ]);
    });

    it('should handle end-to-end scenario with empty badges', () => {
      const badges: UserBadge[] = [];

      expect(() => {
        const filter = buildBadgeFilter(badges);
        const mockRequest = {
          query: {
            SELECT: {
              where: undefined,
            },
          } as cds.Query,
        } as Partial<cds.Request>;
        addFilterToQuery(mockRequest as cds.Request, filter);
      }).toThrow('No badge found for the user');
    });

    it('should handle end-to-end scenario with single badge', () => {
      const badges: UserBadge[] = [{ authenticationId: 'single-badge', active: true }];
      const mockXpr = ['badgeAuthenticationId', '=', 'single-badge'] as cds._xpr;
      mockParseXpr.mockReturnValue(mockXpr as never);

      const mockRequest = {
        query: {
          SELECT: {
            where: undefined,
          },
        } as cds.Query,
      } as Partial<cds.Request>;

      const filter = buildBadgeFilter(badges);
      addFilterToQuery(mockRequest as cds.Request, filter);

      expect(mockParseXpr).toHaveBeenCalledWith("badgeAuthenticationId = 'single-badge'");
      expect(mockRequest.query?.SELECT?.where).toBe(mockXpr);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle badges with very long authentication IDs', () => {
      const longId = 'a'.repeat(1000);
      const badges: UserBadge[] = [{ authenticationId: longId, active: true }];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(`badgeAuthenticationId = '${longId}'`);
      expect(result).toBe(mockXpr);
    });

    it('should handle badges with numeric-like authentication IDs', () => {
      const badges: UserBadge[] = [
        { authenticationId: '123', active: true },
        { authenticationId: '456.789', active: false },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith("badgeAuthenticationId in ('123', '456.789')");
      expect(result).toBe(mockXpr);
    });

    it('should handle badges with unicode characters', () => {
      const badges: UserBadge[] = [
        { authenticationId: 'badge-🏷️', active: true },
        { authenticationId: 'значок-тест', active: false },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(
        "badgeAuthenticationId in ('badge-🏷️', 'значок-тест')",
      );
      expect(result).toBe(mockXpr);
    });

    it('should preserve order of authentication IDs', () => {
      const badges: UserBadge[] = [
        { authenticationId: 'z-badge', active: true },
        { authenticationId: 'a-badge', active: false },
        { authenticationId: 'm-badge', active: true },
      ];
      const mockXpr = { some: 'expression' };
      mockParseXpr.mockReturnValue(mockXpr as never);

      const result = buildBadgeFilter(badges);

      expect(mockParseXpr).toHaveBeenCalledWith(
        "badgeAuthenticationId in ('z-badge', 'a-badge', 'm-badge')",
      );
      expect(result).toBe(mockXpr);
    });
  });
});
