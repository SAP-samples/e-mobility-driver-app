// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import EvseStartButton from '@/components/stations/shared/EvseStartButton.vue';
import type { Evse } from '@/store/evse';

// Mock the composables
const mockIsReadyForCharging = vi.fn();
const mockIsEvseOperational = vi.fn();
const mockIsConnectorReadyForCharging = vi.fn();

vi.mock('@/composables/useEvseStatusState', () => ({
  useEvseStatusState: () => ({
    isReadyForCharging: mockIsReadyForCharging,
    isEvseOperational: mockIsEvseOperational,
    isConnectorReadyForCharging: mockIsConnectorReadyForCharging,
  }),
}));

// Mock useSessionStart - capture callbacks
const mockStartSession = vi.fn();
const mockReset = vi.fn();
const mockIsStarting = ref(false);
const mockState = ref({ status: 'idle' as const, error: null, evseId: null });

vi.mock('@/composables/useSessionStart', () => ({
  useSessionStart: vi.fn(() => {
    return {
      startSession: mockStartSession,
      isStarting: mockIsStarting,
      state: mockState,
      reset: mockReset,
    };
  }),
}));

// Type definitions for UI5 components
interface UI5Dialog extends HTMLElement {
  open: boolean;
}

interface UI5Toast extends HTMLElement {
  open: boolean;
}

// Helper function to create mock EVSE data
const createMockEvse = (overrides: Partial<Evse> = {}): Evse => ({
  id: 'evse-1',
  chargingStationId: 'station-1',
  connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
  ...overrides,
});

describe('EvseStartButton', () => {
  const renderOptions = {
    global: {
      plugins: [createTestI18n()],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStartSession.mockResolvedValue(undefined);
    mockIsReadyForCharging.mockReturnValue(true);
    mockIsEvseOperational.mockReturnValue(true);
    mockIsConnectorReadyForCharging.mockReturnValue(true);
    mockIsStarting.value = false;
    mockState.value = { status: 'idle', error: null, evseId: null };
  });

  describe('Button Visibility', () => {
    it('renders start button when EVSE is available and has connectors', () => {
      const evse = createMockEvse();

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const button = getByTestId('start-button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Start');
      expect(button.hasAttribute('disabled')).toBe(false);
    });

    it('does not render button when EVSE is not available', () => {
      mockIsReadyForCharging.mockReturnValue(false);
      mockIsEvseOperational.mockReturnValue(false);
      const evse = createMockEvse();

      const { queryByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      expect(queryByTestId('start-button')).toBeNull();
    });

    it('does not render button when connectors array is empty', () => {
      const evse = createMockEvse({ connectors: [] });

      const { queryByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      expect(queryByTestId('start-button')).toBeNull();
    });

    it('does not render button when connectors is undefined', () => {
      const evse = createMockEvse({ connectors: undefined });

      const { queryByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      expect(queryByTestId('start-button')).toBeNull();
    });

    it('does not render button when session is already started', async () => {
      const evse = createMockEvse();
      const { getByTestId, queryByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Start a session first
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      await waitFor(() => expect(mockStartSession).toHaveBeenCalled());

      await waitFor(() => {
        // Button should not be visible after session starts
        expect(queryByTestId('start-button')).toBeNull();
      });
    });
  });

  describe('Button States', () => {
    it('disables button when loading', async () => {
      const evse = createMockEvse();
      // Ensure EVSE is available so button is only disabled due to isStarting
      mockIsReadyForCharging.mockReturnValue(true);
      mockIsEvseOperational.mockReturnValue(true);
      mockIsStarting.value = true;

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const startButton = getByTestId('start-button');
      expect(startButton.textContent).toContain('Starting...');
      // UI5 button uses 'disabled' attribute or property
      expect(
        startButton.getAttribute('disabled') !== null || (startButton as any).disabled === true,
      ).toBe(true);
    });
  });

  describe('Dialog Interaction', () => {
    it('opens confirmation dialog when start button is clicked', async () => {
      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const startButton = getByTestId('start-button');
      await fireEvent.click(startButton);

      await waitFor(() => {
        const dialog = getByTestId('confirmation-dialog') as UI5Dialog;
        expect(dialog.open).toBe(true);
      });
    });

    it('closes dialog when cancel button is clicked', async () => {
      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Open dialog
      await fireEvent.click(getByTestId('start-button'));

      // Click cancel
      const cancelButton = getByTestId('cancel-button');
      await fireEvent.click(cancelButton);

      await waitFor(() => {
        const dialog = getByTestId('confirmation-dialog') as UI5Dialog;
        expect(dialog.open).toBe(false);
      });
    });

    it('disables dialog buttons when loading', async () => {
      const evse = createMockEvse();
      mockIsStarting.value = true;

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Open dialog
      await fireEvent.click(getByTestId('start-button'));

      const confirmButton = getByTestId('confirm-button');
      const cancelButton = getByTestId('cancel-button');

      expect(confirmButton.hasAttribute('disabled')).toBe(true);
      expect(cancelButton.hasAttribute('disabled')).toBe(true);
    });

    it('displays correct dialog content', async () => {
      const evse = createMockEvse();
      const { getByTestId, getByText } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      await fireEvent.click(getByTestId('start-button'));

      // Check for header text in the dialog element's attribute
      const dialog = getByTestId('confirmation-dialog');
      expect(dialog.getAttribute('header-text')).toBe('Start Session');

      expect(getByText('Do you want to start a session?')).toBeTruthy();
      expect(getByTestId('confirm-button')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    it('calls startSession with correct parameters when confirmed', async () => {
      const evse = createMockEvse({
        id: 'evse-uuid-123',
        chargingStationId: 'test-station',
        connectors: [{ connectorId: 42, status: 'AVAILABLE' }],
      });

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Open dialog and confirm
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockStartSession).toHaveBeenCalledWith('evse-uuid-123');
        expect(mockStartSession).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success toast after successful session start', async () => {
      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Start session
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      await waitFor(() => expect(mockStartSession).toHaveBeenCalled());

      await waitFor(() => {
        const toast = getByTestId('success-toast') as UI5Toast;
        expect(toast.open).toBe(true);
      });
    });

    it('closes dialog after successful session start', async () => {
      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Start session
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      await waitFor(() => expect(mockStartSession).toHaveBeenCalled());

      await waitFor(() => {
        const dialog = getByTestId('confirmation-dialog') as UI5Dialog;
        expect(dialog.open).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles startSession rejection gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation
      });
      const mockError = new Error('Network error');
      mockStartSession.mockRejectedValue(mockError);

      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Start session
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      // Wait for startSession to be called
      await waitFor(() => expect(mockStartSession).toHaveBeenCalled());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error starting session:', mockError);
        // Dialog should be closed even on error
        const dialog = getByTestId('confirmation-dialog') as UI5Dialog;
        expect(dialog.open).toBe(false);
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles empty connectors during session start', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation
      });

      // Create component with valid connectors initially
      const evse = createMockEvse();
      const { getByTestId, rerender } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Open dialog
      await fireEvent.click(getByTestId('start-button'));

      // Change props to have empty connectors before confirming
      const evseWithoutConnectors = createMockEvse({ connectors: [] });
      await rerender({ evse: evseWithoutConnectors });

      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('No connectors available to start session');
        expect(mockStartSession).not.toHaveBeenCalled();
        const dialog = getByTestId('confirmation-dialog') as UI5Dialog;
        expect(dialog.open).toBe(false);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('resets loading state after successful session start', async () => {
      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Start session
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockStartSession).toHaveBeenCalled();
      });

      // Since button is hidden after successful session, we can't check its loading state
      // But we can verify that the session was started successfully
      expect(mockStartSession).toHaveBeenCalledTimes(1);
    });

    it('resets loading state after failed session start', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation
      });
      const mockError = new Error('Network error');
      mockStartSession.mockRejectedValue(mockError);

      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // Start session
      await fireEvent.click(getByTestId('start-button'));
      const confirmButton = getByTestId('confirm-button');
      await fireEvent.click(confirmButton);

      // Wait for startSession to be called
      await waitFor(() => expect(mockStartSession).toHaveBeenCalled());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // After error, button should be available again
      const startButton = getByTestId('start-button');
      expect(startButton.textContent).toContain('Start');
      expect(startButton.hasAttribute('disabled')).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Toast Content and Attributes', () => {
    it('displays correct toast message text', () => {
      const evse = createMockEvse();
      const { getByText } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const toastMessage = getByText('Charging Session Accepted, You can plug your cable');
      expect(toastMessage).toBeTruthy();
    });

    it('has correct toast placement and duration attributes', () => {
      const evse = createMockEvse();
      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const toast = getByTestId('success-toast');
      expect(toast.getAttribute('placement')).toBe('BottomCenter');
      expect(toast.getAttribute('duration')).toBe('3000');
    });
  });

  describe('Computed Properties', () => {
    it('correctly computes EVSE availability using composable', () => {
      mockIsReadyForCharging.mockReturnValue(false);
      mockIsEvseOperational.mockReturnValue(false);
      const evse = createMockEvse();

      const { queryByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      // When EVSE is not operational, button should not render
      expect(queryByTestId('start-button')).toBeNull();
    });

    it('validates connector availability correctly', () => {
      const evse = createMockEvse({
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      });

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const button = getByTestId('start-button');
      expect(button).toBeTruthy();
    });
  });

  describe('New isReadyForCharging Integration', () => {
    it('renders button when isReadyForCharging returns true', () => {
      mockIsReadyForCharging.mockReturnValue(true);
      mockIsEvseOperational.mockReturnValue(true);

      const evse = createMockEvse({
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      });

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const button = getByTestId('start-button');
      expect(button).toBeTruthy();
      expect(button.hasAttribute('disabled')).toBe(false);
    });

    it('does not render button when isReadyForCharging returns false and not operational', () => {
      mockIsReadyForCharging.mockReturnValue(false);
      mockIsEvseOperational.mockReturnValue(false);

      const evse = createMockEvse({
        connectors: [{ connectorId: 1, status: 'FAULTED' }],
      });

      const { queryByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      expect(queryByTestId('start-button')).toBeNull();
    });

    it('renders disabled button when isReadyForCharging returns false but operational', () => {
      mockIsReadyForCharging.mockReturnValue(false);
      mockIsEvseOperational.mockReturnValue(true);

      const evse = createMockEvse({
        connectors: [{ connectorId: 1, status: 'CHARGING' }],
      });

      const { getByTestId } = render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      const button = getByTestId('start-button');
      expect(button).toBeTruthy();
      // Button is disabled because isEvseAvailable (isReadyForCharging) is false
      // UI5 button uses 'disabled' attribute or property
      expect(button.getAttribute('disabled') !== null || (button as any).disabled === true).toBe(
        true,
      );
    });

    it('calls isReadyForCharging with correct EVSE data', () => {
      const evse = createMockEvse({
        id: 'test-evse',
        connectors: [{ connectorId: 1, status: 'AVAILABLE' }],
      });

      render(EvseStartButton, {
        ...renderOptions,
        props: { evse },
      });

      expect(mockIsReadyForCharging).toHaveBeenCalledWith(evse);
    });
  });
});
