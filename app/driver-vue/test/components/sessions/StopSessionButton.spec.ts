// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import StopSessionButton from '@/components/sessions/StopSessionButton.vue';

// Mock useSessionStop
const mockStopSession = vi.fn();
const mockReset = vi.fn();
const mockIsStopping = ref(false);
const mockState = ref({ status: 'idle' as const, error: null, sessionId: null });

vi.mock('@/composables/useSessionStop', () => ({
  useSessionStop: vi.fn(() => {
    return {
      stopSession: mockStopSession,
      isStopping: mockIsStopping,
      state: mockState,
      reset: mockReset,
    };
  }),
}));

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('StopSessionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStopSession.mockResolvedValue(undefined);
    mockIsStopping.value = false;
    mockState.value = { status: 'idle', error: null, sessionId: null };
  });

  it('renders without crashing', () => {
    const { container } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });
    expect(container).toBeTruthy();
  });

  it('renders stop button when not stopped', () => {
    const { getByText } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });
    expect(getByText('Stop')).toBeTruthy();
  });

  it('does not render stop button when stopped', () => {
    const { queryByText } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: true,
      },
    });
    expect(queryByText('Stop')).toBeNull();
  });

  it('opens dialog when stop button is clicked', async () => {
    const { getByText, container } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });
    const stopButton = getByText('Stop');
    await fireEvent.click(stopButton);

    // Dialog should be open
    const dialog = container.querySelector('ui5-dialog') as HTMLElement & { open: boolean };
    expect(dialog).toBeTruthy();
    expect(dialog.open).toBe(true);
  });

  it('shows toast and closes dialog when confirm is clicked', async () => {
    const { getByText, container } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });
    const stopButton = getByText('Stop');
    await fireEvent.click(stopButton);

    // Find confirm button by attribute
    const confirmButton = container.querySelector('ui5-toolbar-button[text="Confirm"]');
    expect(confirmButton).toBeTruthy();
    await fireEvent.click(confirmButton!);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(mockStopSession).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      // Toast should be open
      const toast = container.querySelector('ui5-toast') as HTMLElement & { open: boolean };
      expect(toast).toBeTruthy();
      expect(toast.open).toBe(true);

      // Dialog should be closed
      const dialog = container.querySelector('ui5-dialog') as HTMLElement & { open: boolean };
      expect(dialog.open).toBe(false);
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    const { getByText, container } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });
    const stopButton = getByText('Stop');
    await fireEvent.click(stopButton);

    // Find cancel button by attribute
    const cancelButton = container.querySelector('ui5-toolbar-button[text="Cancel"]');
    expect(cancelButton).toBeTruthy();
    await fireEvent.click(cancelButton!);

    const dialog = container.querySelector('ui5-dialog') as HTMLElement & { open: boolean };
    expect(dialog.open).toBe(false);
  });

  it('handles stopSession error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Stop session failed');
    mockStopSession.mockRejectedValue(mockError);

    const { getByText, container } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });

    const stopButton = getByText('Stop');
    await fireEvent.click(stopButton);

    // Find confirm button by attribute
    const confirmButton = container.querySelector('ui5-toolbar-button[text="Confirm"]');
    await fireEvent.click(confirmButton!);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(mockStopSession).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      // Dialog should be closed even on error
      const dialog = container.querySelector('ui5-dialog') as HTMLElement & { open: boolean };
      expect(dialog.open).toBe(false);

      // Toast should not be open on error
      const toast = container.querySelector('ui5-toast') as HTMLElement & { open: boolean };
      expect(toast.open).toBe(false);

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalledWith('Error stopping session:', mockError);
    });

    consoleSpy.mockRestore();
  });

  it('works correctly with multiple component instances', async () => {
    // Test that multiple instances don't interfere with each other
    const { container } = render(
      {
        template: `
        <div>
          <StopSessionButton :sessionId="1" :stopped="false" />
          <StopSessionButton :sessionId="2" :stopped="false" />
        </div>
      `,
        components: { StopSessionButton },
      },
      {
        ...renderOptions,
      },
    );

    const stopButtons = container.querySelectorAll('[data-testid="stop-session-button"]');
    expect(stopButtons).toHaveLength(2);

    // Click first button
    await fireEvent.click(stopButtons[0]);

    const dialogs = container.querySelectorAll('ui5-dialog');
    expect(dialogs).toHaveLength(2);

    // Only first dialog should be open
    expect((dialogs[0] as HTMLElement & { open: boolean }).open).toBe(true);
    expect((dialogs[1] as HTMLElement & { open: boolean }).open).toBe(false);
  });

  it('has correct toast placement attribute', () => {
    const { container } = render(StopSessionButton, {
      ...renderOptions,
      props: {
        sessionId: 1,
        stopped: false,
      },
    });

    const toast = container.querySelector('ui5-toast');
    expect(toast).toBeTruthy();
    expect(toast?.getAttribute('placement')).toBe('BottomCenter');
  });
});
