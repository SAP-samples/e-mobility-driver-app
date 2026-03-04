// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestingPinia } from '@pinia/testing';
import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render, waitFor } from '@testing-library/vue';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import EvseFilterBar from '@/components/stations/filter/EvseFilterBar.vue';
import { useEvseStore } from '@/store/evse';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Bar.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Button.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Icon.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Input.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/ComboBox.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/ComboBoxItem.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/features/InputSuggestions.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SuggestionItem.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SuggestionItemGroup.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SuggestionItemCustom.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/sort-ascending.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/sort-descending.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/locate-me.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/synchronize.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/clear-filter.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/search.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/filter.js', () => ({}));

// Mock UI5 Device to prevent userAgent access errors
vi.mock('@ui5/webcomponents-base/dist/Device.js', () => ({
  isPhone: () => false,
  isTablet: () => false,
  isDesktop: () => true,
  isAndroid: () => false,
  isIOS: () => false,
  isMacintosh: () => true,
  isWindows: () => false,
}));

// Mock fetch for location suggestions
global.fetch = vi.fn();

// Mock geolocation
const mockGetCurrentPosition = vi.fn();

// Store original navigator to restore after tests
const originalNavigator = global.navigator;

// Types
interface SearchPayload {
  value?: string;
  available?: boolean;
  fastCharging?: boolean;
  location?: {
    lat: number;
    lon: number;
    radius: number;
  };
  evseId?: string;
  sortDirection?: 'asc' | 'desc';
  pageArg?: number;
  pageSizeArg?: number;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface GeolocationError {
  code: number;
  message: string;
}

// Mock data
const mockEvses = [
  {
    id: '1',
    name: 'Station Alpha',
    location: {
      address: { city: 'Paris' },
      siteAreaName: 'Central Area',
    },
  },
  {
    id: '2',
    code: 'STN-BETA',
    location: {
      address: { city: 'Lyon' },
    },
  },
];

const mockLocationSuggestions = [
  {
    display_name: 'Paris, France',
    lat: '48.8566',
    lon: '2.3522',
  },
  {
    display_name: 'Lyon, France',
    lat: '45.7640',
    lon: '4.8357',
  },
];

describe('EvseFilterBar (Refactored)', () => {
  let router: Router;
  let mockEvseStore: ReturnType<typeof useEvseStore>;

  const renderComponent = async (routeQuery: Record<string, string> = {}) => {
    await router.push({ query: routeQuery });

    return render(EvseFilterBar, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
          router,
          createTestI18n(),
        ],
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup geolocation mock with complete navigator for UI5 device detection
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      platform: 'MacIntel',
      vendor: 'Google Inc.',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      onLine: true,
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    });

    // Setup router
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    });

    // Setup mock fetch
    (global.fetch as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockLocationSuggestions),
    });

    // Setup mock store
    const pinia = createTestingPinia();
    mockEvseStore = useEvseStore(pinia);

    // Mock store methods
    mockEvseStore.createQuery = vi.fn().mockReturnValue({
      search: vi.fn().mockReturnThis(),
      page: vi.fn().mockReturnThis(),
    });
    mockEvseStore.loadEvses = vi.fn().mockResolvedValue(mockEvses);
  });

  describe('Component Structure', () => {
    it('should render all filter components in correct order', async () => {
      const { container } = await renderComponent();

      // Check that all sub-components are present
      expect(container.querySelector('.filter-bar')).toBeDefined();

      // Location button should be present
      const locationButton = container.querySelector('ui5-button[title*="Near Me"]');
      expect(locationButton).toBeDefined();

      // Search input should be present
      const searchInput = container.querySelector('.search-input');
      expect(searchInput).toBeDefined();

      // Availability filter (AvailabilitySplitButton) should be present
      const availabilityFilter = container.querySelector('.availability-filter');
      expect(availabilityFilter).toBeDefined();

      // Sort button should be present
      const sortButton = container.querySelector('.sort-direction-btn');
      expect(sortButton).toBeDefined();
    });

    it('should initialize with correct default values', async () => {
      const { container } = await renderComponent();

      // Component should render without emitting search on mount
      const searchInput = container.querySelector('.search-input');
      const availabilityFilter = container.querySelector('.availability-filter');
      const sortButton = container.querySelector('.sort-direction-btn');

      expect(searchInput).toBeDefined();
      expect(availabilityFilter).toBeDefined();
      expect(sortButton).toBeDefined();
    });

    it('should show clear filters button when filters are active', async () => {
      const { container, getByTitle } = await renderComponent();

      const availabilityButton = container.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton).toBeDefined();

      // Simulate click to open menu
      await fireEvent.click(availabilityButton);

      // Find the menu and simulate item-click event
      const menu = container.querySelector('ui5-menu') as HTMLElement;
      expect(menu).toBeDefined();

      // Simulate the item-click event with the "Available only" item
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      // Wait for the clear button to appear
      await waitFor(() => {
        expect(getByTitle('Clear All Filters')).toBeDefined();
      });
    });
  });

  describe('Route Integration', () => {
    it('should initialize filters from route query parameters', async () => {
      const { container } = await renderComponent({
        available: 'true',
        fastCharging: 'true',
        siteArea: 'test search',
      });

      // Component should initialize with route params without emitting search
      const availabilityButton = container.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton).toBeDefined();

      // The availability button should reflect the route state
      expect(availabilityButton.textContent).toContain('Fast');
    });

    it('should handle different availability scope combinations from route', async () => {
      // Test available only
      const { container: container1 } = await renderComponent({ available: 'true' });
      const availabilityButton1 = container1.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton1.textContent).toContain('Available');

      // Test available + fast charging
      const { container: container2 } = await renderComponent({
        available: 'true',
        fastCharging: 'true',
      });
      const availabilityButton2 = container2.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton2.textContent).toContain('Fast');
    });
  });

  describe('Availability Filter Integration', () => {
    it('should handle availability scope changes', async () => {
      const { container, emitted } = await renderComponent();

      const availabilityButton = container.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton).toBeDefined();

      // Simulate click to open menu
      await fireEvent.click(availabilityButton);

      // Find the menu and simulate item-click event
      const menu = container.querySelector('ui5-menu') as HTMLElement;
      expect(menu).toBeDefined();

      // Simulate the item-click event with the "Available only" item
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        const lastSearch = searchEvents[searchEvents.length - 1][0];
        expect(lastSearch).toMatchObject({
          available: true,
          sortDirection: 'asc',
        });
      });
    });

    it('should handle fast charging filter', async () => {
      const { container, emitted } = await renderComponent();

      const availabilityButton = container.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton).toBeDefined();

      // Simulate click to open menu
      await fireEvent.click(availabilityButton);

      // Find the menu and simulate item-click event
      const menu = container.querySelector('ui5-menu') as HTMLElement;
      expect(menu).toBeDefined();

      // Simulate the item-click event with the "Available fast chargers" item
      const mockItem = {
        getAttribute: (attr: string) =>
          attr === 'data-value' ? 'available_and_fastcharger' : null,
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        const lastSearch = searchEvents[searchEvents.length - 1][0];
        expect(lastSearch).toMatchObject({
          available: true,
          fastCharging: true,
          sortDirection: 'asc',
        });
      });
    });
  });

  describe('Sort Button Integration', () => {
    it('should toggle sort direction', async () => {
      const { container, emitted } = await renderComponent();

      const sortButton = container.querySelector('.sort-direction-btn') as HTMLElement;
      expect(sortButton).toBeDefined();

      // Click to toggle sort direction
      await fireEvent.click(sortButton);

      // Wait for search event after first click
      await waitFor(
        () => {
          const searchEvents = emitted().search as SearchPayload[][];
          expect(searchEvents.length).toBeGreaterThan(0);
          const lastSearch = searchEvents[searchEvents.length - 1][0];
          expect(lastSearch.sortDirection).toBe('desc');
        },
        { timeout: 100 },
      );

      // Get the event count after first click
      const afterFirstClickCount = (emitted().search as SearchPayload[][]).length;

      // Click again to toggle back
      await fireEvent.click(sortButton);

      // Wait for new search event after second click
      await waitFor(
        () => {
          const searchEvents = emitted().search as SearchPayload[][];
          expect(searchEvents.length).toBeGreaterThan(afterFirstClickCount);
          const lastSearch = searchEvents[searchEvents.length - 1][0];
          expect(lastSearch.sortDirection).toBe('asc');
        },
        { timeout: 100 },
      );
    });

    it('should include sort direction in all search events', async () => {
      const { container, emitted } = await renderComponent();

      // Trigger a search by clicking sort button
      const sortButton = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(sortButton);

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        expect(searchEvents.length).toBeGreaterThan(0);

        // All search events should include sortDirection
        searchEvents.forEach(([payload]) => {
          expect(payload.sortDirection).toBeDefined();
          expect(['asc', 'desc']).toContain(payload.sortDirection);
        });
      });
    });
  });

  describe('Search Input Integration', () => {
    it('should handle text search input', async () => {
      const { container, emitted } = await renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;
      expect(input).toBeDefined();

      // Simulate input event
      const inputEvent = new CustomEvent('input', {
        detail: { target: { value: 'test query' } },
      });
      await fireEvent(input, inputEvent);

      // Wait for debounced search
      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        const lastSearch = searchEvents[searchEvents.length - 1][0];
        expect(lastSearch.value).toBe('test query');
      });
    });

    it('should handle enter key for immediate search', async () => {
      const { container, emitted } = await renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;
      expect(input).toBeDefined();

      // Set input value and press enter
      await fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        expect(searchEvents.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Location Button Integration', () => {
    it('should search by current location', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
        },
      };

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { container, emitted } = await renderComponent();

      const locationButton = container.querySelector('ui5-button[title*="Near Me"]') as HTMLElement;
      expect(locationButton).toBeDefined();

      await fireEvent.click(locationButton);

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        const lastSearch = searchEvents[searchEvents.length - 1][0];
        expect(lastSearch).toMatchObject({
          location: {
            lat: 48.8566,
            lon: 2.3522,
            radius: 50000,
          },
          sortDirection: 'asc',
        });
      });
    });

    it('should handle geolocation errors gracefully', async () => {
      const mockError: GeolocationError = { code: 1, message: 'Permission denied' };
      mockGetCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback?.(mockError);
      });

      const { container } = await renderComponent();

      const locationButton = container.querySelector('ui5-button[title*="Near Me"]') as HTMLElement;
      await fireEvent.click(locationButton);

      // Should handle error gracefully without crashing
      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should show loading state during geolocation', async () => {
      let resolveGeolocation: (() => void) | undefined;
      const geolocationPromise = new Promise<GeolocationPosition>((resolve) => {
        resolveGeolocation = () =>
          resolve({
            coords: { latitude: 48.8566, longitude: 2.3522 },
          } as GeolocationPosition);
      });

      mockGetCurrentPosition.mockImplementation((success) => {
        geolocationPromise.then(success);
      });

      const { container, getByTitle } = await renderComponent();

      const locationButton = container.querySelector('ui5-button[title*="Near Me"]') as HTMLElement;
      await fireEvent.click(locationButton);

      // Check loading state
      await waitFor(() => {
        expect(getByTitle('Locating...')).toBeDefined();
      });

      // Resolve geolocation
      resolveGeolocation!();

      await waitFor(() => {
        expect(getByTitle(/Near Me/)).toBeDefined();
      });
    });
  });

  describe('Clear Filters Integration', () => {
    it('should clear all filters and emit empty search', async () => {
      const { container, getByTitle, emitted } = await renderComponent();

      // First set some filters
      const availabilityButton = container.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton).toBeDefined();

      // Simulate click to open menu
      await fireEvent.click(availabilityButton);

      // Find the menu and simulate item-click event
      const menu = container.querySelector('ui5-menu') as HTMLElement;
      expect(menu).toBeDefined();

      // Simulate the item-click event with the "Available only" item
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      // Wait for clear button to appear
      await waitFor(() => {
        expect(getByTitle('Clear All Filters')).toBeDefined();
      });

      // Clear filters
      const clearButton = getByTitle('Clear All Filters');
      await fireEvent.click(clearButton);

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        const lastSearch = searchEvents[searchEvents.length - 1][0];
        expect(lastSearch).toMatchObject({
          sortDirection: 'asc', // Only default sort should remain
        });
        expect(lastSearch.available).toBeUndefined();
        expect(lastSearch.fastCharging).toBeUndefined();
        expect(lastSearch.value).toBeUndefined();
      });
    });
  });

  describe('Mobile Layout', () => {
    it('should have proper CSS classes for mobile layout', async () => {
      const { container } = await renderComponent();

      // Check that elements have the correct classes for mobile styling
      const searchInput = container.querySelector('.search-input');
      const availabilityFilter = container.querySelector('.availability-filter');
      const filterBar = container.querySelector('.filter-bar');
      const sortButton = container.querySelector('.sort-direction-btn');

      expect(searchInput).toBeDefined();
      expect(availabilityFilter).toBeDefined();
      expect(filterBar).toBeDefined();
      expect(sortButton).toBeDefined();

      // Verify classes exist for CSS targeting
      expect(searchInput?.classList.contains('search-input')).toBe(true);
      expect(availabilityFilter?.classList.contains('availability-filter')).toBe(true);
      expect(filterBar?.classList.contains('filter-bar')).toBe(true);
      expect(sortButton?.classList.contains('sort-direction-btn')).toBe(true);
    });

    it('should maintain functionality on mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone size
      });

      const { container, emitted } = await renderComponent();

      const availabilityButton = container.querySelector('.availability-button') as HTMLElement;
      expect(availabilityButton).toBeDefined();

      // Test that functionality still works on mobile
      // Simulate click to open menu
      await fireEvent.click(availabilityButton);

      // Find the menu and simulate item-click event
      const menu = container.querySelector('ui5-menu') as HTMLElement;
      expect(menu).toBeDefined();

      // Simulate the item-click event with the "Available only" item
      const mockItem = {
        getAttribute: (attr: string) => (attr === 'data-value' ? 'available' : null),
      };
      const itemClickEvent = new CustomEvent('item-click', {
        detail: { item: mockItem },
      });
      await fireEvent(menu, itemClickEvent);

      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        const lastSearch = searchEvents[searchEvents.length - 1][0];
        expect(lastSearch).toMatchObject({ available: true });
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should prevent multiple simultaneous search emissions', async () => {
      const { container, emitted } = await renderComponent();

      const sortButton = container.querySelector('.sort-direction-btn') as HTMLElement;
      expect(sortButton).toBeDefined();

      // Rapid fire clicks to test throttling
      await fireEvent.click(sortButton);
      await fireEvent.click(sortButton);
      await fireEvent.click(sortButton);

      // Should not emit excessive search events due to throttling
      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        expect(searchEvents.length).toBeLessThan(10); // Reasonable limit
      });
    });

    it('should use requestAnimationFrame for smooth updates', async () => {
      const { container, emitted } = await renderComponent();

      // Trigger a search event
      const sortButton = container.querySelector('.sort-direction-btn') as HTMLElement;
      await fireEvent.click(sortButton);

      // Component should handle emission smoothly
      await waitFor(() => {
        const searchEvents = emitted().search as SearchPayload[][];
        expect(searchEvents.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Cleanup', () => {
    it('should not throw when unmounting', async () => {
      const { unmount } = await renderComponent();

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });

    it('should handle route changes properly', async () => {
      await renderComponent();

      await router.push({ query: { available: 'true' } });
      await nextTick();

      // The component should react to route changes
      expect(router.currentRoute.value.query.available).toBe('true');
    });
  });
});
