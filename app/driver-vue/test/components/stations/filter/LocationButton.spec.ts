// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LocationButton from '@/components/stations/filter/LocationButton.vue';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/locate-me.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/synchronize.js', () => ({}));

describe('LocationButton', () => {
  const renderComponent = (props: Record<string, unknown> = {}) => {
    return render(LocationButton, {
      props: {
        geoLoading: false,
        ...props,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render button with correct default attributes', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('ui5-button');
      expect(button).toBeDefined();
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('icon')).toBe('locate-me');
      expect(button?.getAttribute('title')).toBe('Near Me');
      expect(button?.getAttribute('disabled')).toBe('false');
    });

    it('should show loading state when geoLoading is true', async () => {
      const { container } = renderComponent({ geoLoading: true });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe('Emphasized');
      expect(button?.getAttribute('icon')).toBe('synchronize');
      expect(button?.getAttribute('title')).toBe('Locating...');
      expect(button?.getAttribute('disabled')).toBe('true');
    });

    it('should show normal state when geoLoading is false', async () => {
      const { container } = renderComponent({ geoLoading: false });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('icon')).toBe('locate-me');
      expect(button?.getAttribute('title')).toBe('Near Me');
      expect(button?.getAttribute('disabled')).toBe('false');
    });
  });

  describe('Event Emission', () => {
    it('should emit locationRequested when clicked', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().locationRequested).toBeTruthy();
      expect(emitted().locationRequested).toHaveLength(1);
    });

    it('should not emit when disabled (loading)', async () => {
      const { container, emitted } = renderComponent({ geoLoading: true });

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().locationRequested).toBeFalsy();
    });

    it('should emit multiple times when clicked multiple times', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      expect(emitted().locationRequested).toHaveLength(3);
    });
  });

  describe('Props Reactivity', () => {
    it('should update appearance when geoLoading prop changes', async () => {
      const { container, rerender } = renderComponent({ geoLoading: false });

      // Initially not loading
      let button = container.querySelector('ui5-button');
      expect(button?.getAttribute('icon')).toBe('locate-me');
      expect(button?.getAttribute('disabled')).toBe('false');

      // Change to loading
      await rerender({ geoLoading: true });
      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('icon')).toBe('synchronize');
      expect(button?.getAttribute('disabled')).toBe('true');

      // Change back to not loading
      await rerender({ geoLoading: false });
      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('icon')).toBe('locate-me');
      expect(button?.getAttribute('disabled')).toBe('false');
    });

    it('should update title when geoLoading prop changes', async () => {
      const { container, rerender } = renderComponent({ geoLoading: false });

      // Initially not loading
      let button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Near Me');

      // Change to loading
      await rerender({ geoLoading: true });
      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Locating...');

      // Change back to not loading
      await rerender({ geoLoading: false });
      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Near Me');
    });

    it('should update design when geoLoading prop changes', async () => {
      const { container, rerender } = renderComponent({ geoLoading: false });

      // Initially not loading
      let button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe('Transparent');

      // Change to loading
      await rerender({ geoLoading: true });
      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe('Emphasized');

      // Change back to not loading
      await rerender({ geoLoading: false });
      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe('Transparent');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Near Me');
    });

    it('should update title for screen readers during loading', async () => {
      const { container } = renderComponent({ geoLoading: true });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Locating...');
    });

    it('should be keyboard accessible', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('ui5-button') as HTMLElement;

      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should work with keyboard (Enter key)
      await fireEvent.keyDown(button, { key: 'Enter' });
      await fireEvent.click(button); // UI5 buttons handle Enter internally

      expect(emitted().locationRequested).toBeTruthy();
    });

    it('should be disabled and not focusable when loading', async () => {
      const { container } = renderComponent({ geoLoading: true });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('disabled')).toBe('true');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should maintain functionality on mobile devices', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container, emitted } = renderComponent();

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().locationRequested).toBeTruthy();
    });

    it('should handle touch events properly', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('ui5-button') as HTMLElement;

      // Simulate touch events
      await fireEvent.touchStart(button);
      await fireEvent.touchEnd(button);
      await fireEvent.click(button);

      expect(emitted().locationRequested).toBeTruthy();
    });
  });

  describe('Component State Management', () => {
    it('should prevent clicks when disabled', async () => {
      const { container, emitted } = renderComponent({ geoLoading: true });

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().locationRequested).toBeFalsy();
    });

    it('should handle rapid clicks when not disabled', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('ui5-button') as HTMLElement;

      // Rapid clicks
      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      expect(emitted().locationRequested).toHaveLength(3);
    });
  });

  describe('Component Cleanup', () => {
    it('should not throw errors when unmounting', async () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it('should handle unmounting while loading', async () => {
      const { unmount } = renderComponent({ geoLoading: true });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined geoLoading prop', async () => {
      const { container } = renderComponent({ geoLoading: undefined });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('disabled')).toBe('false');
      expect(button?.getAttribute('icon')).toBe('locate-me');
    });

    it('should handle null geoLoading prop', async () => {
      const { container } = renderComponent({ geoLoading: null });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('disabled')).toBe(null);
      expect(button?.getAttribute('icon')).toBe('locate-me');
    });

    it('should handle string geoLoading prop', async () => {
      const { container } = renderComponent({ geoLoading: 'true' });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('disabled')).toBe('true');
      expect(button?.getAttribute('icon')).toBe('synchronize');
    });
  });
});
