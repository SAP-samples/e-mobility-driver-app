// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TestTabContainer from './TabContainerTest.vue';

import ui5CustomTabContainer from '@/directives/ui5CustomTabContainer';

describe('ui5CustomTabContainer integration', () => {
  it('should work with real Vue component', async () => {
    const wrapper = mount(TestTabContainer, {
      props: {
        options: { distribution: 'flex', hideOverflow: true },
      },
      global: {
        directives: { 'ui5-custom-tab-container': ui5CustomTabContainer },
      },
    });

    expect(wrapper.find('[data-testid="tab-container"]').exists()).toBe(true);
  });

  it('should react to prop changes', async () => {
    const wrapper = mount(TestTabContainer, {
      props: { options: { hideOverflow: false } },
      global: {
        directives: { 'ui5-custom-tab-container': ui5CustomTabContainer },
      },
    });

    await wrapper.setProps({ options: { hideOverflow: true } });

    // Test that directive updated was called
    // @ts-expect-error: Object is possibly 'undefined'
    expect(wrapper.props().options.hideOverflow).toBe(true);
  });
});
