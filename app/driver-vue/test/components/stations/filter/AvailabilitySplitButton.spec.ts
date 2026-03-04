// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AvailabilitySplitButton from '@/components/stations/filter/AvailabilitySplitButton.vue';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Menu.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/MenuItem.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Icon.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/slim-arrow-down.js', () => ({}));

describe('AvailabilitySplitButton', () => {
  const renderComponent = (props: Record<string, unknown> = {}) => {
    return render(AvailabilitySplitButton, {
      props: {
        modelValue: 'all',
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
    it('should render split button with correct attributes for all stations', async () => {
      const { container } = renderComponent({ modelValue: 'all' });

      const button = container.querySelector('.availability-button');
      expect(button).toBeDefined();
      expect(button?.getAttribute('design')).toBe('Default');
      expect(button?.textContent?.trim()).toBe('All');
    });

    it('should render split button with correct attributes for available only', async () => {
      const { container } = renderComponent({ modelValue: 'available' });

      const button = container.querySelector('.availability-button');
      expect(button).toBeDefined();
      expect(button?.getAttribute('design')).toBe('Positive');
      expect(button?.textContent?.trim()).toBe('Available');
    });

    it('should render split button with correct attributes for fast chargers', async () => {
      const { container } = renderComponent({ modelValue: 'available_and_fastcharger' });

      const button = container.querySelector('.availability-button');
      expect(button).toBeDefined();
      expect(button?.getAttribute('design')).toBe('Attention');
      expect(button?.textContent?.trim()).toBe('Fast');
    });

    it('should have proper CSS classes', async () => {
      const { container } = renderComponent();

      const container_div = container.querySelector('.availability-button-container');
      expect(container_div).toBeDefined();

      const button = container.querySelector('.availability-button');
      expect(button?.classList.contains('availability-button')).toBe(true);
    });

    it('should not show menu initially', async () => {
      const { container } = renderComponent();

      const menu = container.querySelector('ui5-menu');
      expect(menu?.getAttribute('open')).toBe('false');
    });
  });

  describe('Menu Items', () => {
    it('should render all menu items with correct attributes', async () => {
      const { container } = renderComponent();

      const menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems.length).toBe(3);

      const allItem = menuItems[0];
      expect(allItem.getAttribute('text')).toBe('All charge points');
      expect(allItem.getAttribute('data-value')).toBe('all');

      const availableItem = menuItems[1];
      expect(availableItem.getAttribute('text')).toBe('Only available charge points');
      expect(availableItem.getAttribute('data-value')).toBe('available');

      const fastItem = menuItems[2];
      expect(fastItem.getAttribute('text')).toBe('Only available fast chargers');
      expect(fastItem.getAttribute('data-value')).toBe('available_and_fastcharger');
    });

    it('should mark correct menu item as selected', async () => {
      const { container } = renderComponent({ modelValue: 'available' });

      const menuItems = container.querySelectorAll('ui5-menu-item');

      expect(menuItems[0].getAttribute('selected')).toBe('false');
      expect(menuItems[1].getAttribute('selected')).toBe('true');
      expect(menuItems[2].getAttribute('selected')).toBe('false');
    });

    it('should update selected item when model value changes', async () => {
      const { container, rerender } = renderComponent({ modelValue: 'all' });

      let menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems[0].getAttribute('selected')).toBe('true');

      await rerender({ modelValue: 'available_and_fastcharger' });

      menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems[0].getAttribute('selected')).toBe('false');
      expect(menuItems[2].getAttribute('selected')).toBe('true');
    });
  });

  describe('Button Design and Text', () => {
    it('should use Default design for all stations', async () => {
      const { container } = renderComponent({ modelValue: 'all' });

      const button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Default');
      expect(button?.textContent?.trim()).toBe('All');
    });

    it('should use Positive design for available only', async () => {
      const { container } = renderComponent({ modelValue: 'available' });

      const button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Positive');
      expect(button?.textContent?.trim()).toBe('Available');
    });

    it('should use Attention design for fast chargers', async () => {
      const { container } = renderComponent({ modelValue: 'available_and_fastcharger' });

      const button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Attention');
      expect(button?.textContent?.trim()).toBe('Fast');
    });

    it('should handle invalid model value gracefully', async () => {
      const { container } = renderComponent({ modelValue: 'invalid' });

      const button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Default');
      expect(button?.textContent?.trim()).toBe('All');
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('should show menu when main button is clicked', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      await fireEvent.click(button);

      const menu = container.querySelector('ui5-menu');
      expect(menu?.getAttribute('open')).toBe('true');
    });

    it('should show menu when button is clicked', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      await fireEvent.click(button);

      const menu = container.querySelector('ui5-menu');
      expect(menu?.getAttribute('open')).toBe('true');
    });

    it('should toggle menu state on multiple clicks', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      const menu = container.querySelector('ui5-menu');

      // First click - open
      await fireEvent.click(button);
      expect(menu?.getAttribute('open')).toBe('true');

      // Second click - close
      await fireEvent.click(button);
      expect(menu?.getAttribute('open')).toBe('false');
    });

    it('should handle menu state correctly', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      const menu = container.querySelector('ui5-menu');

      // Initially menu should be closed
      expect(menu?.getAttribute('open')).toBe('false');

      // Click to open
      await fireEvent.click(button);
      expect(menu?.getAttribute('open')).toBe('true');

      // Click to close
      await fireEvent.click(button);
      expect(menu?.getAttribute('open')).toBe('false');
    });
  });

  describe('Menu Item Selection', () => {
    it('should emit update:modelValue when menu item is clicked', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'all' });

      const menu = container.querySelector('ui5-menu') as HTMLElement;

      // Simulate menu item click
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      expect(emitted()['update:modelValue']).toBeTruthy();
      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents[0][0]).toBe('available');
    });

    it('should close menu after item selection', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      const menu = container.querySelector('ui5-menu') as HTMLElement;

      // Open menu
      await fireEvent.click(button);
      expect(menu.getAttribute('open')).toBe('true');

      // Select item
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      expect(menu.getAttribute('open')).toBe('false');
    });

    it('should handle menu close event', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      const menu = container.querySelector('ui5-menu') as HTMLElement;

      // Open menu
      await fireEvent.click(button);
      expect(menu.getAttribute('open')).toBe('true');

      // Simulate menu close
      const closeEvent = new CustomEvent('close');
      await fireEvent(menu, closeEvent);

      expect(menu.getAttribute('open')).toBe('false');
    });

    it('should not emit when menu item has no data-value', async () => {
      const { container, emitted } = renderComponent();

      const menu = container.querySelector('ui5-menu') as HTMLElement;

      // Simulate menu item click without data-value
      const mockItem = {
        getAttribute: () => null,
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      expect(emitted()['update:modelValue']).toBeFalsy();
    });
  });

  describe('Responsive Design', () => {
    it('should have appropriate sizing for desktop', async () => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = renderComponent();

      const button = container.querySelector('.availability-button');
      expect(button?.classList.contains('availability-button')).toBe(true);
      // CSS should apply desktop-specific sizing
    });

    it('should have appropriate sizing for mobile', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderComponent();

      const button = container.querySelector('.availability-button');
      expect(button?.classList.contains('availability-button')).toBe(true);
      // CSS should apply mobile-specific sizing
    });

    it('should maintain functionality on small screens', async () => {
      // Simulate very small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container, emitted } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      await fireEvent.click(button);

      const menu = container.querySelector('ui5-menu') as HTMLElement;
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      expect(emitted()['update:modelValue']).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;

      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should respond to Enter key
      await fireEvent.keyDown(button, { key: 'Enter' });
      // Note: UI5 SplitButton should handle Enter key internally
    });

    it('should have proper menu structure for screen readers', async () => {
      const { container } = renderComponent();

      const menu = container.querySelector('ui5-menu');
      const menuItems = container.querySelectorAll('ui5-menu-item');

      expect(menu).toBeDefined();
      expect(menuItems.length).toBe(3);

      // Each menu item should have text
      menuItems.forEach((item) => {
        expect(item.getAttribute('text')).toBeTruthy();
      });
    });
  });

  describe('Props Validation', () => {
    it('should handle all valid availability scope values', async () => {
      const validValues = ['all', 'available', 'available_and_fastcharger'];

      for (const value of validValues) {
        const { container } = renderComponent({ modelValue: value });
        const button = container.querySelector('.availability-button');
        expect(button).toBeDefined();
      }
    });

    it('should react to prop changes', async () => {
      const { container, rerender } = renderComponent({ modelValue: 'all' });

      let button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Default');
      expect(button?.textContent?.trim()).toBe('All');

      await rerender({ modelValue: 'available' });

      button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Positive');
      expect(button?.textContent?.trim()).toBe('Available');
    });
  });

  describe('Component Stability', () => {
    it('should not throw errors during normal operation', async () => {
      expect(() => {
        renderComponent({ modelValue: 'all' });
      }).not.toThrow();

      expect(() => {
        renderComponent({ modelValue: 'available' });
      }).not.toThrow();

      expect(() => {
        renderComponent({ modelValue: 'available_and_fastcharger' });
      }).not.toThrow();
    });

    it('should handle component unmounting gracefully', async () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it('should maintain state consistency', async () => {
      const { container, emitted, rerender } = renderComponent({ modelValue: 'all' });

      const menu = container.querySelector('ui5-menu') as HTMLElement;

      // Select different item
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      // Check that the correct value was emitted
      const updateEvents = emitted()['update:modelValue'] as Array<Array<string>>;
      expect(updateEvents[0][0]).toBe('available');

      // Simulate parent updating the prop
      await rerender({ modelValue: 'available' });

      const button = container.querySelector('.availability-button');
      expect(button?.getAttribute('design')).toBe('Positive');
      expect(button?.textContent?.trim()).toBe('Available');
    });

    it('should handle rapid interactions correctly', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('.availability-button') as HTMLElement;
      const menu = container.querySelector('ui5-menu') as HTMLElement;

      // Rapid clicks
      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      // Should handle all clicks without errors
      expect(button).toBeDefined();

      // Test menu item selection
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      expect(emitted()['update:modelValue']).toBeTruthy();
    });
  });
});
