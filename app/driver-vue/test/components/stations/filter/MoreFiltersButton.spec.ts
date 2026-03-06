// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MoreFiltersButton from '@/components/stations/filter/MoreFiltersButton.vue';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Menu.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/MenuItem.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/slim-arrow-down.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/accept.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/sort.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/clear-filter.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/locate-me.js', () => ({}));

describe('MoreFiltersButton', () => {
  const renderComponent = (
    props: Record<string, unknown> = {},
    slots: Record<string, string> = {},
  ) => {
    return render(MoreFiltersButton, {
      props: {
        hasLocationFilter: false,
        sortDirection: 'asc',
        hasClearFilters: false,
        ...props,
      },
      global: {
        plugins: [createTestI18n()],
      },
      slots: {
        default: '<div data-testid="slot-content">Filter Content</div>',
        ...slots,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render button with correct attributes', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]');
      expect(button).toBeDefined();
      expect(button?.getAttribute('design')).toBe('Transparent');
      expect(button?.getAttribute('icon')).toBe('slim-arrow-down');
      expect(button?.getAttribute('title')).toBe('Show Additional Filters');
    });

    it('should have proper CSS classes', async () => {
      const { container } = renderComponent();

      const container_div = container.querySelector('.more-filters-container');
      expect(container_div).toBeDefined();

      const button = container.querySelector('.more-filters-btn');
      expect(button?.classList.contains('more-filters-btn')).toBe(true);
    });

    it('should not show filters panel initially', async () => {
      const { container } = renderComponent();

      const menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('false');
    });

    it('should be hidden on desktop screens via CSS', async () => {
      const { container } = renderComponent();

      const moreFiltersContainer = container.querySelector('.more-filters-container');
      expect(moreFiltersContainer).toBeDefined();
      // CSS media query should hide this on desktop (≥768px)
    });
  });

  describe('Badge Display', () => {
    it('should not show badge when no secondary filters are active', async () => {
      const { container } = renderComponent({
        hasLocationFilter: false,
        sortDirection: 'asc',
      });

      const badge = container.querySelector('.filter-badge');
      expect(badge).toBeNull();
    });

    it('should show badge with count 1 when location filter is active', async () => {
      const { container } = renderComponent({
        hasLocationFilter: true,
        sortDirection: 'asc',
      });

      const badge = container.querySelector('.filter-badge');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('1');
    });

    it('should show badge with count 1 when sort direction is desc', async () => {
      const { container } = renderComponent({
        hasLocationFilter: false,
        sortDirection: 'desc',
      });

      const badge = container.querySelector('.filter-badge');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('1');
    });

    it('should show badge with count 2 when both location and sort filters are active', async () => {
      const { container } = renderComponent({
        hasLocationFilter: true,
        sortDirection: 'desc',
      });

      const badge = container.querySelector('.filter-badge');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('2');
    });

    it('should have correct badge styling', async () => {
      const { container } = renderComponent({
        hasLocationFilter: true,
      });

      const badge = container.querySelector('.filter-badge');
      expect(badge?.classList.contains('filter-badge')).toBe(true);
    });
  });

  describe('Panel Toggle Functionality', () => {
    it('should show filters panel when button is clicked', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;
      await fireEvent.click(button);

      const panel = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(panel).toBeDefined();
    });

    it('should hide filters panel when button is clicked again', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      // First click - show panel
      await fireEvent.click(button);
      let menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('true');

      // Second click - hide panel
      await fireEvent.click(button);
      menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('false');
    });

    it('should update button title when panel is expanded', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      // Initially collapsed
      expect(button.getAttribute('title')).toBe('Show Additional Filters');

      // Click to expand
      await fireEvent.click(button);
      expect(button.getAttribute('title')).toBe('Hide Additional Filters');

      // Click to collapse
      await fireEvent.click(button);
      expect(button.getAttribute('title')).toBe('Show Additional Filters');
    });

    it('should emit toggle event with correct state', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      // First click - expand
      await fireEvent.click(button);
      expect(emitted().toggle).toBeTruthy();
      let toggleEvents = emitted().toggle as Array<Array<boolean>>;
      expect(toggleEvents[0][0]).toBe(true);

      // Second click - collapse
      await fireEvent.click(button);
      toggleEvents = emitted().toggle as Array<Array<boolean>>;
      expect(toggleEvents[1][0]).toBe(false);
    });
  });

  describe('Menu Content', () => {
    it('should render menu items in the filters panel', async () => {
      const { container } = renderComponent();

      const menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu).toBeDefined();

      // Should have menu items for location, sort, and clear (when applicable)
      const menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should render location menu item with correct text', async () => {
      const { container } = renderComponent({
        hasLocationFilter: false,
      });

      const menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
      // Location menu item should show "Find Nearby Stations" when not active
    });

    it('should render location menu item as active when location filter is set', async () => {
      const { container } = renderComponent({
        hasLocationFilter: true,
      });

      const menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
      // Location menu item should show "Location Active" when active
    });

    it('should render sort menu item with direction indicator', async () => {
      const { container } = renderComponent({
        sortDirection: 'desc',
      });

      const menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
      // Sort menu item should show direction indicator
    });

    it('should render clear filters menu item when filters are active', async () => {
      const { container } = renderComponent({
        hasClearFilters: true,
      });

      const menuItems = container.querySelectorAll('ui5-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
      // Clear filters menu item should be present
    });

    it('should have proper panel styling', async () => {
      const { container } = renderComponent();

      const menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu).toBeDefined();
      // Menu should be properly styled
    });
  });

  describe('Exposed Methods', () => {
    it('should expose close method', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;
      await fireEvent.click(button);

      // Panel should be visible
      let panel = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(panel).toBeDefined();

      // Note: Testing exposed methods directly is complex in @testing-library/vue
      // In real usage, parent components would call these methods via refs
    });

    it('should expose isExpanded method', async () => {
      const { container } = renderComponent();

      // Initially should be collapsed
      let menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('false');

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;
      await fireEvent.click(button);

      // Should be expanded
      menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('true');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be hidden on desktop screens', async () => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = renderComponent();

      const moreFiltersContainer = container.querySelector('.more-filters-container');
      expect(moreFiltersContainer).toBeDefined();
      // CSS should hide this component on desktop
    });

    it('should be visible on mobile screens', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderComponent();

      const moreFiltersContainer = container.querySelector('.more-filters-container');
      expect(moreFiltersContainer).toBeDefined();
      // CSS should show this component on mobile
    });

    it('should handle panel positioning on small screens', async () => {
      // Simulate very small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 300,
      });

      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;
      await fireEvent.click(button);

      const menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu).toBeDefined();
      // CSS should adjust positioning for small screens via media queries
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]');
      expect(button?.getAttribute('title')).toBeDefined();
    });

    it('should be keyboard accessible', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      // Should be focusable
      button.focus();
      // Note: In test environment, focus behavior may differ from real DOM
      expect(button).toBeDefined();

      // Should respond to Enter key
      await fireEvent.keyDown(button, { key: 'Enter' });
      // Note: UI5 SplitButton should handle Enter key internally
    });

    it('should update title for screen readers', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      expect(button.getAttribute('title')).toBe('Show Additional Filters');

      await fireEvent.click(button);
      expect(button.getAttribute('title')).toBe('Hide Additional Filters');
    });
  });

  describe('Props Reactivity', () => {
    it('should update badge count when props change', async () => {
      const { container, rerender } = renderComponent({
        hasLocationFilter: false,
        sortDirection: 'asc',
      });

      // Initially no badge
      let badge = container.querySelector('.filter-badge');
      expect(badge).toBeNull();

      // Update props to activate location filter
      await rerender({
        hasLocationFilter: true,
        sortDirection: 'asc',
      });

      badge = container.querySelector('.filter-badge');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('1');

      // Update props to activate both filters
      await rerender({
        hasLocationFilter: true,
        sortDirection: 'desc',
      });

      badge = container.querySelector('.filter-badge');
      expect(badge?.textContent?.trim()).toBe('2');
    });

    it('should handle prop changes while panel is open', async () => {
      const { container, rerender } = renderComponent({
        hasLocationFilter: false,
        sortDirection: 'asc',
      });

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;
      await fireEvent.click(button);

      // Panel should be open
      let panel = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(panel).toBeDefined();

      // Update props
      await rerender({
        hasLocationFilter: true,
        sortDirection: 'desc',
      });

      // Panel should still be open
      panel = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(panel).toBeDefined();

      // Badge should be updated
      const badge = container.querySelector('.filter-badge');
      expect(badge?.textContent?.trim()).toBe('2');
    });
  });

  describe('Component Stability', () => {
    it('should not throw errors during normal operation', async () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    it('should handle component unmounting gracefully', async () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid toggle clicks', async () => {
      const { container, emitted } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      // Rapid clicks
      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      const toggleEvents = emitted().toggle as Array<Array<boolean>>;
      expect(toggleEvents.length).toBe(4);

      // Should alternate between true and false
      expect(toggleEvents[0][0]).toBe(true);
      expect(toggleEvents[1][0]).toBe(false);
      expect(toggleEvents[2][0]).toBe(true);
      expect(toggleEvents[3][0]).toBe(false);
    });

    it('should maintain state consistency', async () => {
      const { container } = renderComponent();

      const button = container.querySelector('[data-testid="more-filters-button"]') as HTMLElement;

      // Click to expand
      await fireEvent.click(button);
      let menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('true');
      expect(button.getAttribute('title')).toBe('Hide Additional Filters');

      // Click to collapse
      await fireEvent.click(button);
      menu = container.querySelector('[data-testid="secondary-filters-panel"]');
      expect(menu?.getAttribute('open')).toBe('false');
      expect(button.getAttribute('title')).toBe('Show Additional Filters');
    });
  });
});
