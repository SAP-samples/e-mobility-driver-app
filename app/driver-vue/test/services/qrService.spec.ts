// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import useAuthFetch from '@/composables/useAuthFetch';
import {
  type QRDecryptionResult,
  QRService,
  type QRServiceError,
  useQRService,
} from '@/services/qrService';

// Mock useAuthFetch
vi.mock('@/composables/useAuthFetch', () => ({
  default: vi.fn(),
}));

describe('QRService', () => {
  let qrService: QRService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance for each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (QRService as any).instance = undefined;
    qrService = QRService.getInstance();
    mockFetch = vi.mocked(useAuthFetch);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = QRService.getInstance();
      const instance2 = QRService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(qrService);
    });
  });

  describe('decryptQRData', () => {
    const mockEncryptedData = 'encrypted-qr-data';
    const mockDecryptionResult: QRDecryptionResult = {
      evseId: 'evse-uuid-123',
    };

    it('should successfully decrypt QR data', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockDecryptionResult),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await qrService.decryptQRData(mockEncryptedData);

      expect(mockFetch).toHaveBeenCalledWith('/rest/qr/decryptQRData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData: mockEncryptedData }),
      });
      expect(result).toEqual(mockDecryptionResult);
    });

    it('should handle server error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toMatchObject({
        code: 'DECRYPTION_FAILED',
        message: 'Server returned 400: Bad Request',
      });
    });

    it('should handle invalid response format - missing evseId', async () => {
      const invalidResponse = {
        // missing evseId
      };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(invalidResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toMatchObject({
        code: 'INVALID_QR',
        message: 'Invalid response format from decryption service',
      });
    });

    it('should handle invalid response format - invalid evseId type', async () => {
      const invalidResponse = {
        evseId: 123, // should be string
      };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(invalidResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toMatchObject({
        code: 'INVALID_QR',
        message: 'Invalid response format from decryption service',
      });
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('fetch failed');
      mockFetch.mockRejectedValue(networkError);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to QR decryption service. Please check your connection.',
        originalError: networkError,
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockFetch.mockRejectedValue(genericError);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: 'Unexpected error during QR decryption: Something went wrong',
        originalError: genericError,
      });
    });

    it('should handle non-Error objects', async () => {
      const nonErrorObject = 'string error';
      mockFetch.mockRejectedValue(nonErrorObject);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: 'Unexpected error during QR decryption: Unknown error',
        originalError: undefined,
      });
    });

    it('should re-throw QRServiceError as-is', async () => {
      const qrServiceError = new Error('Custom QR error') as Error & QRServiceError;
      qrServiceError.code = 'INVALID_QR';
      mockFetch.mockRejectedValue(qrServiceError);

      await expect(qrService.decryptQRData(mockEncryptedData)).rejects.toBe(qrServiceError);
    });
  });

  describe('testConnection', () => {
    it('should return true when ping is successful', async () => {
      const mockResponse = {
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await qrService.testConnection();

      expect(mockFetch).toHaveBeenCalledWith('/rest/qr/ping', {
        method: 'POST',
      });
      expect(result).toBe(true);
    });

    it('should return false when ping fails', async () => {
      const mockResponse = {
        ok: false,
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await qrService.testConnection();

      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await qrService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('createQRServiceError (private method)', () => {
    it('should create error with all properties', () => {
      const originalError = new Error('Original error');

      // Access private method through any cast for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (qrService as any).createQRServiceError(
        'NETWORK_ERROR',
        'Test message',
        originalError,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.originalError).toBe(originalError);
    });

    it('should create error without original error', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (qrService as any).createQRServiceError('INVALID_QR', 'Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('INVALID_QR');
      expect(error.message).toBe('Test message');
      expect(error.originalError).toBeUndefined();
    });
  });
});

describe('useQRService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance for each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (QRService as any).instance = undefined;
    mockFetch = vi.mocked(useAuthFetch);
  });

  it('should return bound methods from QRService instance', () => {
    const { decryptQRData, testConnection } = useQRService();

    expect(typeof decryptQRData).toBe('function');
    expect(typeof testConnection).toBe('function');
  });

  it('should use the same QRService instance', () => {
    const service1 = useQRService();
    const service2 = useQRService();

    // Both should use the same singleton instance
    expect(service1.decryptQRData.toString()).toBe(service2.decryptQRData.toString());
  });

  it('should properly bind methods to the service instance', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        evseId: 'evse-uuid-123',
      }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const { decryptQRData } = useQRService();
    const result = await decryptQRData('test-data');

    expect(result).toEqual({
      evseId: 'evse-uuid-123',
    });
    expect(mockFetch).toHaveBeenCalledWith('/rest/qr/decryptQRData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encryptedData: 'test-data' }),
    });
  });
});
