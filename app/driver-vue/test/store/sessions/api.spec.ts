// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionApi } from '@/store/sessions/api';
import type { MonthlyStats, StartSessionRequest, StopSessionRequest } from '@/store/sessions/types';
import { odataFetch } from '@/utils/odata/odataFetch';

// Mock the dependencies
vi.mock('@/utils/odata/odataFetch', () => ({
  odataFetch: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Type the mocked functions
const mockOdataFetch = vi.mocked(odataFetch);

// Test data
const mockMonthlyStats: MonthlyStats = {
  totalSessions: 15,
  totalKwh: 250.5,
  totalAmount: 125.25,
};

describe('SessionApi', () => {
  let sessionApi: SessionApi;
  const baseUrl = 'http://localhost:3000/odata/v4/session/';

  beforeEach(() => {
    vi.clearAllMocks();
    sessionApi = new SessionApi(baseUrl);
  });

  describe('Entity configuration', () => {
    it('should return correct entity name', () => {
      expect(sessionApi.getEntityName()).toBe('ChargingSessions');
    });

    it('should return empty expand fields', () => {
      expect(sessionApi.getExpandFields()).toEqual([]);
    });
  });

  describe('startSession', () => {
    it('should successfully start a session', async () => {
      // Arrange
      const request: StartSessionRequest = {
        chargingStationId: 'CS-001',
        connectorId: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
      } as Response);

      // Act
      await sessionApi.startSession(request);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}startChargingSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    });

    it('should throw error when start session fails', async () => {
      // Arrange
      const request: StartSessionRequest = {
        chargingStationId: 'CS-001',
        connectorId: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as Response);

      // Act & Assert
      await expect(sessionApi.startSession(request)).rejects.toThrow(
        'Failed to start session: Bad Request',
      );
    });
  });

  describe('stopSession', () => {
    it('should successfully stop a session', async () => {
      // Arrange
      const request: StopSessionRequest = {
        sessionId: 'SES-001',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
      } as Response);

      // Act
      await sessionApi.stopSession(request);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}stopChargingSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    });

    it('should throw error when stop session fails', async () => {
      // Arrange
      const request: StopSessionRequest = {
        sessionId: 'SES-001',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      // Act & Assert
      await expect(sessionApi.stopSession(request)).rejects.toThrow(
        'Failed to stop session: Internal Server Error',
      );
    });
  });

  describe('fetchMonthlyStats', () => {
    it('should fetch monthly stats successfully', async () => {
      // Arrange
      mockOdataFetch.mockResolvedValueOnce({
        value: [mockMonthlyStats],
      });

      // Act
      const result = await sessionApi.fetchMonthlyStats();

      // Assert
      expect(mockOdataFetch).toHaveBeenCalledWith({
        baseUrl,
        entity: 'ChargingSessionMonthlyStats',
      });
      expect(result).toEqual(mockMonthlyStats);
    });

    it('should handle empty stats result', async () => {
      // Arrange
      mockOdataFetch.mockResolvedValueOnce({
        value: [],
      });

      // Act
      const result = await sessionApi.fetchMonthlyStats();

      // Assert
      expect(result).toEqual({
        totalSessions: 0,
        totalKwh: 0,
        totalAmount: 0,
      });
    });

    it('should handle partial stats data', async () => {
      // Arrange
      const partialStats = {
        totalSessions: 10,
        // missing totalKwh and totalAmount
      };
      mockOdataFetch.mockResolvedValueOnce({
        value: [partialStats],
      });

      // Act
      const result = await sessionApi.fetchMonthlyStats();

      // Assert
      expect(result).toEqual({
        totalSessions: 10,
        totalKwh: 0,
        totalAmount: 0,
      });
    });

    it('should handle non-array result', async () => {
      // Arrange
      mockOdataFetch.mockResolvedValueOnce({
        value: {} as unknown[],
      });

      // Act
      const result = await sessionApi.fetchMonthlyStats();

      // Assert
      expect(result).toEqual({
        totalSessions: 0,
        totalKwh: 0,
        totalAmount: 0,
      });
    });
  });
});
