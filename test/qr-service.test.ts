// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds from '@sap/cds';

// Mock the QREncryptionService
const mockQREncryptionService = {
  getInstance: jest.fn(),
  decryptQRData: jest.fn(),
  isValidQRFormat: jest.fn(),
};

jest.mock('../srv/utils/qr-encryption-service', () => ({
  QREncryptionService: mockQREncryptionService,
}));

// Mock CDS framework
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@sap/cds', () => ({
  log: jest.fn(() => mockLogger),
  ApplicationService: class MockApplicationService {
    on = jest.fn();
    async init() {
      return Promise.resolve();
    }
  },
  Service: class MockService {
    on = jest.fn();
  },
}));

// Import the service after mocking
import QRService from '../srv/qr-service';

describe('QR Service - Unit Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let qrService: any;

  const testQRData = 'encrypted-qr-data-base64';
  const testDecryptedData = {
    evseId: 'evse-uuid-001',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mocks
    mockQREncryptionService.getInstance.mockReturnValue({
      decryptQRData: mockQREncryptionService.decryptQRData,
      isValidQRFormat: mockQREncryptionService.isValidQRFormat,
    });

    qrService = new QRService();
    await qrService.init();
  });

  describe('Service Initialization', () => {
    it('should properly initialize QR service', () => {
      expect(qrService).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('QR Service initialized');
    });

    it('should register action handlers during initialization', () => {
      expect(qrService.on).toHaveBeenCalledWith('decryptQRData', expect.any(Function));
      expect(qrService.on).toHaveBeenCalledWith('ping', expect.any(Function));
    });

    it('should use static logger consistently', () => {
      expect(cds.log).toHaveBeenCalledWith('QRService');
    });
  });

  describe('decryptQRData method (via private access)', () => {
    it('should successfully validate and decrypt QR data', async () => {
      // Setup mocks
      mockQREncryptionService.isValidQRFormat.mockReturnValue(true);
      mockQREncryptionService.decryptQRData.mockResolvedValue(testDecryptedData);

      // Access private method for testing
      const result = await qrService.decryptQRData(testQRData);

      // Verify QR validation and decryption
      expect(mockQREncryptionService.isValidQRFormat).toHaveBeenCalledWith(testQRData);
      expect(mockQREncryptionService.decryptQRData).toHaveBeenCalledWith(testQRData);

      // Verify result structure
      expect(result).toEqual({
        evseId: 'evse-uuid-001',
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Starting QR code decryption');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'QR code decrypted successfully for EVSE: evse-uuid-001',
      );
    });

    it('should throw error when encrypted data is missing', async () => {
      await expect(qrService.decryptQRData('')).rejects.toThrow(
        'Failed to decrypt QR code: Missing encrypted data',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Missing encrypted data in request');
      expect(mockQREncryptionService.isValidQRFormat).not.toHaveBeenCalled();
      expect(mockQREncryptionService.decryptQRData).not.toHaveBeenCalled();
    });

    it('should throw error when encrypted data is null/undefined', async () => {
      await expect(qrService.decryptQRData(null)).rejects.toThrow(
        'Failed to decrypt QR code: Missing encrypted data',
      );
      await expect(qrService.decryptQRData(undefined)).rejects.toThrow(
        'Failed to decrypt QR code: Missing encrypted data',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Missing encrypted data in request');
    });

    it('should throw error when QR format is invalid', async () => {
      mockQREncryptionService.isValidQRFormat.mockReturnValue(false);

      await expect(qrService.decryptQRData('invalid-qr-format')).rejects.toThrow(
        'Failed to decrypt QR code: Invalid QR code format',
      );

      expect(mockQREncryptionService.isValidQRFormat).toHaveBeenCalledWith('invalid-qr-format');
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid QR code format provided');
      expect(mockQREncryptionService.decryptQRData).not.toHaveBeenCalled();
    });

    it('should handle QR decryption errors gracefully', async () => {
      const decryptionError = new Error('Invalid key');

      mockQREncryptionService.isValidQRFormat.mockReturnValue(true);
      mockQREncryptionService.decryptQRData.mockRejectedValue(decryptionError);

      await expect(qrService.decryptQRData(testQRData)).rejects.toThrow(
        'Failed to decrypt QR code: Invalid key',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('QR decryption failed:', {
        message: 'Invalid key',
      });
    });

    it('should handle QR data with special characters', async () => {
      const specialQRData = 'base64+data/with+special=chars==';
      const specialDecryptedData = {
        evseId: 'evse-uuid-001@domain.com',
      };

      mockQREncryptionService.isValidQRFormat.mockReturnValue(true);
      mockQREncryptionService.decryptQRData.mockResolvedValue(specialDecryptedData);

      const result = await qrService.decryptQRData(specialQRData);

      expect(mockQREncryptionService.decryptQRData).toHaveBeenCalledWith(specialQRData);
      expect(result).toEqual(specialDecryptedData);
    });

    it('should handle very long QR data', async () => {
      const longQRData = 'a'.repeat(10000); // Very long base64 string

      mockQREncryptionService.isValidQRFormat.mockReturnValue(true);
      mockQREncryptionService.decryptQRData.mockResolvedValue(testDecryptedData);

      const result = await qrService.decryptQRData(longQRData);

      expect(mockQREncryptionService.decryptQRData).toHaveBeenCalledWith(longQRData);
      expect(result).toEqual(testDecryptedData);
    });

    it('should handle non-Error exceptions', async () => {
      mockQREncryptionService.isValidQRFormat.mockReturnValue(true);
      mockQREncryptionService.decryptQRData.mockRejectedValue('String error');

      await expect(qrService.decryptQRData(testQRData)).rejects.toThrow(
        'Failed to decrypt QR code: Unknown error',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('QR decryption failed:', {
        message: 'Unknown error',
      });
    });
  });

  describe('ping method', () => {
    it('should return pong', async () => {
      const result = await qrService.ping();
      expect(result).toBe('pong');
    });
  });

  describe('QREncryptionService Integration', () => {
    it('should get QREncryptionService instance during construction', () => {
      expect(mockQREncryptionService.getInstance).toHaveBeenCalled();
    });

    it('should handle concurrent decryption requests properly', async () => {
      mockQREncryptionService.isValidQRFormat.mockReturnValue(true);
      mockQREncryptionService.decryptQRData.mockImplementation(async (qrData) => ({
        evseId: `evse-uuid-${qrData.slice(-1)}`,
      }));

      const requests = Array.from({ length: 5 }, (_, i) => `qr-data-${i}`);

      // Process all requests concurrently
      const results = await Promise.all(requests.map((qrData) => qrService.decryptQRData(qrData)));

      // Verify all requests were processed
      results.forEach((result, index) => {
        expect(result).toEqual({
          evseId: `evse-uuid-${index}`,
        });
      });

      expect(mockQREncryptionService.decryptQRData).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle validation throwing unexpected errors', async () => {
      const unexpectedError = new Error('Validation system error');
      mockQREncryptionService.isValidQRFormat.mockImplementation(() => {
        throw unexpectedError;
      });

      await expect(qrService.decryptQRData(testQRData)).rejects.toThrow(
        'Failed to decrypt QR code: Validation system error',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('QR decryption failed:', {
        message: 'Validation system error',
      });
    });

    it('should handle getInstance throwing errors', () => {
      // This test verifies the service handles QREncryptionService.getInstance() errors
      // In a real scenario, this would be tested during service construction
      expect(() => {
        mockQREncryptionService.getInstance.mockImplementation(() => {
          throw new Error('Service unavailable');
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (QRService as any)();
      }).toThrow('Service unavailable');
    });
  });
});
