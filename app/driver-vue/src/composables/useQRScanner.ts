// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { ref } from 'vue';

import { type QRServiceError, useQRService } from '@/services/qrService';

export interface QRData {
  evseId: string;
}

export function useQRScanner() {
  const isScanning = ref(false);
  const error = ref<string | null>(null);
  const lastScannedData = ref<QRData | null>(null);
  const isDecrypting = ref(false);

  const qrService = useQRService();

  /**
   * Parse QR code content to extract charging station data
   * Handles both encrypted URLs and plain JSON formats
   */
  async function parseQRData(content: string): Promise<QRData> {
    // Check if it's an encrypted QR URL
    if (content.startsWith('emobility://decrypt?data=')) {
      return await parseEncryptedQRData(content);
    }

    // Check if it's a plain emobility URL (fallback format)
    if (content.startsWith('emobility://start-session?')) {
      return parseURLQRData(content);
    }

    // No supported format found
    throw new Error('INVALID_FORMAT');
  }

  /**
   * Parse encrypted QR URL format
   */
  async function parseEncryptedQRData(content: string): Promise<QRData> {
    try {
      const url = new URL(content);
      const encryptedDataParam = url.searchParams.get('data');

      if (!encryptedDataParam) {
        throw new Error('MISSING_DATA');
      }

      isDecrypting.value = true;
      const decryptedResult = await qrService.decryptQRData(encryptedDataParam);

      return {
        evseId: decryptedResult.evseId,
      };
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const qrError = err as QRServiceError;
        switch (qrError.code) {
          case 'NETWORK_ERROR':
            throw new Error('NETWORK_ERROR');
          case 'INVALID_QR':
            throw new Error('INVALID_QR');
          case 'DECRYPTION_FAILED':
            throw new Error('DECRYPTION_FAILED');
          case 'SERVER_ERROR':
            throw new Error('SERVER_ERROR');
          default:
            throw new Error('GENERIC_DECRYPT');
        }
      }
      throw new Error('INVALID_FORMAT');
    } finally {
      isDecrypting.value = false;
    }
  }

  /**
   * Parse plain URL QR format (fallback)
   */
  function parseURLQRData(content: string): QRData {
    try {
      const url = new URL(content);
      const evseIdStr = url.searchParams.get('evse');

      if (!evseIdStr) {
        throw new Error('MISSING_PARAMETERS');
      }

      return {
        evseId: evseIdStr,
      };
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_PARAMETERS') {
        throw err;
      }
      throw new Error('INVALID_URL');
    }
  }

  /**
   * Handle barcode scan result from UI5 BarcodeScannerDialog
   */
  async function handleScanResult(
    scanResult: string,
    onResult: (data: QRData) => void,
    onError?: (error: string) => void,
  ): Promise<void> {
    try {
      const qrData = await parseQRData(scanResult);
      lastScannedData.value = qrData;
      error.value = null;
      onResult(qrData);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'INVALID_FORMAT';
      error.value = errorMessage;
      onError?.(errorMessage);
    }
  }

  /**
   * Handle scan error from UI5 BarcodeScannerDialog
   */
  function handleScanError(errorMessage: string, onError?: (error: string) => void): void {
    error.value = errorMessage;
    onError?.(errorMessage);
  }

  /**
   * Clear any existing errors
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Validate QR data format
   */
  function validateQRData(data: unknown): data is QRData {
    if (data === null || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    return 'evseId' in obj && typeof obj.evseId === 'string' && obj.evseId.trim().length > 0;
  }

  return {
    // State
    isScanning,
    error,
    lastScannedData,
    isDecrypting,

    // Methods
    handleScanResult,
    handleScanError,
    clearError,
    parseQRData,
    validateQRData,
  };
}
