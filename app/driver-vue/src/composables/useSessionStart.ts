// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { computed, reactive, readonly } from 'vue';
import type { Ref } from 'vue';

import { SessionStartError, SessionStartErrorCode } from './errors/SessionStartError';
import { useEvseStatusState } from './useEvseStatusState';

import { useEvseStore } from '@/store/evse';
import { useSessionsStore } from '@/store/sessions';

/**
 * Session start status types
 */
export type SessionStartStatus =
  | 'idle'
  | 'starting'
  | 'preparing'
  | 'success'
  | 'warning'
  | 'timeout'
  | 'error';

/**
 * Session start state
 */
export interface SessionStartState {
  status: SessionStartStatus;
  error: Error | null;
  evseId: string | null;
}

/**
 * Configuration options for session start
 */
export interface SessionStartOptions {
  /**
   * Polling delays with exponential backoff (ms)
   * @default [2000, 3000, 5000, 7000, 10000]
   */
  pollingDelays?: number[];

  /**
   * Maximum number of polling attempts
   * @default 5
   */
  maxAttempts?: number;
}

/**
 * Return type for useSessionStart composable
 */
export interface UseSessionStartReturn {
  /**
   * Current state (readonly)
   */
  state: Readonly<SessionStartState>;

  /**
   * Whether a session start is in progress
   */
  isStarting: Readonly<Ref<boolean>>;

  /**
   * Start a charging session
   * @param evseId - EVSE identifier
   * @throws Error if session fails to start
   */
  startSession: (evseId: string) => Promise<void>;

  /**
   * Reset state to idle
   */
  reset: () => void;
}

/**
 * Composable for starting charging sessions with polling
 *
 * Handles the complete session start workflow:
 * 1. Calls backend to start session
 * 2. Polls EVSE status with exponential backoff
 * 3. Detects state transitions (PREPARING → OCCUPIED)
 * 4. Handles timeouts and errors
 *
 * State changes can be monitored via watchers:
 * - 'starting' → Session start initiated
 * - 'preparing' → EVSE is preparing (user action required)
 * - 'success' → Session started successfully
 * - 'warning' → EVSE returned to available state
 * - 'timeout' → Polling timed out
 * - 'error' → An error occurred
 *
 * @param options - Optional configuration
 * @returns Session start controls and state
 *
 * @example
 * ```typescript
 * const { startSession, state } = useSessionStart();
 *
 * // Watch for state changes
 * watch(() => state.status, (status) => {
 *   if (status === 'preparing') showToast('Please plug in your cable');
 *   if (status === 'timeout') showWarning('Timeout');
 * });
 *
 * // Start session with try/catch
 * try {
 *   await startSession('evse-123');
 *   router.push('/sessions');
 * } catch (error) {
 *   showError(error.message);
 * }
 * ```
 */
export function useSessionStart(options?: SessionStartOptions): UseSessionStartReturn {
  const sessionsStore = useSessionsStore();
  const evseStore = useEvseStore();
  const { computeEvseOcpiStatus } = useEvseStatusState();

  // Configuration with defaults
  const config = {
    pollingDelays: options?.pollingDelays ?? [2000, 3000, 5000, 7000, 10000],
    maxAttempts: options?.maxAttempts ?? 5,
  };

  // Internal state
  const state = reactive<SessionStartState>({
    status: 'idle',
    error: null,
    evseId: null,
  });

  // Computed properties
  const isStarting = computed(() => state.status === 'starting' || state.status === 'preparing');

  /**
   * Delay helper
   */
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get polling delay for current attempt with bounds checking
   * If attempt exceeds array length, uses the last delay (plateau backoff)
   */
  function getPollingDelay(attemptIndex: number): number {
    const safeIndex = Math.min(attemptIndex, config.pollingDelays.length - 1);
    return config.pollingDelays[safeIndex];
  }

  /**
   * Handle polling continuation with timeout check
   * @throws SessionStartError if max attempts reached
   */
  async function continuePollingOrTimeout(attemptIndex: number): Promise<void> {
    if (attemptIndex === config.maxAttempts - 1) {
      state.status = 'timeout';
      throw new SessionStartError(SessionStartErrorCode.TIMEOUT, 'Session start timeout');
    }
    await delay(getPollingDelay(attemptIndex));
  }

  /**
   * Poll EVSE status with exponential backoff
   */
  async function pollConnectorStatus(evseId: string): Promise<void> {
    let preparingNotified = false;

    // Initial delay to allow backend to process the session start
    // Backend needs time to update the connector status after session creation
    await delay(2000);

    for (let i = 0; i < config.maxAttempts; i++) {
      // Fetch current EVSE state
      const evse = await evseStore.fetchById(evseId);
      const ocpiStatus = computeEvseOcpiStatus(evse ?? undefined);

      // Handle state transitions
      switch (ocpiStatus) {
        case 'PREPARING':
          // Notify user on first PREPARING detection
          if (!preparingNotified) {
            state.status = 'preparing';
            preparingNotified = true;
          }

          // Continue polling with exponential backoff (or timeout if last attempt)
          await continuePollingOrTimeout(i);
          continue;

        case 'OCCUPIED':
          // Success: EVSE is now occupied (includes CHARGING, SUSPENDEDEV, SUSPENDEDEVSE, FINISHING)
          await sessionsStore.loadInProgressSessions();
          state.status = 'success';
          return;

        case 'AVAILABLE':
        case 'RESERVED':
        case 'OUTOFORDER':
        case 'INOPERATIVE':
          // Warning: EVSE returned to available/error state
          state.status = 'warning';
          throw new SessionStartError(
            SessionStartErrorCode.WARNING,
            `Session start failed: EVSE returned to ${ocpiStatus} state`,
          );

        default:
          // Unknown status: continue polling
          // Don't fail immediately as session might not have propagated yet
          await continuePollingOrTimeout(i);
      }
    }
  }

  /**
   * Start a charging session
   */
  async function startSession(evseId: string): Promise<void> {
    try {
      // Reset state
      state.evseId = evseId;
      state.error = null;
      state.status = 'starting';

      // 1. Start charging session via backend
      await sessionsStore.startSession(evseId);

      // 2. Poll connector status with exponential backoff
      await pollConnectorStatus(evseId);
    } catch (err) {
      // Handle errors from backend or polling
      const error = err instanceof Error ? err : new Error(String(err));

      // Preserve specific error statuses (timeout, warning)
      // Only set to generic 'error' if not already set to a specific status
      if (state.status !== 'timeout' && state.status !== 'warning') {
        state.status = 'error';
      }

      state.error = error;
      throw error; // Rethrow for try/catch
    }
  }

  /**
   * Reset state to idle
   */
  function reset(): void {
    state.status = 'idle';
    state.error = null;
    state.evseId = null;
  }

  return {
    state: readonly(state) as Readonly<SessionStartState>,
    isStarting: readonly(isStarting),
    startSession,
    reset,
  };
}
