// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Error codes for session start failures
 */
export enum SessionStartErrorCode {
  /** EVSE not found in the system */
  EVSE_NOT_FOUND = 'EVSE_NOT_FOUND',
  /** EVSE has no available connectors */
  NO_CONNECTORS = 'NO_CONNECTORS',
  /** Session start failed (generic backend error) */
  START_FAILED = 'START_FAILED',
  /** Session start timed out after maximum polling attempts */
  TIMEOUT = 'TIMEOUT',
  /** EVSE returned to available/error state */
  WARNING = 'WARNING',
  /** Backend error during session start */
  BACKEND_ERROR = 'BACKEND_ERROR',
}

/**
 * Custom error class for session start failures
 * Provides structured error information with error codes
 */
export class SessionStartError extends Error {
  constructor(
    public readonly code: SessionStartErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SessionStartError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SessionStartError);
    }
  }
}
