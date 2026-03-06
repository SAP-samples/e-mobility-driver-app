// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useSessionStart } from '@/composables/useSessionStart';
import { useEvseStore } from '@/store/evse';
import { useSessionsStore } from '@/store/sessions';

// Mock stores
vi.mock('@/store/sessions', () => ({
  useSessionsStore: vi.fn(),
}));

vi.mock('@/store/evse', () => ({
  useEvseStore: vi.fn(),
}));

// Create a mock function that will be shared
const mockComputeEvseOcpiStatus = vi.fn();

vi.mock('@/composables/useEvseStatusState', () => ({
  useEvseStatusState: () => ({
    computeEvseOcpiStatus: mockComputeEvseOcpiStatus,
  }),
}));

describe('useSessionStart', () => {
  let mockSessionsStore: ReturnType<typeof useSessionsStore>;
  let mockEvseStore: ReturnType<typeof useEvseStore>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock sessions store
    mockSessionsStore = {
      startSession: vi.fn().mockResolvedValue(undefined),
      loadInProgressSessions: vi.fn().mockResolvedValue([]),
      sessionsInProgress: {
        data: [],
      },
    } as unknown as ReturnType<typeof useSessionsStore>;

    // Mock EVSE store with properly typed mock
    const mockFetchById = vi.fn();
    mockEvseStore = {
      fetchById: mockFetchById,
    } as unknown as ReturnType<typeof useEvseStore>;

    vi.mocked(useSessionsStore).mockReturnValue(mockSessionsStore);
    vi.mocked(useEvseStore).mockReturnValue(mockEvseStore);

    // Reset the shared mock
    mockComputeEvseOcpiStatus.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with idle state', () => {
      const { state, isStarting } = useSessionStart();

      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.evseId).toBeNull();
      expect(isStarting.value).toBe(false);
    });
  });

  describe('startSession', () => {
    it('should start session and transition to success when EVSE becomes OCCUPIED', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('OCCUPIED');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123');

      // Wait for initial delay (2s) + first poll
      await vi.advanceTimersByTimeAsync(2000);
      await promise;

      expect(state.status).toBe('success');
      expect(state.evseId).toBe('evse-123');
      expect(mockSessionsStore.startSession).toHaveBeenCalledWith('evse-123');
      expect(mockSessionsStore.loadInProgressSessions).toHaveBeenCalled();
    });

    it('should transition to preparing state when EVSE is PREPARING', async () => {
      vi.mocked(mockEvseStore.fetchById)
        .mockResolvedValueOnce({ id: 'evse-123' } as never)
        .mockResolvedValueOnce({ id: 'evse-123' } as never);

      mockComputeEvseOcpiStatus.mockReturnValueOnce('PREPARING').mockReturnValueOnce('OCCUPIED');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123');

      // Wait for initial delay (2s) + first poll to complete (PREPARING)
      await vi.advanceTimersByTimeAsync(2000);
      await nextTick();
      expect(state.status).toBe('preparing');

      // Second poll delay + poll (OCCUPIED)
      await vi.advanceTimersByTimeAsync(2000);
      await promise;

      expect(state.status).toBe('success');
    });

    it('should transition to timeout when EVSE stays in PREPARING after max attempts', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('PREPARING');

      const { startSession, state } = useSessionStart({
        maxAttempts: 3,
        pollingDelays: [1000, 2000, 3000],
      });

      const promise = startSession('evse-123').catch((err) => err);

      // Advance through all polling attempts
      await vi.advanceTimersByTimeAsync(1000 + 2000 + 3000);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('timeout');
      expect(state.status).toBe('timeout');
      expect(state.error?.message).toContain('timeout');
    });

    it('should transition to warning when EVSE becomes AVAILABLE', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('AVAILABLE');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123').catch((err) => err);

      // Wait for initial delay (2s) + first poll
      await vi.advanceTimersByTimeAsync(2000);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('AVAILABLE');
      expect(state.status).toBe('warning');
      expect(state.error?.message).toContain('AVAILABLE');
    });

    it('should handle backend errors', async () => {
      const error = new Error('Backend error');
      vi.mocked(mockSessionsStore.startSession).mockRejectedValue(error);

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123');

      await expect(promise).rejects.toThrow('Backend error');

      expect(state.status).toBe('error');
      expect(state.error).toBe(error);
    });

    it('should use exponential backoff for polling', async () => {
      const pollingDelays = [1000, 2000, 3000];

      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('OCCUPIED');

      const { startSession } = useSessionStart({
        pollingDelays,
        maxAttempts: 3,
      });

      const promise = startSession('evse-123');

      // Initial delay (2s) + all polling delays
      await vi.advanceTimersByTimeAsync(2000 + 1000 + 2000);
      await promise;

      expect(vi.mocked(mockEvseStore.fetchById)).toHaveBeenCalledTimes(3);
    });
  });

  describe('reset', () => {
    it('should reset state to idle', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('OCCUPIED');

      const { startSession, reset, state } = useSessionStart();

      const promise = startSession('evse-123');

      // Wait for initial delay (2s) + first poll
      await vi.advanceTimersByTimeAsync(2000);
      await promise;

      expect(state.status).toBe('success');
      expect(state.evseId).toBe('evse-123');

      reset();

      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.evseId).toBeNull();
    });
  });

  describe('isStarting computed', () => {
    it('should be true when status is starting or preparing', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('PREPARING');

      const { startSession, isStarting } = useSessionStart({
        maxAttempts: 1,
        pollingDelays: [1000],
      });

      expect(isStarting.value).toBe(false);

      const promise = startSession('evse-123').catch(() => {});

      await nextTick();
      expect(isStarting.value).toBe(true);

      // Advance timer: initial delay (2s) + polling delay (1s)
      await vi.advanceTimersByTimeAsync(2000 + 1000);
      await promise;

      // After timeout, isStarting should be false
      expect(isStarting.value).toBe(false);
    });
  });

  describe('State transitions', () => {
    it('should update state through all transitions', async () => {
      vi.mocked(mockEvseStore.fetchById)
        .mockResolvedValueOnce({ id: 'evse-123' } as never)
        .mockResolvedValueOnce({ id: 'evse-123' } as never);

      mockComputeEvseOcpiStatus.mockReturnValueOnce('PREPARING').mockReturnValueOnce('OCCUPIED');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123');

      await nextTick();
      expect(state.status).toBe('starting');

      // Wait for initial delay (2s) + first poll to complete (PREPARING)
      await vi.advanceTimersByTimeAsync(2000);
      await nextTick();
      expect(state.status).toBe('preparing');

      // Wait for second poll (OCCUPIED)
      await vi.advanceTimersByTimeAsync(2000);
      await promise;
      expect(state.status).toBe('success');
    });
  });

  describe('Edge cases - Unknown OCPI status', () => {
    it('should continue polling on unknown status until OCCUPIED', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      // Mock unknown status first, then OCCUPIED
      mockComputeEvseOcpiStatus
        .mockReturnValueOnce(null as never)
        .mockReturnValueOnce('UNKNOWN' as never)
        .mockReturnValueOnce('OCCUPIED');

      const { startSession, state } = useSessionStart({
        maxAttempts: 3,
        pollingDelays: [100, 200, 300],
      });

      const promise = startSession('evse-123');

      // Advance through initial delay (2s) + polling delays
      await vi.advanceTimersByTimeAsync(2000 + 100 + 200);
      await promise;

      expect(state.status).toBe('success');
      expect(mockSessionsStore.loadInProgressSessions).toHaveBeenCalled();
    });

    it('should timeout when unknown status persists after max attempts', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      // Mock unknown status
      mockComputeEvseOcpiStatus.mockReturnValue('UNKNOWN_STATUS' as never);

      const { startSession, state } = useSessionStart({
        maxAttempts: 3,
        pollingDelays: [1000, 2000, 3000],
      });

      const promise = startSession('evse-123').catch((err) => err);

      // Advance through all polling attempts
      await vi.advanceTimersByTimeAsync(1000 + 2000 + 3000);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Session start timeout');
      expect(state.status).toBe('timeout');
    });
  });

  describe('Configuration edge cases', () => {
    it('should handle maxAttempts exceeding pollingDelays array length', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);

      // Mock PREPARING for 7 attempts, but only 3 delays configured
      mockComputeEvseOcpiStatus
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('PREPARING')
        .mockReturnValueOnce('OCCUPIED');

      const { startSession, state } = useSessionStart({
        maxAttempts: 7,
        pollingDelays: [100, 200, 300], // Only 3 delays for 7 attempts
      });

      const promise = startSession('evse-123');

      // Initial delay (2s) + Should use: 100, 200, 300, 300, 300, 300 (plateau at last delay)
      await vi.advanceTimersByTimeAsync(2000 + 100 + 200 + 300 + 300 + 300 + 300);
      await promise;

      expect(state.status).toBe('success');
      expect(vi.mocked(mockEvseStore.fetchById)).toHaveBeenCalledTimes(7);
    });
  });

  describe('Edge cases - Other OCPI statuses', () => {
    it('should handle RESERVED status as warning', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('RESERVED');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123').catch((err) => err);

      // Wait for initial delay (2s) + first poll
      await vi.advanceTimersByTimeAsync(2000);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('RESERVED');
      expect(state.status).toBe('warning');
      expect(state.error?.message).toContain('RESERVED');
    });

    it('should handle OUTOFORDER status as warning', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('OUTOFORDER');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123').catch((err) => err);

      // Wait for initial delay (2s) + first poll
      await vi.advanceTimersByTimeAsync(2000);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('OUTOFORDER');
      expect(state.status).toBe('warning');
      expect(state.error?.message).toContain('OUTOFORDER');
    });

    it('should handle INOPERATIVE status as warning', async () => {
      vi.mocked(mockEvseStore.fetchById).mockResolvedValue({ id: 'evse-123' } as never);
      mockComputeEvseOcpiStatus.mockReturnValue('INOPERATIVE');

      const { startSession, state } = useSessionStart();

      const promise = startSession('evse-123').catch((err) => err);

      // Wait for initial delay (2s) + first poll
      await vi.advanceTimersByTimeAsync(2000);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('INOPERATIVE');
      expect(state.status).toBe('warning');
      expect(state.error?.message).toContain('INOPERATIVE');
    });
  });
});
