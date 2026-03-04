// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import crypto from 'node:crypto';

import cds from '@sap/cds';

// Mock CDS framework
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@sap/cds', () => ({
  log: jest.fn(() => mockLogger),
  env: {},
}));

// Import after mocking
import { QREncryptionService } from '../../srv/utils/qr-encryption-service';

describe('QREncryptionService', () => {
  let qrService: QREncryptionService;
  const testKey = '943c5eecd6a252d2ab6734d7d3e6573c62a1fc358a11ac5e879fc323a4ed3b83';
  const testData = {
    evseId: 'evse-uuid-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton instance
    (QREncryptionService as unknown as { instance: undefined }).instance = undefined;
    (QREncryptionService as unknown as { encryptionKey: null }).encryptionKey = null;

    // Clear environment variables
    delete process.env.QR_ENCRYPTION_KEY;
    delete process.env.VCAP_SERVICES;
    delete process.env.VCAP_APPLICATION_ID;
    delete process.env.NODE_ENV;

    // Reset CDS env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cds as any).env = {};

    qrService = QREncryptionService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = QREncryptionService.getInstance();
      const instance2 = QREncryptionService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton across multiple calls', () => {
      const instances = Array.from({ length: 10 }, () => QREncryptionService.getInstance());

      instances.forEach((instance) => {
        expect(instance).toBe(instances[0]);
      });
    });
  });

  describe('Key Loading - CDS Configuration', () => {
    it('should load key from CDS configuration', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should prioritize CDS configuration over other sources', async () => {
      const envKey = 'env-key-should-not-be-used';
      const cdsKey = 'cds-key-should-be-used';

      process.env.QR_ENCRYPTION_KEY = envKey;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: cdsKey,
        },
      };

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(cdsKey);
    });
  });

  describe('Key Loading - VCAP_SERVICES', () => {
    it('should load key from VCAP_SERVICES', async () => {
      const vcapServices = {
        'user-provided': [
          {
            name: 'driver-app-qr-config',
            credentials: {
              QR_ENCRYPTION_KEY: testKey,
            },
          },
        ],
      };

      process.env.VCAP_SERVICES = JSON.stringify(vcapServices);

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should handle multiple user-provided services', async () => {
      const vcapServices = {
        'user-provided': [
          {
            name: 'other-service',
            credentials: {
              OTHER_KEY: 'other-value',
            },
          },
          {
            name: 'driver-app-qr-config',
            credentials: {
              QR_ENCRYPTION_KEY: testKey,
            },
          },
        ],
      };

      process.env.VCAP_SERVICES = JSON.stringify(vcapServices);

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should handle malformed VCAP_SERVICES JSON', async () => {
      process.env.VCAP_SERVICES = 'invalid-json';
      process.env.NODE_ENV = 'production';
      process.env.VCAP_APPLICATION_ID = 'test-app';

      await expect(qrService.getEncryptionKey()).rejects.toThrow(
        'QR_ENCRYPTION_KEY not configured',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error parsing VCAP_SERVICES:',
        expect.any(Error),
      );
    });

    it('should handle missing user-provided services in VCAP_SERVICES', async () => {
      const vcapServices = {
        'other-services': [],
      };

      process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
      process.env.NODE_ENV = 'production';
      process.env.VCAP_APPLICATION_ID = 'test-app';

      await expect(qrService.getEncryptionKey()).rejects.toThrow(
        'QR_ENCRYPTION_KEY not configured',
      );
    });

    it('should handle service without QR_ENCRYPTION_KEY', async () => {
      const vcapServices = {
        'user-provided': [
          {
            name: 'driver-app-qr-config',
            credentials: {
              OTHER_KEY: 'other-value',
            },
          },
        ],
      };

      process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
      process.env.NODE_ENV = 'production';
      process.env.VCAP_APPLICATION_ID = 'test-app';

      await expect(qrService.getEncryptionKey()).rejects.toThrow(
        'QR_ENCRYPTION_KEY not configured',
      );
    });
  });

  describe('Key Loading - Environment Variable', () => {
    it('should load key from environment variable', async () => {
      process.env.QR_ENCRYPTION_KEY = testKey;

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should prioritize VCAP_SERVICES over environment variable', async () => {
      const envKey = 'env-key-should-not-be-used';
      const vcapKey = 'vcap-key-should-be-used';

      process.env.QR_ENCRYPTION_KEY = envKey;
      process.env.VCAP_SERVICES = JSON.stringify({
        'user-provided': [
          {
            name: 'driver-app-qr-config',
            credentials: {
              QR_ENCRYPTION_KEY: vcapKey,
            },
          },
        ],
      });

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(vcapKey);
    });
  });

  describe('Key Loading - Development Fallback', () => {
    it('should work with VCAP_APPLICATION_ID present (CF environment)', async () => {
      // Test that VCAP_APPLICATION_ID presence doesn't interfere with key loading
      process.env.VCAP_APPLICATION_ID = 'cf-app-id';
      process.env.QR_ENCRYPTION_KEY = testKey;

      const key = await qrService.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should throw error in production when no key found', async () => {
      process.env.NODE_ENV = 'production';

      await expect(qrService.getEncryptionKey()).rejects.toThrow(
        'QR_ENCRYPTION_KEY not configured',
      );
    });

    it('should throw error when VCAP_APPLICATION_ID present but no key', async () => {
      process.env.VCAP_APPLICATION_ID = 'production-app';

      await expect(qrService.getEncryptionKey()).rejects.toThrow(
        'QR_ENCRYPTION_KEY not configured',
      );
    });
  });

  describe('Key Caching', () => {
    it('should cache encryption key after first load', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };

      const key1 = await qrService.getEncryptionKey();
      const key2 = await qrService.getEncryptionKey();

      expect(key1).toBe(testKey);
      expect(key2).toBe(testKey);
      expect(key1).toBe(key2);
    });

    it('should not reload key on subsequent calls', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };

      await qrService.getEncryptionKey();

      // Change the configuration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: 'different-key',
        },
      };

      const key = await qrService.getEncryptionKey();

      // Should still return cached key
      expect(key).toBe(testKey);
    });
  });

  describe('QR Format Validation', () => {
    it('should validate correct base64 format', () => {
      const validBase64 = Buffer.from('test data that is long enough for validation').toString(
        'base64',
      );

      const isValid = qrService.isValidQRFormat(validBase64);

      expect(isValid).toBe(true);
    });

    it('should reject null input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = qrService.isValidQRFormat(null as any);

      expect(isValid).toBe(false);
    });

    it('should reject undefined input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = qrService.isValidQRFormat(undefined as any);

      expect(isValid).toBe(false);
    });

    it('should reject empty string', () => {
      const isValid = qrService.isValidQRFormat('');

      expect(isValid).toBe(false);
    });

    it('should reject non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = qrService.isValidQRFormat(123 as any);

      expect(isValid).toBe(false);
    });

    it('should reject invalid base64 characters', () => {
      const invalidBase64 = 'invalid@base64#string!';

      const isValid = qrService.isValidQRFormat(invalidBase64);

      expect(isValid).toBe(false);
    });

    it('should reject too short data', () => {
      const shortData = 'dGVzdA=='; // "test" in base64 - too short

      const isValid = qrService.isValidQRFormat(shortData);

      expect(isValid).toBe(false);
    });

    it('should handle Buffer.from() errors gracefully', () => {
      // Mock Buffer.from to throw an error
      const originalBufferFrom = Buffer.from;
      Buffer.from = jest.fn().mockImplementation(() => {
        throw new Error('Buffer creation failed');
      });

      const isValid = qrService.isValidQRFormat(
        'dGVzdCBkYXRhIHRoYXQgaXMgbG9uZyBlbm91Z2ggZm9yIHZhbGlkYXRpb24=',
      );

      expect(isValid).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'QR validation failed: Buffer.from() error:',
        expect.objectContaining({
          error: 'Buffer creation failed',
          dataLength: expect.any(Number),
          dataPreview: expect.any(String),
        }),
      );

      // Restore original Buffer.from
      Buffer.from = originalBufferFrom;
    });

    it('should validate minimum buffer length', () => {
      // Create data that results in exactly 34 bytes when decoded
      const minValidData = Buffer.alloc(34, 'a').toString('base64');
      const tooShortData = Buffer.alloc(33, 'a').toString('base64');

      expect(qrService.isValidQRFormat(minValidData)).toBe(true);
      expect(qrService.isValidQRFormat(tooShortData)).toBe(false);
    });

    it('should handle base64 padding correctly', () => {
      // Use longer data to meet minimum buffer length requirement (34 bytes)
      const longData = 'test data with padding that is long enough to pass validation checks';
      const dataWithPadding = Buffer.from(longData).toString('base64');
      const dataWithoutPadding = dataWithPadding.replace(/=/g, '');

      expect(qrService.isValidQRFormat(dataWithPadding)).toBe(true);
      expect(qrService.isValidQRFormat(dataWithoutPadding)).toBe(true);
    });
  });

  describe('Encryption/Decryption', () => {
    beforeEach(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };
    });

    it('should encrypt and decrypt data successfully', async () => {
      const encrypted = await qrService.encryptQRData(testData);
      const decrypted = await qrService.decryptQRData(encrypted);

      expect(decrypted).toEqual(testData);
    });

    it('should produce different encrypted values for same data', async () => {
      const encrypted1 = await qrService.encryptQRData(testData);
      const encrypted2 = await qrService.encryptQRData(testData);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same data
      const decrypted1 = await qrService.decryptQRData(encrypted1);
      const decrypted2 = await qrService.decryptQRData(encrypted2);

      expect(decrypted1).toEqual(testData);
      expect(decrypted2).toEqual(testData);
    });

    it('should handle different EVSE IDs', async () => {
      const testCases = [
        { evseId: 'evse-uuid-001' },
        { evseId: 'evse-uuid-002' },
        { evseId: 'evse-uuid-003' },
      ];

      for (const testCase of testCases) {
        const encrypted = await qrService.encryptQRData(testCase);
        const decrypted = await qrService.decryptQRData(encrypted);

        expect(decrypted).toEqual(testCase);
      }
    });

    it('should handle special characters in EVSE IDs', async () => {
      const specialData = {
        evseId: 'evse-uuid-001@domain.com',
      };

      const encrypted = await qrService.encryptQRData(specialData);
      const decrypted = await qrService.decryptQRData(encrypted);

      expect(decrypted).toEqual(specialData);
    });

    it('should validate decrypted data structure', async () => {
      const invalidData = { invalidField: 'test' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const encrypted = await qrService.encryptQRData(invalidData as any);

      await expect(qrService.decryptQRData(encrypted)).rejects.toThrow('Invalid QR data structure');
    });

    it('should validate connector ID is a number', async () => {
      const invalidData = { chargingStationId: 'EVSE-001', connectorId: 'not-a-number' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const encrypted = await qrService.encryptQRData(invalidData as any);

      await expect(qrService.decryptQRData(encrypted)).rejects.toThrow('Invalid QR data structure');
    });

    it('should reject corrupted encrypted data', async () => {
      const encrypted = await qrService.encryptQRData(testData);
      const corrupted = encrypted.slice(0, -5) + 'XXXXX';

      await expect(qrService.decryptQRData(corrupted)).rejects.toThrow(
        'Invalid or corrupted QR code data',
      );
    });

    it('should reject completely invalid encrypted data', async () => {
      const invalidData = 'not-encrypted-data';

      await expect(qrService.decryptQRData(invalidData)).rejects.toThrow(
        'Invalid or corrupted QR code data',
      );
    });

    it('should handle empty encrypted data', async () => {
      await expect(qrService.decryptQRData('')).rejects.toThrow();
    });

    it('should handle malformed JSON in encrypted data', async () => {
      // Create a valid encrypted structure but with invalid JSON content
      const key = Buffer.from(testKey, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from('qr-data'));

      const invalidJson = 'invalid-json-content';
      let encrypted = cipher.update(invalidJson, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
      const base64Data = combined.toString('base64');

      await expect(qrService.decryptQRData(base64Data)).rejects.toThrow(
        'Invalid or corrupted QR code data',
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error when no key configured in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VCAP_APPLICATION_ID = 'prod-app';

      await expect(qrService.getEncryptionKey()).rejects.toThrow(
        'QR_ENCRYPTION_KEY not configured',
      );
    });

    it('should handle encryption errors gracefully', async () => {
      // Mock crypto to throw an error
      const originalCreateCipheriv = crypto.createCipheriv;
      crypto.createCipheriv = jest.fn().mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };

      await expect(qrService.encryptQRData(testData)).rejects.toThrow('Encryption failed');

      // Restore original function
      crypto.createCipheriv = originalCreateCipheriv;
    });

    it('should handle decryption errors gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };

      const encrypted = await qrService.encryptQRData(testData);

      // Mock crypto to throw an error during decryption
      const originalCreateDecipheriv = crypto.createDecipheriv;
      crypto.createDecipheriv = jest.fn().mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(qrService.decryptQRData(encrypted)).rejects.toThrow(
        'Invalid or corrupted QR code data',
      );

      // Restore original function
      crypto.createDecipheriv = originalCreateDecipheriv;
    });
  });

  describe('Static Logger', () => {
    it('should use static logger for throwMissingKeyError', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VCAP_APPLICATION_ID = 'test-app';

      try {
        await qrService.getEncryptionKey();
      } catch (_error) {
        // Expected to throw
      }

      // Verify that the error logging was called (from throwMissingKeyError)
      expect(mockLogger.error).toHaveBeenCalledWith('🚨 QR_ENCRYPTION_KEY not configured!');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '🚨 Please check documentation to create and synchronize your encryption key',
      );
    });

    it('should log validation errors with static logger', () => {
      const invalidData = 'invalid@data';

      qrService.isValidQRFormat(invalidData);

      // Should not log for simple validation failures
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log Buffer.from errors with static logger', () => {
      // Mock Buffer.from to throw
      const originalBufferFrom = Buffer.from;
      Buffer.from = jest.fn().mockImplementation(() => {
        throw new Error('Buffer error');
      });

      qrService.isValidQRFormat('dGVzdCBkYXRhIHRoYXQgaXMgbG9uZyBlbm91Z2ggZm9yIHZhbGlkYXRpb24=');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'QR validation failed: Buffer.from() error:',
        expect.any(Object),
      );

      Buffer.from = originalBufferFrom;
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with VCAP_SERVICES configuration', async () => {
      const vcapServices = {
        'user-provided': [
          {
            name: 'driver-app-qr-config',
            credentials: {
              QR_ENCRYPTION_KEY: testKey,
            },
          },
        ],
      };

      process.env.VCAP_SERVICES = JSON.stringify(vcapServices);

      // Test complete flow
      const encrypted = await qrService.encryptQRData(testData);
      expect(qrService.isValidQRFormat(encrypted)).toBe(true);

      const decrypted = await qrService.decryptQRData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should maintain consistency across multiple operations', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds as any).env = {
        'qr-encryption': {
          QR_ENCRYPTION_KEY: testKey,
        },
      };

      const testCases = [
        { evseId: 'evse-uuid-001' },
        { evseId: 'evse-uuid-002' },
        { evseId: 'evse-uuid-003' },
      ];

      const results = [];

      for (const testCase of testCases) {
        const encrypted = await qrService.encryptQRData(testCase);
        const isValid = qrService.isValidQRFormat(encrypted);
        const decrypted = await qrService.decryptQRData(encrypted);

        results.push({ encrypted, isValid, decrypted });
      }

      // Verify all operations succeeded
      results.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.decrypted).toEqual(testCases[index]);
        expect(result.encrypted).toBeTruthy();
      });

      // Verify all encrypted values are different
      const encryptedValues = results.map((r) => r.encrypted);
      const uniqueValues = new Set(encryptedValues);
      expect(uniqueValues.size).toBe(encryptedValues.length);
    });
  });
});
