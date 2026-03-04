// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQRScanner } from '@/composables/useQRScanner';

// Create persistent mocks that will be shared across all tests
const mockDecryptQRData = vi.fn();
const mockTestConnection = vi.fn();

// Mock the qrService module with persistent functions
vi.mock('@/services/qrService', () => ({
  useQRService: () => ({
    decryptQRData: mockDecryptQRData,
    testConnection: mockTestConnection,
  }),
}));

describe('useQRScanner', () => {
  beforeEach(() => {
    // Reset all mocks to clear previous test state
    vi.clearAllMocks();
    mockDecryptQRData.mockReset();
    mockTestConnection.mockReset();
  });

  describe('parseQRData', () => {
    it('throws error for unsupported JSON format', async () => {
      const { parseQRData } = useQRScanner();
      const jsonData = '{"evseId":"evse-uuid-001"}';

      await expect(parseQRData(jsonData)).rejects.toThrow('INVALID_FORMAT');
    });

    it('throws error for invalid format', async () => {
      const { parseQRData } = useQRScanner();
      const invalidData = 'not-a-supported-format';

      await expect(parseQRData(invalidData)).rejects.toThrow('INVALID_FORMAT');
    });

    it('parses encrypted QR URL format', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=encrypted-data-here';

      // Mock the decryption service
      mockDecryptQRData.mockResolvedValue({
        evseId: 'evse-uuid-002',
      });

      const result = await parseQRData(encryptedUrl);

      expect(result).toEqual({
        evseId: 'evse-uuid-002',
      });
      expect(mockDecryptQRData).toHaveBeenCalledWith('encrypted-data-here');
    });

    it('parses plain URL format', async () => {
      const { parseQRData } = useQRScanner();
      const plainUrl = 'emobility://start-session?evse=evse-uuid-003';

      const result = await parseQRData(plainUrl);

      expect(result).toEqual({
        evseId: 'evse-uuid-003',
      });
    });

    it('throws error for encrypted URL without data parameter', async () => {
      const { parseQRData } = useQRScanner();
      const invalidUrl = 'emobility://decrypt?invalid=true';

      // This URL doesn't start with 'emobility://decrypt?data=' so it goes to JSON parsing
      await expect(parseQRData(invalidUrl)).rejects.toThrow('INVALID_FORMAT');
    });

    it('handles decryption service errors', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=invalid-data';

      // Mock decryption service error
      const serviceError = new Error('Decryption failed') as any;
      serviceError.code = 'DECRYPTION_FAILED';
      mockDecryptQRData.mockRejectedValue(serviceError);

      await expect(parseQRData(encryptedUrl)).rejects.toThrow('DECRYPTION_FAILED');
    });
  });

  describe('validateQRData', () => {
    it('validates correct QR data structure', () => {
      const { validateQRData } = useQRScanner();
      const validData = {
        evseId: 'evse-uuid-001',
      };

      expect(validateQRData(validData)).toBe(true);
    });

    it('rejects data without evseId', () => {
      const { validateQRData } = useQRScanner();
      const invalidData = { someOtherField: 'value' };

      expect(validateQRData(invalidData)).toBe(false);
    });

    it('rejects data without evseId', () => {
      const { validateQRData } = useQRScanner();
      const invalidData = {};

      expect(validateQRData(invalidData)).toBe(false);
    });

    it('rejects data with invalid evseId type', () => {
      const { validateQRData } = useQRScanner();
      const invalidData = { evseId: 123 };

      expect(validateQRData(invalidData)).toBe(false);
    });

    it('rejects data with invalid evseId type', () => {
      const { validateQRData } = useQRScanner();
      const invalidData = { evseId: null };

      expect(validateQRData(invalidData)).toBe(false);
    });

    it('rejects null or undefined data', () => {
      const { validateQRData } = useQRScanner();

      expect(validateQRData(null)).toBe(false);
      expect(validateQRData(undefined)).toBe(false);
    });

    it('rejects empty evseId', () => {
      const { validateQRData } = useQRScanner();
      const invalidData = { evseId: '' };

      expect(validateQRData(invalidData)).toBe(false);
    });

    it('rejects data with only whitespace evseId', () => {
      const { validateQRData } = useQRScanner();
      const invalidData = { evseId: '   ' };

      expect(validateQRData(invalidData)).toBe(false);
    });
  });

  describe('handleScanResult', () => {
    it('calls success callback with parsed data for valid encrypted QR code', async () => {
      const { handleScanResult } = useQRScanner();
      const successCallback = vi.fn();
      const errorCallback = vi.fn();
      const validQRCode = 'emobility://decrypt?data=encrypted-data';

      // Mock successful decryption
      mockDecryptQRData.mockResolvedValue({
        evseId: 'evse-uuid-001',
      });

      await handleScanResult(validQRCode, successCallback, errorCallback);

      expect(successCallback).toHaveBeenCalledWith({
        evseId: 'evse-uuid-001',
      });
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('calls error callback for invalid QR code', async () => {
      const { handleScanResult } = useQRScanner();
      const successCallback = vi.fn();
      const errorCallback = vi.fn();
      const invalidQRCode = 'invalid-qr-code';

      await handleScanResult(invalidQRCode, successCallback, errorCallback);

      expect(successCallback).not.toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalledWith('INVALID_FORMAT');
    });

    it('updates lastScannedData on successful scan', async () => {
      const { handleScanResult, lastScannedData } = useQRScanner();
      const successCallback = vi.fn();
      const errorCallback = vi.fn();
      const validQRCode = 'emobility://start-session?evse=evse-uuid-001';

      await handleScanResult(validQRCode, successCallback, errorCallback);

      expect(lastScannedData.value).toEqual({
        evseId: 'evse-uuid-001',
      });
    });

    it('clears error on successful scan', async () => {
      const { handleScanResult, error, handleScanError } = useQRScanner();
      const successCallback = vi.fn();
      const errorCallback = vi.fn();

      // First set an error
      handleScanError('Previous error', errorCallback);
      expect(error.value).toBe('Previous error');

      // Then scan successfully
      const validQRCode = 'emobility://start-session?evse=evse-uuid-001';
      await handleScanResult(validQRCode, successCallback, errorCallback);

      expect(error.value).toBe(null);
    });

    it('handles encrypted QR codes', async () => {
      const { handleScanResult } = useQRScanner();
      const successCallback = vi.fn();
      const errorCallback = vi.fn();
      const encryptedQRCode = 'emobility://decrypt?data=encrypted-data';

      // Mock successful decryption
      mockDecryptQRData.mockResolvedValue({
        evseId: 'evse-uuid-encrypted',
      });

      await handleScanResult(encryptedQRCode, successCallback, errorCallback);

      expect(successCallback).toHaveBeenCalledWith({
        evseId: 'evse-uuid-encrypted',
      });
      expect(errorCallback).not.toHaveBeenCalled();
    });
  });

  describe('handleScanError', () => {
    it('sets error message and calls error callback', () => {
      const { handleScanError, error } = useQRScanner();
      const errorCallback = vi.fn();
      const errorMessage = 'Camera access denied';

      handleScanError(errorMessage, errorCallback);

      expect(error.value).toBe(errorMessage);
      expect(errorCallback).toHaveBeenCalledWith(errorMessage);
    });

    it('does not clear lastScannedData on error', async () => {
      const { handleScanError, lastScannedData, handleScanResult } = useQRScanner();
      const errorCallback = vi.fn();

      // First set some scanned data
      await handleScanResult('emobility://start-session?evse=evse-uuid-001', vi.fn(), vi.fn());
      expect(lastScannedData.value).not.toBe(null);

      // Then trigger an error
      handleScanError('Scan failed', errorCallback);

      // lastScannedData should remain unchanged
      expect(lastScannedData.value).toEqual({
        evseId: 'evse-uuid-001',
      });
    });
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      const { clearError, error, handleScanError } = useQRScanner();

      // First set an error
      handleScanError('Some error', vi.fn());
      expect(error.value).toBe('Some error');

      // Then clear it
      clearError();

      expect(error.value).toBe(null);
    });
  });

  describe('reactive state', () => {
    it('initializes with correct default values', () => {
      const { isScanning, error, lastScannedData, isDecrypting } = useQRScanner();

      expect(isScanning.value).toBe(false);
      expect(error.value).toBe(null);
      expect(lastScannedData.value).toBe(null);
      expect(isDecrypting.value).toBe(false);
    });

    it('updates isDecrypting state during encrypted scan operations', async () => {
      const { parseQRData, isDecrypting } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=test-data';

      // Mock a delayed decryption process
      let resolveDecryption: (value: { evseId: string }) => void;
      const decryptionPromise = new Promise<{ evseId: string }>((resolve) => {
        resolveDecryption = resolve;
      });
      mockDecryptQRData.mockReturnValue(decryptionPromise);

      // Start parsing (don't await yet)
      const parsePromise = parseQRData(encryptedUrl);

      // Allow microtasks to run so isDecrypting gets set
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check that isDecrypting is true during the process
      expect(isDecrypting.value).toBe(true);

      // Complete the decryption
      resolveDecryption!({
        evseId: 'evse-uuid-test',
      });

      // Wait for parsing to complete
      await parsePromise;

      // Check that isDecrypting is reset to false
      expect(isDecrypting.value).toBe(false);
    });
  });

  describe('URL parsing edge cases', () => {
    it('handles plain URL with missing evse parameter', async () => {
      const { parseQRData } = useQRScanner();
      const incompleteUrl = 'emobility://start-session?other=value';

      await expect(parseQRData(incompleteUrl)).rejects.toThrow('MISSING_PARAMETERS');
    });

    it('handles malformed URLs gracefully', async () => {
      const { parseQRData } = useQRScanner();
      const malformedUrl = 'emobility://start-session?invalid-format';

      await expect(parseQRData(malformedUrl)).rejects.toThrow('MISSING_PARAMETERS');
    });
  });

  describe('service error handling', () => {
    it('handles network errors from decryption service', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=test-data';

      const networkError = new Error('Network failed') as any;
      networkError.code = 'NETWORK_ERROR';
      mockDecryptQRData.mockRejectedValue(networkError);

      await expect(parseQRData(encryptedUrl)).rejects.toThrow('NETWORK_ERROR');
    });

    it('handles invalid QR errors from decryption service', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=test-data';

      const invalidQRError = new Error('Invalid QR') as any;
      invalidQRError.code = 'INVALID_QR';
      mockDecryptQRData.mockRejectedValue(invalidQRError);

      await expect(parseQRData(encryptedUrl)).rejects.toThrow('INVALID_QR');
    });

    it('handles server errors from decryption service', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=test-data';

      const serverError = new Error('Server error') as any;
      serverError.code = 'SERVER_ERROR';
      mockDecryptQRData.mockRejectedValue(serverError);

      await expect(parseQRData(encryptedUrl)).rejects.toThrow('SERVER_ERROR');
    });

    it('handles unknown errors from decryption service', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=test-data';

      const unknownError = new Error('Unknown error') as any;
      unknownError.code = 'UNKNOWN_ERROR';
      mockDecryptQRData.mockRejectedValue(unknownError);

      await expect(parseQRData(encryptedUrl)).rejects.toThrow('GENERIC_DECRYPT');
    });

    it('handles generic errors from decryption service', async () => {
      const { parseQRData } = useQRScanner();
      const encryptedUrl = 'emobility://decrypt?data=test-data';

      const genericError = new Error('Something went wrong');
      mockDecryptQRData.mockRejectedValue(genericError);

      await expect(parseQRData(encryptedUrl)).rejects.toThrow('INVALID_FORMAT');
    });
  });
});
