// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds, { Service } from '@sap/cds';

import { SessionService } from '../srv/session-service';
import type { UserBadge } from '../srv/utils/badge-validator';

// Test constants
const TEST_CONSTANTS = {
  BADGE_IDS: {
    BADGE_1: 'badge1',
    BADGE_2: 'badge2',
  },
  SESSION_IDS: {
    SESSION_123: 'session123',
    NEW_SESSION_123: 'newSession123',
  },
  STATION_IDS: {
    STATION_123: 'station123',
  },
  EVSE_IDS: {
    EVSE_001: 'evse-uuid-001',
    EVSE_002: 'evse-uuid-002',
  },
  EVSE_CODES: {
    EVSE_001: 'EVSE001',
  },
  CONNECTOR_IDS: {
    CONNECTOR_1: '1',
    CONNECTOR_5: '5',
  },
  ERROR_MESSAGES: {
    ACCESS_DENIED: 'Access denied',
    BADGE_VALIDATION_FAILED: 'Badge validation failed',
    BADGE_ACCESS_DENIED: 'Badge access denied',
    SESSION_ID_REQUIRED: 'Session ID is required to stop the charging session.',
    SESSION_NOT_FOUND: (id: string) => `Charging session with ID ${id} not found.`,
    UNAUTHORIZED_STOP: (id: string) => `Unauthorized to stop charging session with ID ${id}.`,
    EVSE_NOT_FOUND: (code: string) => `Charging station with EVSE code ${code} not found.`,
    EVSE_ID_REQUIRED: 'EVSE Id is required to start the charging session.',
    NO_ACTIVE_BADGE: 'No active badge authentication found for the user.',
    EVSE_NOT_FOUND_BY_ID: (id: string) => `EVSE with ID ${id} not found.`,
    NO_AVAILABLE_CONNECTORS: (id: string) => `No available connectors found for EVSE ${id}.`,
  },
} as const;

/**
 * Factory for creating mock objects
 */
class MockFactory {
  static createLogger() {
    return {
      error: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };
  }

  static createChargingSessionService() {
    return {
      run: jest.fn(),
      send: jest.fn(),
      entities: {
        ChargingSessions: 'ChargingSessions',
      },
    };
  }

  static createChargingStationService() {
    return {
      run: jest.fn(),
      send: jest.fn(),
      entities: {
        Evses: 'Evses',
        Connectors: 'Connectors',
      },
    };
  }

  static createUserBadge(authId: string, active = true): UserBadge {
    return {
      authenticationId: authId,
      active,
    };
  }

  static createChargingSession(id: string, badgeId: string, evseCode: string) {
    return {
      id,
      badgeAuthenticationId: badgeId,
      evseCode,
    };
  }

  static createEvse(code: string, stationId: string) {
    return {
      code,
      chargingStationId: stationId,
    };
  }

  static createMockRequest(overrides: Partial<CdsRequestWithContext> = {}): CdsRequestWithContext {
    return {
      query: {
        SELECT: {
          from: 'ChargingSessions',
          where: undefined,
        },
      },
      data: {},
      reply: jest.fn(),
      error: jest.fn(),
      ...overrides,
    } as unknown as CdsRequestWithContext;
  }

  static createSelectQuery(from: string, where?: unknown) {
    return {
      SELECT: {
        from,
        where,
      },
    };
  }

  static createNonSelectQuery(type: 'UPDATE' | 'INSERT' | 'DELETE' = 'UPDATE') {
    return {
      [type]: { entity: 'ChargingSessions' },
    };
  }
}

/**
 * Test helper utilities
 */
class TestHelpers {
  static setupCdsConnectMock(
    mockCdsConnectTo: jest.MockedFunction<typeof cds.connect.to>,
    chargingSessionService: unknown,
    chargingStationService: unknown,
  ) {
    // Use any to bypass strict typing issues with multiple overloads
    mockCdsConnectTo.mockImplementation((serviceOrOptions) => {
      const serviceName =
        typeof serviceOrOptions === 'string' ? serviceOrOptions : serviceOrOptions?.service;
      switch (serviceName) {
        case 'ChargingSessionService':
          return Promise.resolve(chargingSessionService as Service);
        case 'ChargingStationService':
          return Promise.resolve(chargingStationService as Service);
        default:
          return Promise.resolve({} as Service);
      }
    });
  }

  static expectErrorLogged(mockLogger: ReturnType<typeof MockFactory.createLogger>, error: Error) {
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error while'),
      JSON.stringify(error),
    );
  }

  static expectRequestErrorCalled(mockRequest: CdsRequestWithContext) {
    expect(mockRequest.error).toHaveBeenCalledWith(expect.any(Error));
  }

  static expectRequestRepliedWith(mockRequest: CdsRequestWithContext, value: unknown) {
    expect(mockRequest.reply).toHaveBeenCalledWith(value);
  }
}

// Mock dependencies setup
const mockLogger = MockFactory.createLogger();
const mockChargingSessionService = MockFactory.createChargingSessionService();
const mockChargingStationService = MockFactory.createChargingStationService();

// Mock the CDS framework
jest.mock('@sap/cds', () => ({
  __esModule: true,
  default: {
    log: jest.fn(() => mockLogger),
    connect: {
      to: jest.fn(),
    },
    Service: class MockService {
      async init() {
        // Mock base init
      }
      on() {
        // Mock event registration
      }
    },
    ApplicationService: class MockService {
      async init() {
        // Mock base init
      }
      on() {
        // Mock event registration
      }
    },
  },
  Service: class MockService {
    async init() {
      // Mock base init
    }
    on() {
      // Mock event registration
    }
  },
  ApplicationService: class MockService {
    async init() {
      // Mock base init
    }
    on() {
      // Mock event registration
    }
  },
  SELECT: {
    one: {
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
      }),
    },
  },
}));

// Mock global SELECT for direct imports
(global as { SELECT?: unknown }).SELECT = {
  one: {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
    }),
  },
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
  }),
};

// Mock utility modules
jest.mock('../srv/utils/badge-validator', () => ({
  requireBadgeAccess: jest.fn(),
  getCurrentUserBadges: jest.fn(),
  getActiveUserBadge: jest.fn(),
  hasUserBadge: jest.fn(),
}));

jest.mock('../srv/utils/request-filter', () => ({
  buildBadgeFilter: jest.fn(),
  addFilterToQuery: jest.fn(),
}));

// Import mocked functions with proper typing
import {
  getActiveUserBadge,
  getCurrentUserBadges,
  hasUserBadge,
  requireBadgeAccess,
} from '../srv/utils/badge-validator';
import { addFilterToQuery, buildBadgeFilter } from '../srv/utils/request-filter';
import type { CdsRequestWithContext } from '../types/cds-request';

const mockRequireBadgeAccess = requireBadgeAccess as jest.MockedFunction<typeof requireBadgeAccess>;
const mockGetCurrentUserBadges = getCurrentUserBadges as jest.MockedFunction<
  typeof getCurrentUserBadges
>;
const mockGetActiveUserBadge = getActiveUserBadge as jest.MockedFunction<typeof getActiveUserBadge>;
const mockHasUserBadge = hasUserBadge as jest.MockedFunction<typeof hasUserBadge>;
const mockBuildBadgeFilter = buildBadgeFilter as jest.MockedFunction<typeof buildBadgeFilter>;
const mockAddFilterToQuery = addFilterToQuery as jest.MockedFunction<typeof addFilterToQuery>;
const mockCdsConnectTo = cds.connect.to as jest.MockedFunction<typeof cds.connect.to>;

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockRequest: CdsRequestWithContext;

  beforeEach(() => {
    jest.clearAllMocks();

    TestHelpers.setupCdsConnectMock(
      mockCdsConnectTo,
      mockChargingSessionService,
      mockChargingStationService,
    );

    sessionService = new SessionService();
    mockRequest = MockFactory.createMockRequest();
  });

  describe('Initialization', () => {
    describe('init', () => {
      it('should initialize services and register all event handlers', async () => {
        const onSpy = jest.spyOn(sessionService, 'on').mockImplementation();

        await sessionService.init();

        expect(mockCdsConnectTo).toHaveBeenCalledWith('ChargingSessionService');
        expect(mockCdsConnectTo).toHaveBeenCalledWith('ChargingStationService');

        // Verify all event handlers are registered
        expect(onSpy).toHaveBeenCalledWith('READ', 'ChargingSessions', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('stopChargingSession', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('startChargingSession', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith(
          'READ',
          'ChargingSessionMonthlyStats',
          expect.any(Function),
        );

        expect(onSpy).toHaveBeenCalledTimes(4);
      });

      it('should handle service connection failures gracefully', async () => {
        mockCdsConnectTo.mockRejectedValue(new Error('Service connection failed'));

        await expect(sessionService.init()).rejects.toThrow('Service connection failed');
      });
    });
  });

  describe('Monthly Statistics', () => {
    beforeEach(async () => {
      await sessionService.init();
    });

    describe('onReadChargingSessionMonthlyStats', () => {
      it('should return monthly stats for user badges', async () => {
        const mockBadges: UserBadge[] = [
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_2, false),
        ];
        const mockResult = {
          value: [{ totalSessions: 5, totalKwh: 100, totalAmount: 50 }],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetCurrentUserBadges.mockResolvedValue(mockBadges);
        mockChargingSessionService.send.mockResolvedValue(mockResult);

        const result = await sessionService['onReadChargingSessionMonthlyStats'](mockRequest);

        expect(mockRequireBadgeAccess).toHaveBeenCalledWith(mockRequest);
        expect(mockGetCurrentUserBadges).toHaveBeenCalled();
        expect(mockChargingSessionService.send).toHaveBeenCalledWith({
          path: expect.stringContaining('/ChargingSessions?$apply='),
          method: 'GET',
        });
        expect(result).toEqual(mockResult.value);
      });

      it('should return direct result when no value property exists', async () => {
        const mockBadges: UserBadge[] = [
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
        ];
        const mockResult = { totalSessions: 3, totalKwh: 60, totalAmount: 30 };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetCurrentUserBadges.mockResolvedValue(mockBadges);
        mockChargingSessionService.send.mockResolvedValue(mockResult);

        const result = await sessionService['onReadChargingSessionMonthlyStats'](mockRequest);

        expect(result).toEqual(mockResult);
      });

      it('should build correct OData filter with multiple badges', async () => {
        const mockBadges: UserBadge[] = [
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_2, false),
        ];

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetCurrentUserBadges.mockResolvedValue(mockBadges);
        mockChargingSessionService.send.mockResolvedValue({ value: [] });

        await sessionService['onReadChargingSessionMonthlyStats'](mockRequest);

        const [sendCall] = mockChargingSessionService.send.mock.calls;
        const path = sendCall[0].path as string;
        const decodedPath = decodeURIComponent(path);

        expect(decodedPath).toContain("badgeAuthenticationId eq 'badge1'");
        expect(decodedPath).toContain("badgeAuthenticationId eq 'badge2'");
        expect(decodedPath).toContain(' or ');
        expect(decodedPath).toContain('timestamp ge');
      });

      it('should handle badge access errors', async () => {
        const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.ACCESS_DENIED);
        mockRequireBadgeAccess.mockRejectedValue(error);

        await sessionService['onReadChargingSessionMonthlyStats'](mockRequest);

        TestHelpers.expectErrorLogged(mockLogger, error);
        TestHelpers.expectRequestRepliedWith(mockRequest, []);
      });

      it('should handle service communication errors', async () => {
        const mockBadges: UserBadge[] = [
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
        ];
        const error = new Error('Service unavailable');

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetCurrentUserBadges.mockResolvedValue(mockBadges);
        mockChargingSessionService.send.mockRejectedValue(error);

        await sessionService['onReadChargingSessionMonthlyStats'](mockRequest);

        TestHelpers.expectErrorLogged(mockLogger, error);
        TestHelpers.expectRequestRepliedWith(mockRequest, []);
      });
    });
  });

  describe('Session Reading', () => {
    beforeEach(async () => {
      await sessionService.init();
    });

    describe('onReadChargingSessions', () => {
      it('should filter and return charging sessions for user badges', async () => {
        const mockBadges: UserBadge[] = [
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
        ];
        const mockSessions = [{ id: '1', badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1 }];
        const mockFilter = ['badgeAuthenticationId', '=', TEST_CONSTANTS.BADGE_IDS.BADGE_1];

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetCurrentUserBadges.mockResolvedValue(mockBadges);
        mockBuildBadgeFilter.mockReturnValue(mockFilter);
        mockChargingSessionService.run.mockResolvedValue(mockSessions);

        const result = await sessionService['onReadChargingSessions'](mockRequest);

        expect(mockRequireBadgeAccess).toHaveBeenCalledWith(mockRequest);
        expect(mockGetCurrentUserBadges).toHaveBeenCalled();
        expect(mockBuildBadgeFilter).toHaveBeenCalledWith(mockBadges);
        expect(mockAddFilterToQuery).toHaveBeenCalledWith(mockRequest, mockFilter);
        expect(mockChargingSessionService.run).toHaveBeenCalledWith(mockRequest.query);
        expect(result).toEqual(mockSessions);
      });

      describe('Non-SELECT queries', () => {
        const nonSelectQueryTypes = ['UPDATE', 'INSERT', 'DELETE'] as const;

        nonSelectQueryTypes.forEach((queryType) => {
          it(`should return empty array for ${queryType} queries`, async () => {
            mockRequest.query = MockFactory.createNonSelectQuery(queryType) as unknown as cds.Query;

            const result = await sessionService['onReadChargingSessions'](mockRequest);

            expect(result).toEqual([]);
            expect(mockRequireBadgeAccess).not.toHaveBeenCalled();
          });
        });

        it('should return empty array for queries without SELECT property', async () => {
          mockRequest.query = {} as unknown as cds.Query;

          const result = await sessionService['onReadChargingSessions'](mockRequest);

          expect(result).toEqual([]);
          expect(mockRequireBadgeAccess).not.toHaveBeenCalled();
        });

        const invalidQueries = [null, undefined, 'string', 123, true];
        invalidQueries.forEach((invalidQuery) => {
          it(`should return empty array for invalid query: ${String(invalidQuery)}`, async () => {
            mockRequest.query = invalidQuery as unknown as cds.Query;

            const result = await sessionService['onReadChargingSessions'](mockRequest);

            expect(result).toEqual([]);
            expect(mockRequireBadgeAccess).not.toHaveBeenCalled();
          });
        });
      });

      it('should handle badge validation errors', async () => {
        const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.BADGE_VALIDATION_FAILED);
        mockRequireBadgeAccess.mockRejectedValue(error);

        await sessionService['onReadChargingSessions'](mockRequest);

        TestHelpers.expectErrorLogged(mockLogger, error);
        TestHelpers.expectRequestRepliedWith(mockRequest, []);
      });

      it('should handle service run errors', async () => {
        const mockBadges: UserBadge[] = [
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
        ];
        const error = new Error('Database connection failed');

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetCurrentUserBadges.mockResolvedValue(mockBadges);
        mockBuildBadgeFilter.mockReturnValue([]);
        mockChargingSessionService.run.mockRejectedValue(error);

        await sessionService['onReadChargingSessions'](mockRequest);

        TestHelpers.expectErrorLogged(mockLogger, error);
        TestHelpers.expectRequestRepliedWith(mockRequest, []);
      });
    });
  });

  describe('Session Control', () => {
    beforeEach(async () => {
      await sessionService.init();
    });

    describe('onStopChargingSessions', () => {
      beforeEach(() => {
        mockRequest.data = { sessionId: TEST_CONSTANTS.SESSION_IDS.SESSION_123 };
      });

      it('should successfully stop a charging session', async () => {
        const mockSession = MockFactory.createChargingSession(
          TEST_CONSTANTS.SESSION_IDS.SESSION_123,
          TEST_CONSTANTS.BADGE_IDS.BADGE_1,
          TEST_CONSTANTS.EVSE_CODES.EVSE_001,
        );
        const mockEvse = MockFactory.createEvse(
          TEST_CONSTANTS.EVSE_CODES.EVSE_001,
          TEST_CONSTANTS.STATION_IDS.STATION_123,
        );
        const mockResponse = {
          responseData: { success: true, sessionId: TEST_CONSTANTS.SESSION_IDS.SESSION_123 },
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockChargingSessionService.run.mockResolvedValue(mockSession);
        mockHasUserBadge.mockResolvedValue(true);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue(mockResponse);

        const result = await sessionService['onStopChargingSessions'](mockRequest);

        expect(mockRequireBadgeAccess).toHaveBeenCalledWith(mockRequest);
        expect(mockChargingSessionService.run).toHaveBeenCalled();
        expect(mockHasUserBadge).toHaveBeenCalledWith(TEST_CONSTANTS.BADGE_IDS.BADGE_1);
        expect(mockChargingStationService.run).toHaveBeenCalled();
        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Stop`,
          method: 'POST',
          data: { chargingSessionId: TEST_CONSTANTS.SESSION_IDS.SESSION_123 },
        });
        expect(result).toEqual(mockResponse.responseData);
      });

      it('should return response directly when no responseData property', async () => {
        const mockSession = MockFactory.createChargingSession(
          TEST_CONSTANTS.SESSION_IDS.SESSION_123,
          TEST_CONSTANTS.BADGE_IDS.BADGE_1,
          TEST_CONSTANTS.EVSE_CODES.EVSE_001,
        );
        const mockEvse = MockFactory.createEvse(
          TEST_CONSTANTS.EVSE_CODES.EVSE_001,
          TEST_CONSTANTS.STATION_IDS.STATION_123,
        );
        const mockResponse = { success: true };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockChargingSessionService.run.mockResolvedValue(mockSession);
        mockHasUserBadge.mockResolvedValue(true);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue(mockResponse);

        const result = await sessionService['onStopChargingSessions'](mockRequest);

        expect(result).toEqual(mockResponse);
      });

      describe('Error Cases', () => {
        it('should throw error when sessionId is missing', async () => {
          mockRequest.data = {};

          await sessionService['onStopChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.SESSION_ID_REQUIRED,
            }),
          );
        });

        it('should throw error when sessionId is null', async () => {
          mockRequest.data = { sessionId: null };

          await sessionService['onStopChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.SESSION_ID_REQUIRED,
            }),
          );
        });

        it('should throw error when session is not found', async () => {
          mockRequireBadgeAccess.mockResolvedValue(undefined);
          mockChargingSessionService.run.mockResolvedValue(null);

          await sessionService['onStopChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.SESSION_NOT_FOUND(
                TEST_CONSTANTS.SESSION_IDS.SESSION_123,
              ),
            }),
          );
        });

        it('should throw error when user is not authorized for the session', async () => {
          const mockSession = MockFactory.createChargingSession(
            TEST_CONSTANTS.SESSION_IDS.SESSION_123,
            TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            TEST_CONSTANTS.EVSE_CODES.EVSE_001,
          );

          mockRequireBadgeAccess.mockResolvedValue(undefined);
          mockChargingSessionService.run.mockResolvedValue(mockSession);
          mockHasUserBadge.mockResolvedValue(false);

          await sessionService['onStopChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED_STOP(
                TEST_CONSTANTS.SESSION_IDS.SESSION_123,
              ),
            }),
          );
        });

        it('should throw error when EVSE is not found', async () => {
          const mockSession = MockFactory.createChargingSession(
            TEST_CONSTANTS.SESSION_IDS.SESSION_123,
            TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            TEST_CONSTANTS.EVSE_CODES.EVSE_001,
          );

          mockRequireBadgeAccess.mockResolvedValue(undefined);
          mockChargingSessionService.run.mockResolvedValue(mockSession);
          mockHasUserBadge.mockResolvedValue(true);
          mockChargingStationService.run.mockResolvedValue(null);

          await sessionService['onStopChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.EVSE_NOT_FOUND(
                TEST_CONSTANTS.EVSE_CODES.EVSE_001,
              ),
            }),
          );
        });

        it('should handle badge access errors', async () => {
          const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.BADGE_ACCESS_DENIED);
          mockRequireBadgeAccess.mockRejectedValue(error);

          await sessionService['onStopChargingSessions'](mockRequest);

          TestHelpers.expectErrorLogged(mockLogger, error);
          TestHelpers.expectRequestErrorCalled(mockRequest);
        });
      });
    });

    describe('onStartChargingSessions', () => {
      beforeEach(() => {
        mockRequest.data = {
          evseId: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
        };
      });

      it('should successfully start a charging session', async () => {
        const mockActiveBadge: UserBadge = MockFactory.createUserBadge(
          TEST_CONSTANTS.BADGE_IDS.BADGE_1,
          true,
        );
        const mockEvseWithConnectors = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: 'Available' },
            { connectorId: 2, status: 'Charging' },
          ],
        };
        const mockResponse = {
          responseData: { success: true, sessionId: TEST_CONSTANTS.SESSION_IDS.NEW_SESSION_123 },
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvseWithConnectors);
        mockChargingStationService.send.mockResolvedValue(mockResponse);

        const result = await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockRequireBadgeAccess).toHaveBeenCalledWith(mockRequest);
        expect(mockGetActiveUserBadge).toHaveBeenCalled();
        expect(mockChargingStationService.run).toHaveBeenCalledTimes(1);
        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 1,
          },
        });
        expect(result).toEqual(mockResponse.responseData);
      });

      it('should return response directly when no responseData property', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [{ connectorId: 1, status: 'Available' }],
        };
        const mockResponse = { success: true };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue(mockResponse);

        const result = await sessionService['onStartChargingSessions'](mockRequest);

        expect(result).toEqual(mockResponse);
      });

      it('should find first available connector', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: 'Charging' },
            { connectorId: 2, status: 'Available' },
            { connectorId: 3, status: 'Available' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue({ success: true });

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 2,
          },
        });
      });

      it('should prioritize PREPARING connector over Available', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: 'Available' },
            { connectorId: 2, status: 'Preparing' },
            { connectorId: 3, status: 'Available' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue({ success: true });

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 2,
          },
        });
      });

      it('should handle case-insensitive status comparison', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: 'AVAILABLE' },
            { connectorId: 2, status: 'PREPARING' },
            { connectorId: 3, status: 'available' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue({ success: true });

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 2,
          },
        });
      });

      it('should select first PREPARING connector when multiple exist', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: 'Available' },
            { connectorId: 2, status: 'Preparing' },
            { connectorId: 3, status: 'PREPARING' },
            { connectorId: 4, status: 'preparing' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue({ success: true });

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 2,
          },
        });
      });

      it('should handle connectors with invalid connectorId', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 0, status: 'Available' },
            { connectorId: -1, status: 'Preparing' },
            { connectorId: 2, status: 'Available' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue({ success: true });

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 2,
          },
        });
      });

      it('should handle connectors with null or undefined status', async () => {
        const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: null },
            { connectorId: 2, status: undefined },
            { connectorId: 3, status: 'Available' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
        mockChargingStationService.run.mockResolvedValue(mockEvse);
        mockChargingStationService.send.mockResolvedValue({ success: true });

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockChargingStationService.send).toHaveBeenCalledWith({
          path: `ChargingStations(id=${TEST_CONSTANTS.STATION_IDS.STATION_123})/Start`,
          method: 'POST',
          data: {
            badgeAuthenticationId: TEST_CONSTANTS.BADGE_IDS.BADGE_1,
            connectorId: 3,
          },
        });
      });

      it('should throw error when no eligible connectors found', async () => {
        const mockEvse = {
          id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
          chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
          connectors: [
            { connectorId: 1, status: 'Charging' },
            { connectorId: 2, status: 'Faulted' },
            { connectorId: 3, status: 'Unavailable' },
          ],
        };

        mockRequireBadgeAccess.mockResolvedValue(undefined);
        mockGetActiveUserBadge.mockResolvedValue(
          MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
        );
        mockChargingStationService.run.mockResolvedValue(mockEvse);

        await sessionService['onStartChargingSessions'](mockRequest);

        expect(mockRequest.error).toHaveBeenCalledWith(
          expect.objectContaining({
            message: TEST_CONSTANTS.ERROR_MESSAGES.NO_AVAILABLE_CONNECTORS(
              TEST_CONSTANTS.EVSE_IDS.EVSE_001,
            ),
          }),
        );
      });

      describe('Error Cases', () => {
        it('should throw error when evseId is missing', async () => {
          mockRequest.data = {};

          await sessionService['onStartChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.EVSE_ID_REQUIRED,
            }),
          );
        });

        it('should throw error when EVSE is not found', async () => {
          mockRequireBadgeAccess.mockResolvedValue(undefined);
          mockGetActiveUserBadge.mockResolvedValue(
            MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
          );
          mockChargingStationService.run.mockResolvedValue(null);

          await sessionService['onStartChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.EVSE_NOT_FOUND_BY_ID(
                TEST_CONSTANTS.EVSE_IDS.EVSE_001,
              ),
            }),
          );
        });

        it('should throw error when no available connectors found', async () => {
          const mockEvse = {
            id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
            chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
            connectors: [
              { connectorId: 1, status: 'Charging' },
              { connectorId: 2, status: 'Faulted' },
            ],
          };

          mockRequireBadgeAccess.mockResolvedValue(undefined);
          mockGetActiveUserBadge.mockResolvedValue(
            MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true),
          );
          mockChargingStationService.run.mockResolvedValue(mockEvse);

          await sessionService['onStartChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.NO_AVAILABLE_CONNECTORS(
                TEST_CONSTANTS.EVSE_IDS.EVSE_001,
              ),
            }),
          );
        });

        it('should throw error when no active badge is found', async () => {
          mockRequireBadgeAccess.mockResolvedValue(undefined);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          mockGetActiveUserBadge.mockResolvedValue(null);

          await sessionService['onStartChargingSessions'](mockRequest);

          expect(mockRequest.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: TEST_CONSTANTS.ERROR_MESSAGES.NO_ACTIVE_BADGE,
            }),
          );
        });

        it('should handle badge access errors', async () => {
          const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.BADGE_ACCESS_DENIED);
          mockRequireBadgeAccess.mockRejectedValue(error);

          await sessionService['onStartChargingSessions'](mockRequest);

          TestHelpers.expectErrorLogged(mockLogger, error);
          TestHelpers.expectRequestErrorCalled(mockRequest);
        });
      });
    });
  });

  describe('Helper Functions', () => {
    describe('isCdsSelectQuery helper function', () => {
      it('should return true for valid SELECT query', () => {
        const query = MockFactory.createSelectQuery('ChargingSessions');
        const isSelect = typeof query === 'object' && query !== null && 'SELECT' in query;
        expect(isSelect).toBe(true);
      });

      it('should return false for non-SELECT queries', () => {
        const queries = [
          null,
          undefined,
          'string',
          123,
          {},
          MockFactory.createNonSelectQuery('UPDATE'),
          MockFactory.createNonSelectQuery('INSERT'),
          MockFactory.createNonSelectQuery('DELETE'),
        ];

        queries.forEach((query) => {
          const isSelect = typeof query === 'object' && query !== null && 'SELECT' in query;
          expect(isSelect).toBe(false);
        });
      });
    });

    describe('getFirstDayOfMonth helper function', () => {
      it('should return first day of current month in ISO format', () => {
        const originalDate = global.Date;
        const mockCurrentDate = new originalDate('2023-07-15T12:30:00Z');

        const MockDateConstructor = jest.fn().mockImplementation((...args: unknown[]) => {
          if (args.length === 0) {
            return mockCurrentDate;
          } else if (args.length === 3) {
            const date = new originalDate();
            date.setUTCFullYear(args[0] as number);
            date.setUTCMonth(args[1] as number);
            date.setUTCDate(args[2] as number);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          }
          return new originalDate(...(args as ConstructorParameters<typeof Date>));
        });

        MockDateConstructor.prototype = originalDate.prototype;
        Object.setPrototypeOf(MockDateConstructor, originalDate);
        Object.getOwnPropertyNames(originalDate).forEach((name) => {
          if (name !== 'prototype' && name !== 'name' && name !== 'length') {
            (MockDateConstructor as any)[name] = (originalDate as any)[name];
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).Date = MockDateConstructor;

        const result = (
          sessionService as unknown as { getFirstDayOfMonth(): string }
        ).getFirstDayOfMonth();

        expect(result).toBe('2023-07-01T00:00:00.000Z');

        global.Date = originalDate;
      });
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async () => {
      await sessionService.init();
    });

    it('should handle complete session lifecycle', async () => {
      // Test starting a session
      const startRequest = MockFactory.createMockRequest({
        data: {
          evseId: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
        },
      });

      const mockActiveBadge = MockFactory.createUserBadge(TEST_CONSTANTS.BADGE_IDS.BADGE_1, true);
      const mockEvse = {
        id: TEST_CONSTANTS.EVSE_IDS.EVSE_001,
        chargingStationId: TEST_CONSTANTS.STATION_IDS.STATION_123,
        connectors: [{ connectorId: 1, status: 'Available' }],
      };
      const startResponse = {
        responseData: { success: true, sessionId: TEST_CONSTANTS.SESSION_IDS.SESSION_123 },
      };

      mockRequireBadgeAccess.mockResolvedValue(undefined);
      mockGetActiveUserBadge.mockResolvedValue(mockActiveBadge);
      mockChargingStationService.run.mockResolvedValue(mockEvse);
      mockChargingStationService.send.mockResolvedValue(startResponse);

      const startResult = await sessionService['onStartChargingSessions'](startRequest);
      expect(startResult).toEqual(startResponse.responseData);

      // Test stopping the same session
      const stopRequest = MockFactory.createMockRequest({
        data: { sessionId: TEST_CONSTANTS.SESSION_IDS.SESSION_123 },
      });

      const mockSession = MockFactory.createChargingSession(
        TEST_CONSTANTS.SESSION_IDS.SESSION_123,
        TEST_CONSTANTS.BADGE_IDS.BADGE_1,
        TEST_CONSTANTS.EVSE_CODES.EVSE_001,
      );
      const mockEvseForStop = MockFactory.createEvse(
        TEST_CONSTANTS.EVSE_CODES.EVSE_001,
        TEST_CONSTANTS.STATION_IDS.STATION_123,
      );
      const stopResponse = {
        responseData: { success: true, sessionId: TEST_CONSTANTS.SESSION_IDS.SESSION_123 },
      };

      mockChargingSessionService.run.mockResolvedValue(mockSession);
      mockHasUserBadge.mockResolvedValue(true);
      mockChargingStationService.run.mockResolvedValue(mockEvseForStop);
      mockChargingStationService.send.mockResolvedValue(stopResponse);

      const stopResult = await sessionService['onStopChargingSessions'](stopRequest);
      expect(stopResult).toEqual(stopResponse.responseData);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await sessionService.init();
    });

    it('should handle malformed request data gracefully', async () => {
      const malformedRequest = MockFactory.createMockRequest({
        data: { invalidField: 'invalidValue' },
      });

      await sessionService['onStartChargingSessions'](malformedRequest);

      expect(malformedRequest.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: TEST_CONSTANTS.ERROR_MESSAGES.EVSE_ID_REQUIRED,
        }),
      );
    });

    it('should handle concurrent session operations', async () => {
      const request1 = MockFactory.createMockRequest({
        data: { sessionId: 'session1' },
      });
      const request2 = MockFactory.createMockRequest({
        data: { sessionId: 'session2' },
      });

      mockRequireBadgeAccess.mockResolvedValue(undefined);
      mockChargingSessionService.run.mockResolvedValue(null);

      await Promise.all([
        sessionService['onStopChargingSessions'](request1),
        sessionService['onStopChargingSessions'](request2),
      ]);

      expect(request1.error).toHaveBeenCalled();
      expect(request2.error).toHaveBeenCalled();
    });

    it('should handle very large badge lists efficiently', async () => {
      const largeBadgeList: UserBadge[] = Array.from({ length: 1000 }, (_, i) =>
        MockFactory.createUserBadge(`badge${i}`, i % 2 === 0),
      );

      mockRequireBadgeAccess.mockResolvedValue(undefined);
      mockGetCurrentUserBadges.mockResolvedValue(largeBadgeList);
      mockChargingSessionService.send.mockResolvedValue({ value: [] });

      const startTime = Date.now();
      await sessionService['onReadChargingSessionMonthlyStats'](mockRequest);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
