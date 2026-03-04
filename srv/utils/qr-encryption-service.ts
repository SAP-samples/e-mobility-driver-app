// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import crypto from 'node:crypto';

import cds from '@sap/cds';

/**
 * QR Encryption Service
 * Simple encryption key management for QR codes
 */
export class QREncryptionService {
  private static instance: QREncryptionService;
  private static encryptionKey: string | null = null;
  private static readonly logger = cds.log('QREncryption');

  private static readonly ALGORITHM = 'aes-256-gcm';

  private constructor() {}

  public static getInstance(): QREncryptionService {
    if (!QREncryptionService.instance) {
      QREncryptionService.instance = new QREncryptionService();
    }
    return QREncryptionService.instance;
  }

  /**
   * Get encryption key with simple fallback strategy
   */
  public async getEncryptionKey(): Promise<string> {
    if (QREncryptionService.encryptionKey) {
      return QREncryptionService.encryptionKey;
    }

    QREncryptionService.encryptionKey = this.loadKey();
    return QREncryptionService.encryptionKey;
  }

  private throwMissingKeyError(): never {
    QREncryptionService.logger.error('🚨 QR_ENCRYPTION_KEY not configured!');
    QREncryptionService.logger.error(
      '🚨 Please check documentation to create and synchronize your encryption key',
    );

    throw new Error('QR_ENCRYPTION_KEY not configured');
  }

  private loadKey(): string {
    // Priority 1: CDS configuration (qr-encryption section)
    const cdsKey = cds.env['qr-encryption']?.QR_ENCRYPTION_KEY;
    if (cdsKey) {
      return cdsKey;
    }

    // Priority 2: VCAP_SERVICES (CF bound services)
    if (process.env.VCAP_SERVICES) {
      try {
        const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
        const userProvided = vcapServices['user-provided'];

        if (userProvided) {
          for (const service of userProvided) {
            if (service.name === 'driver-app-qr-config' && service.credentials?.QR_ENCRYPTION_KEY) {
              return service.credentials.QR_ENCRYPTION_KEY;
            }
          }
        }
      } catch (error) {
        QREncryptionService.logger.error('Error parsing VCAP_SERVICES:', error);
      }
    }

    // Priority 3: Environment variable (for local development)
    if (process.env.QR_ENCRYPTION_KEY) {
      return process.env.QR_ENCRYPTION_KEY;
    }

    // No key found anywhere
    this.throwMissingKeyError();
  }

  /**
   * Encrypt QR code data
   */
  public async encryptQRData(data: { evseId: string }): Promise<string> {
    const key = await this.getEncryptionKey();
    const keyBuffer = Buffer.from(key, 'hex');

    // Generate random IV for each encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(QREncryptionService.ALGORITHM, keyBuffer, iv);
    cipher.setAAD(Buffer.from('qr-data'));

    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

    return combined.toString('base64');
  }

  /**
   * Decrypt QR code data
   */
  public async decryptQRData(encryptedData: string): Promise<{ evseId: string }> {
    try {
      const key = await this.getEncryptionKey();
      const keyBuffer = Buffer.from(key, 'hex');

      const combined = Buffer.from(encryptedData, 'base64');

      // Extract IV (16 bytes), authTag (16 bytes), and encrypted data
      const iv = combined.subarray(0, 16);
      const authTag = combined.subarray(16, 32);
      const encrypted = combined.subarray(32);

      const decipher = crypto.createDecipheriv(QREncryptionService.ALGORITHM, keyBuffer, iv);
      decipher.setAAD(Buffer.from('qr-data'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      const data = JSON.parse(decrypted);

      // Validate structure
      if (!data.evseId || typeof data.evseId !== 'string') {
        throw new Error('Invalid QR data structure');
      }
      return { evseId: data.evseId };
    } catch (error) {
      // Handle specific validation errors
      if (error instanceof Error && error.message.includes('QR data structure')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('Legacy QR format')) {
        throw error;
      }
      // All other errors (crypto, parsing, etc.) are treated as corrupted data
      throw new Error('Invalid or corrupted QR code data');
    }
  }

  /**
   * Validate QR code format without decrypting
   */
  public isValidQRFormat(data: string): boolean {
    // Basic input validation
    if (!data || typeof data !== 'string' || data.length === 0) {
      return false;
    }

    // Validate base64 format before attempting Buffer.from()
    // Base64 should only contain A-Z, a-z, 0-9, +, /, and optional padding (=)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(data)) {
      return false;
    }

    try {
      const buffer = Buffer.from(data, 'base64');
      // Should have at least IV (16) + authTag (16) + some encrypted data (2+ bytes)
      return buffer.length >= 34;
    } catch (error) {
      QREncryptionService.logger.error('QR validation failed: Buffer.from() error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataLength: data.length,
        dataPreview: data.substring(0, 20),
      });
      return false;
    }
  }
}
