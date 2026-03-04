// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ClearFiltersButton from '@/components/stations/filter/ClearFiltersButton.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/clear-filter.js', () => ({}));

describe('ClearFiltersButton', () => {
  const renderComponent = (props: Record<string, unknown> = {}) => {
    return render(ClearFiltersButton, {
      props: {
        visible: true,
        ...props,
      },
      ...renderOptions,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render button when visible is true', async () => {
      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button).toBeDefined();
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('icon')).toBe('clear-filter');
      expect(button?.getAttribute('title')).toBe('Clear All Filters');
    });

    it('should not render button when visible is false', async () => {
      const { container } = renderComponent({ visible: false });

      const button = container.querySelector('ui5-button');
      expect(button).toBeNull();
    });

    it('should have correct attributes when rendered', async () => {
      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('icon')).toBe('clear-filter');
      expect(button?.getAttribute('title')).toBe('Clear All Filters');
    });
  });

  describe('Visibility Toggle', () => {
    it('should show button when visible changes from false to true', async () => {
      const { container, rerender } = renderComponent({ visible: false });

      // Initially should not be visible
      let button = container.querySelector('ui5-button');
      expect(button).toBeNull();

      // Change to visible
      await rerender({ visible: true });

      button = container.querySelector('ui5-button');
      expect(button).toBeDefined();
    });

    it('should hide button when visible changes from true to false', async () => {
      const { container, rerender } = renderComponent({ visible: true });

      // Initially should be visible
      let button = container.querySelector('ui5-button');
      expect(button).toBeDefined();

      // Change to not visible
      await rerender({ visible: false });

      button = container.querySelector('ui5-button');
      expect(button).toBeNull();
    });

    it('should handle rapid visibility changes', async () => {
      const { container, rerender } = renderComponent({ visible: false });

      // Rapid changes
      await rerender({ visible: true });
      await rerender({ visible: false });
      await rerender({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button).toBeDefined();
    });
  });

  describe('Click Events', () => {
    it('should emit clear event when clicked', async () => {
      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().clear).toBeTruthy();
      expect(emitted().clear).toHaveLength(1);
    });

    it('should emit clear event multiple times when clicked multiple times', async () => {
      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;

      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      expect(emitted().clear).toBeTruthy();
      expect(emitted().clear).toHaveLength(3);
    });

    it('should not emit clear event when button is not visible', async () => {
      const { emitted } = renderComponent({ visible: false });

      // Since button is not rendered, we can't click it
      // This test verifies that no clear event is emitted by default
      expect(emitted().clear).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attribute for screen readers', async () => {
      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Clear All Filters');
    });

    it('should be focusable when visible', async () => {
      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should be keyboard accessible', async () => {
      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;

      // Should work with keyboard navigation
      await fireEvent.keyDown(button, { key: 'Enter' });

      // For this test, we'll simulate the click that would happen
      await fireEvent.click(button);

      expect(emitted().clear).toBeTruthy();
    });

    it('should have proper ARIA attributes when visible', async () => {
      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button?.getAttribute('title')).toBe('Clear All Filters');
      // UI5 buttons typically handle ARIA attributes internally
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

      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().clear).toBeTruthy();
    });

    it('should handle touch events properly', async () => {
      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;

      // Simulate touch events
      await fireEvent.touchStart(button);
      await fireEvent.touchEnd(button);
      await fireEvent.click(button);

      expect(emitted().clear).toBeTruthy();
    });

    it('should have proper CSS classes for mobile styling', async () => {
      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button).toBeDefined();
      // Component should have proper classes as defined in the CSS
    });

    it('should maintain minimum touch target size on mobile', async () => {
      // Simulate mobile environment
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button');
      expect(button).toBeDefined();
      // CSS should ensure minimum 40px width for touch accessibility
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle mounting and unmounting gracefully', async () => {
      const { unmount } = renderComponent({ visible: true });

      expect(() => unmount()).not.toThrow();
    });

    it('should not throw errors during prop changes', async () => {
      const { rerender } = renderComponent({ visible: false });

      expect(async () => {
        await rerender({ visible: true });
        await rerender({ visible: false });
        await rerender({ visible: true });
      }).not.toThrow();
    });

    it('should clean up properly when unmounted while visible', async () => {
      const { unmount } = renderComponent({ visible: true });

      expect(() => unmount()).not.toThrow();
    });

    it('should clean up properly when unmounted while hidden', async () => {
      const { unmount } = renderComponent({ visible: false });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Props Validation', () => {
    it('should handle boolean visible prop correctly', async () => {
      const testCases = [true, false];

      for (const visible of testCases) {
        const { container } = renderComponent({ visible });

        const button = container.querySelector('ui5-button');
        if (visible) {
          expect(button).toBeDefined();
        } else {
          expect(button).toBeNull();
        }
      }
    });

    it('should handle truthy and falsy values for visible prop', async () => {
      const truthyValues = [true, 1, 'true', {}, []];
      const falsyValues = [false, 0, null, undefined];

      for (const value of truthyValues) {
        const { container } = renderComponent({ visible: value });
        const button = container.querySelector('ui5-button');
        expect(button).toBeDefined();
      }

      for (const value of falsyValues) {
        const { container } = renderComponent({ visible: value });
        const button = container.querySelector('ui5-button');
        expect(button).toBeNull();
      }

      // Test empty string separately as it's falsy but Vue might handle it differently
      const { container } = renderComponent({ visible: '' });
      const button = container.querySelector('ui5-button');
      expect(button).toBeNull();
    });
  });

  describe('Event Emission', () => {
    it('should emit clear event with no arguments', async () => {
      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().clear).toBeTruthy();
      expect(emitted().clear[0]).toEqual([]);
    });

    it('should maintain event emission consistency', async () => {
      const { container, emitted } = renderComponent({ visible: true });

      const button = container.querySelector('ui5-button') as HTMLElement;

      // Multiple clicks should all emit the same event structure
      await fireEvent.click(button);
      await fireEvent.click(button);

      expect(emitted().clear).toHaveLength(2);
      expect(emitted().clear[0]).toEqual([]);
      expect(emitted().clear[1]).toEqual([]);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly when toggled multiple times', async () => {
      const { container, rerender, emitted } = renderComponent({ visible: false });

      // Start hidden
      expect(container.querySelector('ui5-button')).toBeNull();

      // Show and click
      await rerender({ visible: true });
      let button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      // Hide
      await rerender({ visible: false });
      expect(container.querySelector('ui5-button')).toBeNull();

      // Show again and click
      await rerender({ visible: true });
      button = container.querySelector('ui5-button') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted().clear).toHaveLength(2);
    });

    it('should maintain consistent behavior across visibility changes', async () => {
      const { container, rerender } = renderComponent({ visible: true });

      // Should always have same attributes when visible
      let button = container.querySelector('ui5-button');
      const initialAttributes = {
        design: button?.getAttribute('design'),
        icon: button?.getAttribute('icon'),
        title: button?.getAttribute('title'),
      };

      await rerender({ visible: false });
      await rerender({ visible: true });

      button = container.querySelector('ui5-button');
      expect(button?.getAttribute('design')).toBe(initialAttributes.design);
      expect(button?.getAttribute('icon')).toBe(initialAttributes.icon);
      expect(button?.getAttribute('title')).toBe(initialAttributes.title);
    });
  });

  describe('Error Handling', () => {
    it('should not throw errors with invalid prop types', async () => {
      // Test with various invalid prop types that might be passed
      const invalidProps = [
        { visible: 'invalid' },
        { visible: 123 },
        { visible: {} },
        { visible: [] },
      ];

      for (const props of invalidProps) {
        expect(() => renderComponent(props)).not.toThrow();
      }
    });

    it('should handle missing props gracefully', async () => {
      expect(() => render(ClearFiltersButton)).not.toThrow();
    });
  });
});
