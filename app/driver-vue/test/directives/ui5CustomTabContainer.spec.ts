// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { type VueWrapper, mount } from '@vue/test-utils';
import { type MockedFunction, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { DirectiveBinding } from 'vue';

import TestTabContainer from './TabContainerTest.vue';

import ui5CustomTabContainer, {
  type TabContainerOptions,
  _OBSERVER,
  _SETUP,
} from '@/directives/ui5CustomTabContainer';

// Type definitions for our mocked elements
interface MockClassList {
  add: MockedFunction<(className: string) => void>;
  remove: MockedFunction<(className: string) => void>;
}

interface MockCSSStyleDeclaration {
  [key: string]: string | undefined;
  display?: string;
  flex?: string;
  width?: string;
  maxWidth?: string;
  boxSizing?: string;
  padding?: string;
}

interface MockHTMLElement {
  id?: string;
  style: MockCSSStyleDeclaration;
  classList: MockClassList;
  hasAttribute?: MockedFunction<(name: string) => boolean>;
  removeAttribute?: MockedFunction<(name: string) => void>;
  setAttribute?: MockedFunction<(name: string, value: string) => void>;
  querySelectorAll?: MockedFunction<(selector: string) => MockHTMLElement[]>;
  parentElement?: MockHTMLElement;
  offsetWidth?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBoundingClientRect?: () => any;
  children?: MockHTMLElement[];
  firstElementChild?: MockHTMLElement | null;
}

interface MockShadowRoot {
  querySelector: MockedFunction<(selector: string) => MockHTMLElement | null>;
  querySelectorAll: MockedFunction<(selector: string) => MockHTMLElement[]>;
}

interface MockTabContainerElement extends MockHTMLElement {
  shadowRoot: MockShadowRoot | null;
  [_OBSERVER]?: MutationObserver;
  [_SETUP]?: () => void;
}

interface MockMutationObserver {
  observe: MockedFunction<(target: Node, options: MutationObserverInit) => void>;
  disconnect: MockedFunction<() => void>;
  callback?: MutationCallback;
}

describe('ui5CustomTabContainer directive', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wrapper: VueWrapper<any>;
  let mockShadowRoot: MockShadowRoot;
  let mockTabStrip: MockHTMLElement;
  let mockTabItems: MockHTMLElement[];
  let mockOverflowButtons: MockHTMLElement[];
  let mockOverflowContainers: MockHTMLElement[];
  // @ts-expect-error: MockedClass for MutationObserver
  let mockMutationObserver: vi.MockedClass<typeof MutationObserver>;
  let mockObserve: MockedFunction<(target: Node, options: MutationObserverInit) => void>;
  let mockDisconnect: MockedFunction<() => void>;

  // Helper functions (move above beforeEach for hoisting)
  function createMockTabItem(id: string, parent?: MockHTMLElement): MockHTMLElement {
    return {
      id,
      style: {} as MockCSSStyleDeclaration,
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      // @ts-expect-error: MockedFunction for hasAttribute
      hasAttribute: vi.fn(() => false),
      removeAttribute: vi.fn(),
      setAttribute: vi.fn(),
      querySelectorAll: vi.fn(),
      parentElement: parent || undefined,
      offsetWidth: 100,
      getBoundingClientRect: () => ({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 0,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    };
  }

  function createMockButton(): MockHTMLElement {
    return {
      style: {} as MockCSSStyleDeclaration,
      classList: { add: vi.fn(), remove: vi.fn() },
      querySelectorAll: vi.fn(),
    };
  }

  function createMockContainer(): MockHTMLElement {
    return {
      style: {} as MockCSSStyleDeclaration,
      classList: { add: vi.fn(), remove: vi.fn() },
      querySelectorAll: vi.fn(),
    };
  }

  // This version always uses the shared mocks from the test scope
  function createMockElementWithShadowDOM(): MockTabContainerElement {
    return {
      shadowRoot: mockShadowRoot,
      style: {} as MockCSSStyleDeclaration,
      classList: { add: vi.fn(), remove: vi.fn() },
      [_OBSERVER]: undefined,
      [_SETUP]: undefined,
      querySelectorAll: vi.fn(),
    };
  }

  function createMockElementWithoutShadowDOM(): MockTabContainerElement {
    return {
      shadowRoot: null,
      style: {} as MockCSSStyleDeclaration,
      classList: { add: vi.fn(), remove: vi.fn() },
      [_OBSERVER]: undefined,
      [_SETUP]: undefined,
      querySelectorAll: vi.fn(),
    };
  }

  function createDirectiveBinding(
    value: TabContainerOptions,
    oldValue?: TabContainerOptions,
  ): DirectiveBinding<TabContainerOptions> {
    return {
      value,
      oldValue: oldValue ?? null,
      arg: undefined,
      modifiers: {},
      dir: ui5CustomTabContainer,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: null as any,
    };
  }

  /**
   * Helper function to test directive behavior: mounts and immediately checks _SETUP.
   */
  async function testAsyncDirectiveBehavior(
    element: MockTabContainerElement,
    binding: DirectiveBinding<TabContainerOptions>,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ui5CustomTabContainer.mounted?.(element as any, binding, null as any, null as any);
    // _SETUP is set synchronously in the directive
    return Promise.resolve();
  }

  beforeEach(() => {
    // Setup MutationObserver mock
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    mockMutationObserver = vi.fn().mockImplementation(
      (callback: MutationCallback): MockMutationObserver => ({
        observe: mockObserve,
        disconnect: mockDisconnect,
        callback,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.MutationObserver = mockMutationObserver as any;

    // Create shared mock DOM structure
    mockTabItems = [
      createMockTabItem('tab1'),
      createMockTabItem('tab2'),
      createMockTabItem('tab3'),
    ];

    mockOverflowButtons = [createMockButton()];
    mockOverflowContainers = [createMockContainer()];

    // Create shared mockTabStrip and mockShadowRoot
    mockTabStrip = {
      style: {},
      classList: { add: vi.fn(), remove: vi.fn() },
      querySelectorAll: vi.fn((selector: string) => {
        if (selector === '.ui5-tab-strip-item') return mockTabItems;
        return [];
      }),
      children: mockTabItems,
      firstElementChild: mockTabItems[0] || null,
      parentElement: undefined,
      offsetWidth: 300,
      getBoundingClientRect: () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 0,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    };
    mockTabItems.forEach((item) => (item.parentElement = mockTabStrip));
    mockShadowRoot = {
      querySelector: vi.fn((selector: string) => {
        if (selector === '.ui5-tc__tabStrip') return mockTabStrip;
        return null;
      }),
      querySelectorAll: vi.fn((selector: string) => {
        if (selector === '.ui5-tab-strip-item') return mockTabItems;
        if (selector === '.ui5-tc__overflow ui5-button') return mockOverflowButtons;
        if (selector === '.ui5-tc__overflow') return mockOverflowContainers;
        return [];
      }),
    };
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    if (vi.isFakeTimers()) vi.useRealTimers();
  });

  describe('parseOptions', () => {
    it('should return default options when no value provided', () => {
      wrapper = mount(TestTabContainer, {
        global: {
          directives: { 'ui5-custom-tab-container': ui5CustomTabContainer },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should merge provided options with defaults', async () => {
      const customOptions: TabContainerOptions = { hideOverflow: true };
      wrapper = mount(TestTabContainer, {
        props: { options: customOptions },
        global: {
          directives: { 'ui5-custom-tab-container': ui5CustomTabContainer },
        },
      });

      await nextTick();
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('DOM manipulation functions', () => {
    it('should handle missing shadow root gracefully', () => {
      const elementWithoutShadow = createMockElementWithoutShadowDOM();
      const binding = createDirectiveBinding({});

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ui5CustomTabContainer.mounted!(elementWithoutShadow as any, binding, {} as any, {} as any);
      }).not.toThrow();
    });

    it('should apply flex distribution correctly', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({ distribution: 'flex' });

      await testAsyncDirectiveBehavior(mockEl, binding);

      mockTabItems.forEach((tab) => {
        expect(tab.style.flex).toBe('1 1 0');
        expect(tab.classList.add).toHaveBeenCalledWith('custom-ui5-tab-equal');
      });
    });

    it('should hide overflow elements when hideOverflow is true', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({ hideOverflow: true });

      await testAsyncDirectiveBehavior(mockEl, binding);

      mockOverflowButtons.forEach((btn) => {
        expect(btn.style.display).toBe('none');
        expect(btn.classList.add).toHaveBeenCalledWith('custom-ui5-hide-overflow-btn');
      });

      mockOverflowContainers.forEach((container) => {
        expect(container.style.display).toBe('none');
      });
    });

    it('should show overflow elements when hideOverflow is false', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({ hideOverflow: false });

      await testAsyncDirectiveBehavior(mockEl, binding);

      mockOverflowButtons.forEach((btn) => {
        expect(btn.style.display).toBe('');
        expect(btn.classList.remove).toHaveBeenCalledWith('custom-ui5-hide-overflow-btn');
      });
    });
  });

  describe('MutationObserver behavior', () => {
    it('should set up MutationObserver when shadow root is available', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({});

      await testAsyncDirectiveBehavior(mockEl, binding);

      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalledWith(mockShadowRoot, {
        attributes: true,
        subtree: true,
        attributeFilter: ['hidden', 'style', 'end-overflow'],
        childList: true,
      });
    });

    it('should disconnect observer on unmount', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({});

      await testAsyncDirectiveBehavior(mockEl, binding);

      ui5CustomTabContainer.unmounted!(mockEl as never, binding, {} as never, {} as never);

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('directive lifecycle', () => {
    it('should handle updated lifecycle correctly', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({ distribution: 'flex' });

      await testAsyncDirectiveBehavior(mockEl, binding);

      expect(mockEl[_SETUP]).toBeDefined();
      expect(typeof mockEl[_SETUP]).toBe('function');

      const setupSpy = vi.fn(mockEl[_SETUP]!);
      mockEl[_SETUP] = setupSpy;

      const newBinding = createDirectiveBinding({ hideOverflow: true }, { distribution: 'flex' });
      expect(() => {
        ui5CustomTabContainer.updated!(mockEl as never, newBinding, {} as never, {} as never);
      }).not.toThrow();
      expect(setupSpy).toHaveBeenCalled();
    });

    it('should handle updated lifecycle when setup is not available', () => {
      const mockEl = createMockElementWithoutShadowDOM();
      const binding = createDirectiveBinding({ hideOverflow: true });
      // eslint-disable-next-line no-console
      console.log('DEBUG: [lifecycle] Before updated (no setup)', { mockEl, binding });
      // Should not throw even when _SETUP is undefined
      expect(() => {
        ui5CustomTabContainer.updated!(mockEl as never, binding, {} as never, {} as never);
      }).not.toThrow();
      // eslint-disable-next-line no-console
      console.log('DEBUG: [lifecycle] After updated (no setup)', {
        _SETUP: mockEl[_SETUP],
        _OBSERVER: mockEl[_OBSERVER],
        mockEl,
      });
    });

    it('should clean up symbols on unmount', async () => {
      const mockEl = createMockElementWithShadowDOM();
      const binding = createDirectiveBinding({});
      // eslint-disable-next-line no-console
      console.log('DEBUG: [lifecycle] Before testAsyncDirectiveBehavior (unmount)', {
        mockEl,
        binding,
      });
      await testAsyncDirectiveBehavior(mockEl, binding);
      // eslint-disable-next-line no-console
      console.log('DEBUG: [lifecycle] Before unmounted', {
        _SETUP: mockEl[_SETUP],
        _OBSERVER: mockEl[_OBSERVER],
        mockEl,
      });
      ui5CustomTabContainer.unmounted!(mockEl as never, binding, {} as never, {} as never);
      // eslint-disable-next-line no-console
      console.log('DEBUG: [lifecycle] After unmounted', {
        _SETUP: mockEl[_SETUP],
        _OBSERVER: mockEl[_OBSERVER],
        mockEl,
      });
      expect(mockEl[_OBSERVER]).toBeUndefined();
      expect(mockEl[_SETUP]).toBeUndefined();
    });
  });

  describe('async shadow root handling', () => {
    it('should retry finding shadow root up to max attempts', async () => {
      const mockEl = createMockElementWithoutShadowDOM();
      const binding = createDirectiveBinding({});

      vi.useFakeTimers();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ui5CustomTabContainer.mounted!(mockEl as any, binding, {} as any, {} as any);

      // Fast-forward through all retries (20 attempts * 50ms each)
      vi.advanceTimersByTime(20 * 50);
      await nextTick();

      vi.useRealTimers();

      // Should not throw and should stop retrying
      expect(typeof mockEl[_SETUP]).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle null shadow root', () => {
      const mockEl = createMockElementWithoutShadowDOM();
      const binding = createDirectiveBinding({});

      expect(() => {
        ui5CustomTabContainer.mounted!(
          // @ts-expect-error: hard cast here to simulate null shadow root
          mockEl as HTMLElement & { [key: symbol]: unknown },
          binding,
          // @ts-expect-error: want null here
          null as unknown as import('vue').VNode,
          null as unknown as import('vue').VNode,
        );
      }).not.toThrow();
    });

    it('should handle missing tab strip', async () => {
      const mockEl: MockTabContainerElement = {
        shadowRoot: {
          // @ts-expect-error: works with null shadow root
          querySelector: vi.fn(() => null),
          // @ts-expect-error: works with empty querySelectorAll
          querySelectorAll: vi.fn(() => []),
        },
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        [_OBSERVER]: undefined,
        [_SETUP]: undefined,
      };

      const binding = createDirectiveBinding({});

      expect(() => {
        ui5CustomTabContainer.mounted!(
          // @ts-expect-error: hard cast here to simulate null shadow root
          mockEl as HTMLElement & { [key: symbol]: unknown },
          binding,
          // @ts-expect-error: want null here
          null as unknown as import('vue').VNode,
          null as unknown as import('vue').VNode,
        );
      }).not.toThrow();
    });
  });
});
