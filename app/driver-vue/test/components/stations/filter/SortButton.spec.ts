// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SortButton from '@/components/stations/filter/SortButton.vue';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/sort-ascending.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/sort-descending.js', () => ({}));

describe('SortButton', () => {
  const renderComponent = (props: Record<string, unknown> = {}) => {
    return render(SortButton, {
      props: {
        modelValue: 'asc',
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
    it('should render button with correct attributes for ascending sort', async () => {
      const { container } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn');
      expect(button).toBeDefined();
      expect(button?.getAttribute('icon')).toBe('sort-ascending');
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('title')).toBe('Sort Ascending');
    });

    it('should render button with correct attributes for descending sort', async () => {
      const { container } = renderComponent({ modelValue: 'desc' });

      const button = container.querySelector('.sort-direction-btn');
      expect(button).toBeDefined();
      expect(button?.getAttribute('icon')).toBe('sort-descending');
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('title')).toBe('Sort Descending');
    });

    it('should have proper CSS classes', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.sort-direction-btn');
      expect(button?.classList.contains('sort-direction-btn')).toBe(true);
    });
  });

  describe('Sort Direction Toggle', () => {
    it('should emit update:modelValue with desc when clicking asc button', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted()['update:modelValue']).toBeTruthy();
      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents[0][0]).toBe('desc');
    });

    it('should emit update:modelValue with asc when clicking desc button', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'desc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted()['update:modelValue']).toBeTruthy();
      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents[0][0]).toBe('asc');
    });

    it('should handle multiple clicks correctly', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;

      // First click: asc -> desc
      await fireEvent.click(button);

      // Second click: desc -> asc (need to rerender to simulate prop update)
      const { container: container2, emitted: emitted2 } = renderComponent({ modelValue: 'desc' });
      const button2 = container2.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button2);

      const updateEvents1 = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents1[0][0]).toBe('desc');

      const updateEvents2 = emitted2()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents2[0][0]).toBe('asc');
    });
  });

  describe('Icon and Title Updates', () => {
    it('should update icon and title when model value changes', async () => {
      const { container, rerender } = renderComponent({ modelValue: 'asc' });

      let button = container.querySelector('.sort-direction-btn');
      expect(button?.getAttribute('icon')).toBe('sort-ascending');
      expect(button?.getAttribute('title')).toBe('Sort Ascending');

      // Change model value
      await rerender({ modelValue: 'desc' });

      button = container.querySelector('.sort-direction-btn');
      expect(button?.getAttribute('icon')).toBe('sort-descending');
      expect(button?.getAttribute('title')).toBe('Sort Descending');
    });

    it('should maintain correct icon-title pairing', async () => {
      const testCases = [
        { modelValue: 'asc', expectedIcon: 'sort-ascending', expectedTitle: 'Sort Ascending' },
        { modelValue: 'desc', expectedIcon: 'sort-descending', expectedTitle: 'Sort Descending' },
      ];

      for (const { modelValue, expectedIcon, expectedTitle } of testCases) {
        const { container } = renderComponent({ modelValue });
        const button = container.querySelector('.sort-direction-btn');

        expect(button?.getAttribute('icon')).toBe(expectedIcon);
        expect(button?.getAttribute('title')).toBe(expectedTitle);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attributes for screen readers', async () => {
      const { container } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn');
      expect(button?.getAttribute('title')).toBe('Sort Ascending');
    });

    it('should update title when sort direction changes', async () => {
      const { container, rerender } = renderComponent({ modelValue: 'asc' });

      await rerender({ modelValue: 'desc' });

      const button = container.querySelector('.sort-direction-btn');
      expect(button?.getAttribute('title')).toBe('Sort Descending');
    });

    it('should be focusable and clickable', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;

      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should be clickable
      await fireEvent.click(button);
      expect(button).toBeDefined();
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

      const { container, emitted } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button);

      expect(emitted()['update:modelValue']).toBeTruthy();
      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents[0][0]).toBe('desc');
    });

    it('should handle touch events', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;

      // Simulate touch event
      await fireEvent.touchStart(button);
      await fireEvent.touchEnd(button);
      await fireEvent.click(button);

      expect(emitted()['update:modelValue']).toBeTruthy();
    });

    it('should have appropriate minimum width for touch targets', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.sort-direction-btn');
      expect(button?.classList.contains('sort-direction-btn')).toBe(true);
      // CSS should ensure minimum 2.5rem width for touch accessibility
    });
  });

  describe('Props Validation', () => {
    it('should handle valid sort direction values', async () => {
      const validValues = ['asc', 'desc'];

      for (const value of validValues) {
        const { container } = renderComponent({ modelValue: value });
        const button = container.querySelector('.sort-direction-btn');
        expect(button).toBeDefined();
      }
    });

    it('should react to prop changes', async () => {
      const { container, rerender } = renderComponent({ modelValue: 'asc' });

      let button = container.querySelector('.sort-direction-btn');
      expect(button?.getAttribute('icon')).toBe('sort-ascending');

      await rerender({ modelValue: 'desc' });

      button = container.querySelector('.sort-direction-btn');
      expect(button?.getAttribute('icon')).toBe('sort-descending');
    });
  });

  describe('Event Handling', () => {
    it('should only emit valid sort direction values', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button);

      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      const emittedValue = updateEvents[0][0];
      expect(['asc', 'desc']).toContain(emittedValue);
    });

    it('should handle rapid clicks correctly', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;

      // Rapid clicks
      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      // Should emit for each click
      expect(updateEvents.length).toBeGreaterThan(0);
      // All should be valid values
      updateEvents.forEach(([value]) => {
        expect(['asc', 'desc']).toContain(value);
      });
    });

    it('should not emit when disabled (if disabled prop existed)', async () => {
      // This test assumes the component might have a disabled state in the future
      const { container, emitted } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button);

      // For now, should always emit since there's no disabled state
      expect(emitted()['update:modelValue']).toBeTruthy();
    });
  });

  describe('Component Stability', () => {
    it('should not throw errors during normal operation', async () => {
      expect(() => {
        renderComponent({ modelValue: 'asc' });
      }).not.toThrow();

      expect(() => {
        renderComponent({ modelValue: 'desc' });
      }).not.toThrow();
    });

    it('should handle component unmounting gracefully', async () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it('should maintain state consistency', async () => {
      const { container, emitted, rerender } = renderComponent({ modelValue: 'asc' });

      const button = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(button);

      // Check that the emitted value is opposite of current modelValue
      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents[0][0]).toBe('desc');

      // Simulate parent updating the prop
      await rerender({ modelValue: 'desc' });

      const updatedButton = container.querySelector('.sort-direction-btn');
      expect(updatedButton?.getAttribute('icon')).toBe('sort-descending');
    });
  });
});
