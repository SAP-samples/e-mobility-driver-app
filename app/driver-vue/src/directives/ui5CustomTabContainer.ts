// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { type DirectiveBinding, type ObjectDirective } from 'vue';

export interface TabContainerOptions {
  distribution?: 'flex';
  hideOverflow?: boolean;
}

const defaultOptions: TabContainerOptions = {
  distribution: 'flex',
  hideOverflow: false,
};

function parseOptions(binding: DirectiveBinding): TabContainerOptions {
  const value = binding.value;
  if (typeof value === 'object' && value !== null) {
    return { ...defaultOptions, ...value };
  }
  return defaultOptions;
}

function getShadowRoot(el: Element): ShadowRoot | null {
  return (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot || null;
}
function getTabStrip(shadowRoot: ShadowRoot): HTMLElement | null {
  return shadowRoot.querySelector<HTMLElement>('.ui5-tc__tabStrip');
}
function getTabItems(tabStrip: HTMLElement): NodeListOf<HTMLElement> {
  return tabStrip.querySelectorAll<HTMLElement>('.ui5-tab-strip-item');
}
function getOverflowButtons(shadowRoot: ShadowRoot): NodeListOf<HTMLElement> {
  return shadowRoot.querySelectorAll('.ui5-tc__overflow ui5-button');
}
function getOverflowContainers(shadowRoot: ShadowRoot): NodeListOf<HTMLElement> {
  return shadowRoot.querySelectorAll('.ui5-tc__overflow');
}

export const _OBSERVER = Symbol('ui5Obs');
export const _SETUP = Symbol('ui5Setup');

interface TabContainerHTMLElement extends HTMLElement {
  [_OBSERVER]?: MutationObserver;
  [_SETUP]?: () => void;
}

const ui5CustomTabContainer: ObjectDirective<TabContainerHTMLElement, unknown> = {
  mounted(el, binding) {
    let options = parseOptions(binding);

    function forceAllTabsVisible(tabStrip: HTMLElement) {
      const tabItems = getTabItems(tabStrip);
      tabItems.forEach((tab) => {
        if (tab.hasAttribute('hidden')) tab.removeAttribute('hidden');
        if (tab.hasAttribute('end-overflow')) tab.removeAttribute('end-overflow');
        tab.style.display = ''; // reset, mais "hidden" prime
      });
    }

    function applyCustomStyle() {
      const shadowRoot = getShadowRoot(el);
      if (!shadowRoot) return;
      const tabStrip = getTabStrip(shadowRoot);
      if (!tabStrip) return;
      const tabItems = getTabItems(tabStrip);

      forceAllTabsVisible(tabStrip);

      if (options.distribution === 'flex') {
        const percent = 100 / tabItems.length + '%';
        tabItems.forEach((tab) => {
          tab.classList.add('custom-ui5-tab-equal');
          tab.style.flex = '1 1 0';
          tab.style.width = percent;
          tab.style.maxWidth = percent;
          tab.style.boxSizing = 'border-box';
          tab.style.padding = '0';
        });
      }

      if (options.hideOverflow) {
        getOverflowButtons(shadowRoot).forEach((btn) => {
          btn.classList.add('custom-ui5-hide-overflow-btn');
          btn.style.display = 'none';
        });
        getOverflowContainers(shadowRoot).forEach((container) => {
          (container as HTMLElement).style.display = 'none';
        });
      } else {
        getOverflowButtons(shadowRoot).forEach((btn) => {
          btn.classList.remove('custom-ui5-hide-overflow-btn');
          btn.style.display = '';
        });
        getOverflowContainers(shadowRoot).forEach((container) => {
          (container as HTMLElement).style.display = '';
        });
      }
    }

    let observer: MutationObserver | undefined;
    function setup() {
      options = parseOptions(binding);
      applyCustomStyle();
      if (observer) observer.disconnect();
      const shadowRoot = getShadowRoot(el);
      if (!shadowRoot) return;
      observer = new MutationObserver(() => {
        applyCustomStyle();
      });
      observer.observe(shadowRoot, {
        attributes: true,
        subtree: true,
        attributeFilter: ['hidden', 'style', 'end-overflow'],
        childList: true,
      });
    }

    let tries = 0,
      max = 20;
    function wait() {
      if (getShadowRoot(el)) setup();
      else if (tries < max) {
        tries++;
        setTimeout(wait, 50);
      }
    }
    wait();

    el[_OBSERVER] = observer;
    el[_SETUP] = setup;
  },
  updated(el, _binding) {
    const setup = el[_SETUP];
    if (typeof setup === 'function') setup();
  },
  unmounted(el) {
    const observer = el[_OBSERVER];
    if (observer) observer.disconnect();
    el[_OBSERVER] = undefined;
    el[_SETUP] = undefined;
  },
};

export default ui5CustomTabContainer;
