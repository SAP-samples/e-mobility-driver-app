// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useSessionStop } from '@/composables/useSessionStop';
import { useSessionsStore } from '@/store/sessions';

// Mock stores
vi.mock('@/store/sessions', () => ({
  useSessionsStore: vi.fn(),
}));

describe('useSessionStop', () => {
  let mockSessionsStore: ReturnType<typeof useSessionsStore>;

  beforeEach(() => {
    // Mock sessions store
    mockSessionsStore = {
      stopSession: vi.fn().mockResolvedValue(undefined),
      loadInProgressSessions: vi.fn().mockResolvedValue([]),
      loadCompleted: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof useSessionsStore>;

    vi.mocked(useSessionsStore).mockReturnValue(mockSessionsStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with idle state', () => {
      const { state, isStopping } = useSessionStop();

      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(isStopping.value).toBe(false);
    });
  });

  describe('stopSession', () => {
    it('should stop session and transition to stopped', async () => {
      const { stopSession, state } = useSessionStop();

      await stopSession(123);

      expect(state.status).toBe('stopped');
      expect(state.sessionId).toBe(123);
      expect(vi.mocked(mockSessionsStore.stopSession)).toHaveBeenCalledWith(123);
      expect(mockSessionsStore.loadInProgressSessions).toHaveBeenCalled();
      expect(mockSessionsStore.loadCompleted).toHaveBeenCalled();
    });

    it('should handle backend errors', async () => {
      const error = new Error('Backend error');
      vi.mocked(mockSessionsStore.stopSession).mockRejectedValue(error);

      const { stopSession, state } = useSessionStop();

      await expect(stopSession(123)).rejects.toThrow('Backend error');

      expect(state.status).toBe('error');
      expect(state.error).toBe(error);
    });

    it('should refresh both in-progress and completed sessions', async () => {
      const { stopSession } = useSessionStop();

      await stopSession(456);

      expect(mockSessionsStore.loadInProgressSessions).toHaveBeenCalledTimes(1);
      expect(mockSessionsStore.loadCompleted).toHaveBeenCalledTimes(1);
    });

    it('should pass sessionId as number to store', async () => {
      const { stopSession } = useSessionStop();

      await stopSession(789);

      expect(vi.mocked(mockSessionsStore.stopSession)).toHaveBeenCalledWith(789);
    });
  });

  describe('reset', () => {
    it('should reset state to idle', async () => {
      const { stopSession, reset, state } = useSessionStop();

      await stopSession(123);

      expect(state.status).toBe('stopped');
      expect(state.sessionId).toBe(123);

      reset();

      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.sessionId).toBeNull();
    });
  });

  describe('isStopping computed', () => {
    it('should be true when status is stopping', async () => {
      const { stopSession, isStopping } = useSessionStop();

      expect(isStopping.value).toBe(false);

      // Start stopping (but don't await yet)
      const promise = stopSession(123);

      await nextTick();
      expect(isStopping.value).toBe(true);

      await promise;
      expect(isStopping.value).toBe(false);
    });

    it('should be false for idle, stopped, and error statuses', () => {
      const { isStopping } = useSessionStop();

      // Initial state is idle
      expect(isStopping.value).toBe(false);
    });
  });

  describe('State transitions', () => {
    it('should update state through all transitions', async () => {
      const { stopSession, state } = useSessionStop();

      const promise = stopSession(123);

      await nextTick();
      expect(state.status).toBe('stopping');

      await promise;
      expect(state.status).toBe('stopped');
    });

    it('should not call loadInProgressSessions when error occurs', async () => {
      const error = new Error('Stop failed');
      vi.mocked(mockSessionsStore.stopSession).mockRejectedValue(error);

      const { stopSession } = useSessionStop();

      await expect(stopSession(123)).rejects.toThrow('Stop failed');

      // Should not have called refresh methods
      expect(mockSessionsStore.loadInProgressSessions).not.toHaveBeenCalled();
      expect(mockSessionsStore.loadCompleted).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases - Non-Error exceptions', () => {
    it('should handle non-Error exceptions by converting to Error', async () => {
      // Mock a non-Error rejection (e.g., string, number, object)
      vi.mocked(mockSessionsStore.stopSession).mockRejectedValue('String error message');

      const { stopSession, state } = useSessionStop();

      await expect(stopSession(123)).rejects.toThrow();

      // Should have converted to Error
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toBe('String error message');
      expect(state.status).toBe('error');
    });

    it('should handle object exceptions by converting to Error', async () => {
      // Mock an object rejection
      vi.mocked(mockSessionsStore.stopSession).mockRejectedValue({
        code: 500,
        msg: 'Server error',
      });

      const { stopSession, state } = useSessionStop();

      await expect(stopSession(123)).rejects.toThrow();

      // Should have converted to Error with stringified object
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toContain('object');
      expect(state.status).toBe('error');
    });
  });
});
