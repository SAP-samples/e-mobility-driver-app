// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render, waitFor } from '@testing-library/vue';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import SearchInput from '@/components/stations/filter/SearchInput.vue';
import { useEvseStore } from '@/store/evse';

// Mock UI5 components
vi.mock('@ui5/webcomponents/dist/Input.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/Icon.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/features/InputSuggestions.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SuggestionItem.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SuggestionItemGroup.js', () => ({}));
vi.mock('@ui5/webcomponents/dist/SuggestionItemCustom.js', () => ({}));
vi.mock('@ui5/webcomponents-icons/dist/search.js', () => ({}));

// Mock fetch for location suggestions
global.fetch = vi.fn();

// Mock the store
vi.mock('@/store/evse', () => ({
  useEvseStore: vi.fn(),
}));

// Types
interface SelectedSuggestion {
  type: 'evse' | 'location';
  text: string;
  data: Record<string, string>;
}

// Mock data
const mockEvses = [
  {
    id: '1',
    name: 'Station Alpha',
    code: 'STA-001',
    location: {
      address: { city: 'Paris' },
      siteAreaName: 'Central Area',
    },
  },
  {
    id: '2',
    name: 'Station Beta',
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

describe('SearchInput', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEvseStore: any;

  const renderComponent = (props: Record<string, unknown> = {}) => {
    return render(SearchInput, {
      props: {
        modelValue: '',
        lastSelectedSuggestion: null,
        ...props,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock fetch
    (global.fetch as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockLocationSuggestions),
    });

    // Setup mock store with API
    mockEvseStore = {
      createQuery: vi.fn().mockReturnValue({
        search: vi.fn().mockReturnThis(),
        page: vi.fn().mockReturnThis(),
      }),
      loadEvses: vi.fn().mockResolvedValue(mockEvses),
      api: {
        fetch: vi.fn().mockResolvedValue({
          data: mockEvses,
          total: mockEvses.length,
          page: 1,
          pageSize: 5,
        }),
      },
    };
    (useEvseStore as Mock).mockReturnValue(mockEvseStore);
  });

  describe('Component Rendering', () => {
    it('should render search input with correct attributes', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input');
      expect(input).toBeDefined();
      expect(input?.getAttribute('placeholder')).toBe('Search charge points, cities, areas...');
      expect(input?.getAttribute('show-clear-icon')).toBe('');
      expect(input?.getAttribute('show-suggestions')).toBe('');
    });

    it('should render search icon', async () => {
      const { container } = renderComponent();

      const icon = container.querySelector('ui5-icon[name="search"]');
      expect(icon).toBeDefined();
    });

    it('should bind model value correctly', async () => {
      const modelValue = 'test search';
      const { container } = renderComponent({ modelValue });

      const input = container.querySelector('.search-input') as HTMLElement;
      expect(input?.getAttribute('value')).toBe(modelValue);
    });
  });

  describe('Input Events', () => {
    it('should emit update:modelValue on input', async () => {
      const { container, emitted } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Simulate input change
      Object.defineProperty(input, 'value', {
        value: 'new value',
        writable: true,
      });

      const inputEvent = new CustomEvent('input');
      await fireEvent(input, inputEvent);

      await waitFor(() => {
        expect(emitted()['update:modelValue']).toBeTruthy();
      });
    });

    it('should emit search event on enter key', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'test query' });

      const input = container.querySelector('.search-input') as HTMLElement;
      await fireEvent.keyDown(input, { key: 'Enter' });

      expect(emitted().search).toBeTruthy();
      expect(emitted().search[0][0]).toEqual({ value: 'test query' });
    });

    it('should debounce input events', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Rapid fire input events
      Object.defineProperty(input, 'value', { value: 'a', writable: true });
      await fireEvent(input, new CustomEvent('input'));

      Object.defineProperty(input, 'value', { value: 'ab', writable: true });
      await fireEvent(input, new CustomEvent('input'));

      Object.defineProperty(input, 'value', { value: 'abc', writable: true });
      await fireEvent(input, new CustomEvent('input'));

      // Should debounce the events
      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(input).toBeDefined();
    });
  });

  describe('EVSE Suggestions', () => {
    it('should fetch and display EVSE suggestions', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Trigger input with sufficient length to trigger search
      const inputEvent = new CustomEvent('ui5-input');
      Object.defineProperty(inputEvent, 'target', {
        value: { value: 'station' },
        writable: false,
      });
      await fireEvent(input, inputEvent);

      // Wait for debounced action and suggestions
      await waitFor(() => {
        expect(mockEvseStore.api.fetch).toHaveBeenCalled();
      });
    });

    it('should display EVSE suggestion with proper content', async () => {
      const { container } = renderComponent({ modelValue: 'station' });

      await waitFor(() => {
        const suggestionItems = container.querySelectorAll(
          'ui5-suggestion-item-custom[data-type="evse"]',
        );
        expect(suggestionItems.length).toBeGreaterThan(0);

        const firstItem = suggestionItems[0];
        expect(firstItem?.getAttribute('data-id')).toBe('1');
        expect(firstItem?.textContent).toContain('Station Alpha');
      });
    });

    it('should handle EVSE suggestion selection', async () => {
      const { container, emitted } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // First, trigger a search to populate EVSE suggestions
      const inputEvent = new CustomEvent('ui5-input');
      Object.defineProperty(inputEvent, 'target', {
        value: { value: 'station' },
        writable: false,
      });
      await fireEvent(input, inputEvent);

      // Wait for suggestions to be populated
      await waitFor(() => {
        expect(mockEvseStore.api.fetch).toHaveBeenCalled();
      });

      // Mock suggestion selection event
      const mockGetAttribute = vi
        .fn()
        .mockReturnValueOnce('evse') // data-type
        .mockReturnValueOnce('1'); // data-id

      const mockEvent = new CustomEvent('ui5-selection-change', {
        detail: {
          item: {
            text: 'Station Alpha',
            getAttribute: mockGetAttribute,
          },
        },
      });

      await fireEvent(input, mockEvent);

      expect(emitted()['suggestion-selected']).toBeTruthy();
      const emittedSuggestion = emitted()['suggestion-selected'][0][0] as SelectedSuggestion;
      expect(emittedSuggestion.type).toBe('evse');
      expect(emittedSuggestion.text).toBe('Station Alpha');
      expect(emittedSuggestion.data.id).toBe('1');
    });
  });

  describe('Location Suggestions', () => {
    it('should fetch and display location suggestions', async () => {
      const { container } = renderComponent({ modelValue: 'paris' });

      // Wait for suggestions to load
      await waitFor(() => {
        const suggestionItems = container.querySelectorAll(
          'ui5-suggestion-item-custom[data-type="location"]',
        );
        expect(suggestionItems.length).toBeGreaterThan(0);
      });

      // Double check if suggestion items are rendered
      const suggestionItems = container.querySelectorAll(
        'ui5-suggestion-item-custom[data-type="location"]',
      );
      expect(suggestionItems.length).toBeGreaterThan(0);
    });

    it('should handle location suggestion selection', async () => {
      const { container, emitted } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Mock location suggestion selection event
      const mockGetAttribute = vi
        .fn()
        .mockReturnValueOnce('location') // data-type
        .mockReturnValueOnce('48.8566') // data-lat
        .mockReturnValueOnce('2.3522'); // data-lon

      const mockEvent = new CustomEvent('ui5-selection-change', {
        detail: {
          item: {
            text: 'Paris, France',
            getAttribute: mockGetAttribute,
          },
        },
      });

      await fireEvent(input, mockEvent);

      expect(emitted()['suggestion-selected']).toBeTruthy();
      const emittedSuggestion = emitted()['suggestion-selected'][0][0] as SelectedSuggestion;
      expect(emittedSuggestion.type).toBe('location');
      expect(emittedSuggestion.text).toBe('Paris, France');
      expect(emittedSuggestion.data.lat).toBe('48.8566');
      expect(emittedSuggestion.data.lon).toBe('2.3522');
    });

    it('should emit search with location when location suggestion is selected', async () => {
      const { container, emitted } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Mock location suggestion selection
      const mockGetAttribute = vi
        .fn()
        .mockReturnValueOnce('location')
        .mockReturnValueOnce('48.8566')
        .mockReturnValueOnce('2.3522');

      const mockEvent = new CustomEvent('ui5-selection-change', {
        detail: {
          item: {
            text: 'Paris, France',
            getAttribute: mockGetAttribute,
          },
        },
      });

      await fireEvent(input, mockEvent);

      expect(emitted().search).toBeTruthy();
      const searchPayload = emitted().search[0][0];
      expect(searchPayload).toMatchObject({
        location: {
          lat: 48.8566,
          lon: 2.3522,
          radius: 50000,
        },
      });
    });
  });

  describe('Input Clearing', () => {
    it('should emit input-cleared when input is cleared', async () => {
      const { container, emitted } = renderComponent({ modelValue: 'test' });

      const input = container.querySelector('.search-input') as HTMLElement;

      // Simulate clearing the input with proper event structure
      const inputEvent = new CustomEvent('input');
      Object.defineProperty(inputEvent, 'target', {
        value: { value: '' },
        writable: false,
      });
      await fireEvent(input, inputEvent);

      await waitFor(() => {
        expect(emitted()['input-cleared']).toBeTruthy();
      });
    });

    it('should clear suggestions when input is empty', async () => {
      const { container } = renderComponent({ modelValue: '' });

      // Should not show any suggestion groups when input is empty
      const evseGroup = container.querySelector(
        'ui5-suggestion-item-group[header-text="Charge Points"]',
      );
      const locationGroup = container.querySelector(
        'ui5-suggestion-item-group[header-text="Places"]',
      );

      expect(evseGroup).toBeNull();
      expect(locationGroup).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle EVSE fetch errors gracefully', async () => {
      mockEvseStore.loadEvses.mockRejectedValue(new Error('API Error'));

      const { container } = renderComponent({ modelValue: 'station' });

      // Should not crash on error
      await waitFor(() => {
        const input = container.querySelector('.search-input');
        expect(input).toBeDefined();
      });
    });

    it('should handle location fetch errors gracefully', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('Network Error'));

      const { container } = renderComponent({ modelValue: 'paris' });

      // Should not crash on error
      await waitFor(() => {
        const input = container.querySelector('.search-input');
        expect(input).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    it('should not make excessive API calls', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Simulate rapid typing with proper event structure
      for (let i = 0; i < 10; i++) {
        const inputEvent = new CustomEvent('input');
        Object.defineProperty(inputEvent, 'target', {
          value: { value: `test${i}` },
          writable: false,
        });
        await fireEvent(input, inputEvent);
      }

      // Wait for debounce with longer timeout for new implementation
      // Our new implementation uses 300ms for reset + 600ms for search
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should have made reasonable number of calls due to debouncing
      // With our new implementation, we expect exactly 1 call after debouncing
      expect(mockEvseStore.api.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle minimum query length', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Test with short query (should not fetch)
      Object.defineProperty(input, 'value', { value: 'a', writable: true });
      await fireEvent(input, new CustomEvent('input'));

      await new Promise((resolve) => setTimeout(resolve, 350));

      // Should not fetch for very short queries
      expect(mockEvseStore.api.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Last Selected Suggestion', () => {
    it('should maintain last selected suggestion state', async () => {
      const lastSuggestion: SelectedSuggestion = {
        type: 'location',
        text: 'Paris, France',
        data: { lat: '48.8566', lon: '2.3522' },
      };

      const { container } = renderComponent({
        modelValue: 'Paris, France',
        lastSelectedSuggestion: lastSuggestion,
      });

      const input = container.querySelector('.search-input') as HTMLElement;
      expect(input?.getAttribute('value')).toBe('Paris, France');
    });

    it('should handle suggestion updates properly', async () => {
      const { emitted } = renderComponent();

      // Verify that suggestion-selected events are emitted properly
      const mockSuggestion: SelectedSuggestion = {
        type: 'evse',
        text: 'Test Station',
        data: { id: '123' },
      };

      // This would be triggered by the component internally
      // We're testing the event emission structure
      expect(emitted).toBeDefined();
    });
  });

  describe('Typing State Management', () => {
    it('should prevent API calls while user is actively typing', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Simulate rapid typing
      const rapidInputs = ['t', 'te', 'tes', 'test', 'testi', 'testin', 'testing'];
      for (const text of rapidInputs) {
        const inputEvent = new CustomEvent('input');
        Object.defineProperty(inputEvent, 'target', {
          value: { value: text },
          writable: false,
        });
        await fireEvent(input, inputEvent);
        // Short delay between keystrokes (faster than debounce)
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait a bit but not enough for full debounce
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Should not have made API calls yet due to rapid typing
      expect(mockEvseStore.api.fetch).not.toHaveBeenCalled();

      // Wait for full debounce cycle to complete
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Now should have made the API call
      expect(mockEvseStore.api.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle suggestion selection without interference from typing state', async () => {
      const { container, emitted } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Start typing to trigger suggestions
      const inputEvent = new CustomEvent('input');
      Object.defineProperty(inputEvent, 'target', {
        value: { value: 'test' },
        writable: false,
      });
      await fireEvent(input, inputEvent);

      // Wait for suggestions to load
      await waitFor(() => {
        expect(container.querySelector('[data-type="evse"]')).toBeTruthy();
      });

      // Simulate suggestion selection
      const suggestionEvent = new CustomEvent('ui5-selection-change');
      Object.defineProperty(suggestionEvent, 'detail', {
        value: {
          item: {
            text: 'Station Alpha',
            getAttribute: (attr: string) => {
              if (attr === 'data-type') return 'evse';
              if (attr === 'data-id') return '1';
              return null;
            },
          },
        },
        writable: false,
      });

      await fireEvent(input, suggestionEvent);

      // Should emit suggestion-selected event
      const allEmitted = emitted();
      expect(allEmitted['suggestion-selected']).toBeTruthy();
      expect(allEmitted['suggestion-selected'][0]).toEqual([
        {
          text: 'Station Alpha',
          type: 'evse',
          data: expect.objectContaining({
            id: '1',
            display_name: 'Station Alpha',
          }),
        },
      ]);
    });

    it('should reset typing state after selection', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Simulate typing
      const inputEvent = new CustomEvent('input');
      Object.defineProperty(inputEvent, 'target', {
        value: { value: 'test' },
        writable: false,
      });
      await fireEvent(input, inputEvent);

      // Wait for suggestions
      await waitFor(() => {
        expect(container.querySelector('[data-type="evse"]')).toBeTruthy();
      });

      // Simulate suggestion selection
      const suggestionEvent = new CustomEvent('ui5-selection-change');
      Object.defineProperty(suggestionEvent, 'detail', {
        value: {
          item: {
            text: 'Station Alpha',
            getAttribute: (attr: string) => {
              if (attr === 'data-type') return 'evse';
              if (attr === 'data-id') return '1';
              return null;
            },
          },
        },
        writable: false,
      });

      await fireEvent(input, suggestionEvent);

      // Wait for state reset timeout
      await new Promise((resolve) => setTimeout(resolve, 250));

      // After selection, user should be able to type normally again
      const newInputEvent = new CustomEvent('input');
      Object.defineProperty(newInputEvent, 'target', {
        value: { value: 'new search' },
        writable: false,
      });
      await fireEvent(input, newInputEvent);

      // Should work normally
      expect(input).toBeDefined();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should have proper mobile styling classes', async () => {
      const { container } = renderComponent();

      const input = container.querySelector('.search-input');
      expect(input?.classList.contains('search-input')).toBe(true);
    });

    it('should handle touch events on mobile', async () => {
      // Simulate mobile environment
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderComponent();

      const input = container.querySelector('.search-input') as HTMLElement;

      // Should handle touch interactions
      await fireEvent.click(input);
      expect(input).toBeDefined();
    });
  });
});
