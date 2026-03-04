// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { computed, reactive, readonly } from 'vue';
import type { Ref } from 'vue';

import { useSessionsStore } from '@/store/sessions';

/**
 * Session stop status types
 */
export type SessionStopStatus = 'idle' | 'stopping' | 'stopped' | 'error';

/**
 * Session stop state
 */
export interface SessionStopState {
  status: SessionStopStatus;
  error: Error | null;
  sessionId: number | null;
}

/**
 * Return type for useSessionStop composable
 */
export interface UseSessionStopReturn {
  /**
   * Current state (readonly)
   */
  state: Readonly<SessionStopState>;

  /**
   * Whether a session stop is in progress
   */
  isStopping: Readonly<Ref<boolean>>;

  /**
   * Stop a charging session
   * @param sessionId - Session identifier
   * @throws Error if session fails to stop
   */
  stopSession: (sessionId: number) => Promise<void>;

  /**
   * Reset state to idle
   */
  reset: () => void;
}

/**
 * Composable for stopping charging sessions
 *
 * Handles the session stop workflow:
 * 1. Calls backend to stop session
 * 2. Refreshes session lists (in-progress and completed)
 * 3. Handles errors
 *
 * State changes can be monitored via watchers:
 * - 'stopping' → Session stop initiated
 * - 'stopped' → Session stopped successfully
 * - 'error' → An error occurred
 *
 * @returns Session stop controls and state
 *
 * @example
 * ```typescript
 * const { stopSession, state } = useSessionStop();
 *
 * // Watch for state changes
 * watch(() => state.status, (status) => {
 *   if (status === 'stopped') showToast('Session stopped');
 * });
 *
 * // Stop session with try/catch
 * try {
 *   await stopSession(123);
 *   showToast('Session stopped successfully');
 * } catch (error) {
 *   showError(error.message);
 * }
 * ```
 */
export function useSessionStop(): UseSessionStopReturn {
  const sessionsStore = useSessionsStore();

  // Internal state
  const state = reactive<SessionStopState>({
    status: 'idle',
    error: null,
    sessionId: null,
  });

  // Computed properties
  const isStopping = computed(() => state.status === 'stopping');

  /**
   * Stop a charging session
   */
  async function stopSession(sessionId: number): Promise<void> {
    try {
      // Reset state
      state.sessionId = sessionId;
      state.error = null;
      state.status = 'stopping';

      // 1. Stop charging session via backend
      await sessionsStore.stopSession(sessionId);

      // 2. Refresh session lists
      await Promise.all([sessionsStore.loadInProgressSessions(), sessionsStore.loadCompleted()]);

      // 3. Update status to stopped
      state.status = 'stopped';
    } catch (err) {
      // Handle errors from backend
      const error = err instanceof Error ? err : new Error(String(err));
      state.status = 'error';
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
    state.sessionId = null;
  }

  return {
    state: readonly(state) as Readonly<SessionStopState>,
    isStopping: readonly(isStopping),
    stopSession,
    reset,
  };
}
