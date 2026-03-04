// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import * as nodeCanvas from 'canvas';
import { JSDOM } from 'jsdom';
// @ts-expect-error - No types available for CommonJS version
import { QRCodeStyling } from 'qr-code-styling/lib/qr-code-styling.common.js';

import { Logger } from './logger.js';
import { getPreset } from './qr-style-presets.js';
import type { QRStyleConfig } from './qr-style-types.js';

/**
 * QR Code Generator
 * Generates styled QR codes with encryption support using qr-code-styling library
 */

export interface QRData {
  evseId: string;
}

export class QRGenerator {
  /**
   * Generate QR code with preset styling
   * @param data - QR code data
   * @param encryptionKey - Optional encryption key
   * @param styleConfig - Style configuration with preset
   * @returns Buffer containing the QR code image
   */
  static async generateQR(
    data: QRData,
    encryptionKey?: string,
    styleConfig?: QRStyleConfig,
  ): Promise<Buffer> {
    try {
      Logger.info(`🎨 Generating QR code for EVSE ${data.evseId}`);

      // Prepare QR content (encrypted or plain)
      const qrContent = await this.prepareQRContent(data, encryptionKey);

      // Generate QR with preset
      return await this.generateQRWithPreset(qrContent, styleConfig);
    } catch (error) {
      Logger.error(`❌ Failed to generate QR code: ${error}`);
      throw error;
    }
  }

  /**
   * Generate QR code with preset styling using qr-code-styling library
   * Requires jsdom and nodeCanvas for Node.js environment
   */
  private static async generateQRWithPreset(
    content: string,
    styleConfig?: QRStyleConfig,
  ): Promise<Buffer> {
    const width = styleConfig?.width || 512;
    const height = styleConfig?.height || 512;

    // Get preset (default to 'standard')
    const presetName = styleConfig?.styled?.preset || 'standard';
    const preset = getPreset(presetName);

    if (presetName !== 'standard') {
      Logger.info(`🎨 Applying preset: ${preset.name}`);
    }

    // Merge preset with custom config
    const dotsOptions = styleConfig?.styled?.dotsOptions || preset.dotsOptions;
    const cornersSquareOptions =
      styleConfig?.styled?.cornersSquareOptions || preset.cornersSquareOptions;
    const cornersDotOptions = styleConfig?.styled?.cornersDotOptions || preset.cornersDotOptions;
    const backgroundOptions = styleConfig?.styled?.backgroundOptions || preset.backgroundOptions;
    const imageOptions = styleConfig?.styled?.imageOptions || preset.imageOptions;

    const qrCode = new QRCodeStyling({
      jsdom: JSDOM,
      nodeCanvas,
      width,
      height,
      data: content,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H',
      },
      // Include logo image if provided (path will be loaded by qr-code-styling)
      ...(styleConfig?.image
        ? {
            image: styleConfig.image,
            imageOptions: {
              ...(imageOptions || {}),
              saveAsBlob: true,
              crossOrigin: 'anonymous',
            },
          }
        : {}),
      dotsOptions: dotsOptions as any,
      backgroundOptions: backgroundOptions as any,
      cornersSquareOptions: cornersSquareOptions as any,
      cornersDotOptions: cornersDotOptions as any,
    });

    const buffer = await qrCode.getRawData('png');
    if (!buffer) {
      throw new Error('Failed to generate QR code buffer');
    }

    Logger.success(`✅ QR code generated (${width}x${height}px)`);

    // Handle both Buffer and Blob types
    if (buffer instanceof Buffer) {
      return buffer;
    } else {
      const blob = buffer as Blob;
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  }

  /**
   * Prepare QR content (encrypt if key provided)
   */
  private static async prepareQRContent(data: QRData, encryptionKey?: string): Promise<string> {
    if (encryptionKey) {
      const encryptedData = await this.encryptQRData(data, encryptionKey);
      Logger.info(`🔐 QR data encrypted successfully`);
      return `emobility://decrypt?data=${encodeURIComponent(encryptedData)}`;
    } else {
      Logger.warn(`⚠️  QR code generated without encryption (development mode)`);
      return `emobility://start-session?evse=${encodeURIComponent(data.evseId)}`;
    }
  }

  /**
   * Encrypt QR data using AES-256-GCM
   */
  private static async encryptQRData(data: QRData, key: string): Promise<string> {
    const crypto = await import('crypto');
    const keyBuffer = Buffer.from(key, 'hex');

    // Generate random IV for each encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
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
   * Generate multiple QR codes
   */
  static async generateMultipleQRs(
    dataList: QRData[],
    encryptionKey?: string,
    styleConfig?: QRStyleConfig,
  ): Promise<{ data: QRData; qrCode: Buffer }[]> {
    Logger.info(`🎨 Generating ${dataList.length} QR codes...`);

    const results = await Promise.all(
      dataList.map(async (data) => ({
        data,
        qrCode: await this.generateQR(data, encryptionKey, styleConfig),
      })),
    );

    Logger.success(`✅ Generated ${results.length} QR codes successfully`);
    return results;
  }

  /**
   * Validate QR data format
   */
  static validateQRData(data: QRData): boolean {
    return typeof data.evseId === 'string' && data.evseId.length > 0;
  }
}
