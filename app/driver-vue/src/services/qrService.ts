// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import useAuthFetch from '@/composables/useAuthFetch';

export interface QRDecryptionResult {
  evseId: string;
}

export interface QRServiceError {
  code: 'NETWORK_ERROR' | 'INVALID_QR' | 'DECRYPTION_FAILED' | 'SERVER_ERROR';
  message: string;
  originalError?: Error;
}

/**
 * Service for QR code operations
 */
export class QRService {
  private static instance: QRService;

  private constructor() {}

  public static getInstance(): QRService {
    if (!QRService.instance) {
      QRService.instance = new QRService();
    }
    return QRService.instance;
  }

  /**
   * Decrypt encrypted QR code data using backend service
   */
  async decryptQRData(encryptedData: string): Promise<QRDecryptionResult> {
    try {
      const response = await useAuthFetch('/rest/qr/decryptQRData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw this.createQRServiceError(
          'DECRYPTION_FAILED',
          `Server returned ${response.status}: ${errorText}`,
        );
      }

      const result = await response.json();

      // Validate response structure
      if (!result.evseId || typeof result.evseId !== 'string') {
        throw this.createQRServiceError(
          'INVALID_QR',
          'Invalid response format from decryption service',
        );
      }

      return {
        evseId: result.evseId,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Re-throw QRServiceError as-is
        throw error;
      }

      // Handle network and other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createQRServiceError(
          'NETWORK_ERROR',
          'Unable to connect to QR decryption service. Please check your connection.',
          error,
        );
      }

      throw this.createQRServiceError(
        'SERVER_ERROR',
        `Unexpected error during QR decryption: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Test if QR service is available
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await useAuthFetch('/rest/qr/ping', {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create a standardized QR service error
   */
  private createQRServiceError(
    code: QRServiceError['code'],
    message: string,
    originalError?: Error,
  ): QRServiceError {
    const error = new Error(message) as Error & QRServiceError;
    error.code = code;
    error.message = message;
    error.originalError = originalError;
    return error;
  }
}

/**
 * Composable for QR service operations
 */
export function useQRService() {
  const qrService = QRService.getInstance();

  return {
    decryptQRData: qrService.decryptQRData.bind(qrService),
    testConnection: qrService.testConnection.bind(qrService),
  };
}
