// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds, { ApplicationService } from '@sap/cds';

import { QREncryptionService } from './utils/qr-encryption-service';

export default class QRService extends ApplicationService {
  private readonly logger = cds.log('QRService');
  private readonly qrEncryption = QREncryptionService.getInstance();

  async init() {
    await super.init();

    // Register action handlers
    // @ts-expect-error post body args on action are passed automatically
    this.on('decryptQRData', this.decryptQRData.bind(this));
    this.on('ping', this.ping.bind(this));

    this.logger.info('QR Service initialized');
  }

  /**
   * Decrypt QR code data
   */
  private async decryptQRData(encryptedData: string) {
    this.logger.info('Starting QR code decryption');

    try {
      if (!encryptedData) {
        this.logger.error('Missing encrypted data in request');
        throw new Error('Missing encrypted data');
      }

      // Validate QR format first
      if (!this.qrEncryption.isValidQRFormat(encryptedData)) {
        this.logger.error('Invalid QR code format provided');
        throw new Error('Invalid QR code format');
      }

      const decryptedData = await this.qrEncryption.decryptQRData(encryptedData);

      this.logger.info(`QR code decrypted successfully for EVSE: ${decryptedData.evseId}`);

      return {
        evseId: decryptedData.evseId,
      };
    } catch (error) {
      this.logger.error('QR decryption failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error(
        `Failed to decrypt QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async ping() {
    return 'pong';
  }
}
