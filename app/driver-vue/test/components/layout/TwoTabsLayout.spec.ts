// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import TwoTabsLayout from '@/components/layout/TwoTabsLayout.vue';

describe('TwoTabsLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(TwoTabsLayout);
    expect(container).toBeTruthy();
  });

  it('renders slot content for both tabs', () => {
    const { getByText } = render(TwoTabsLayout, {
      slots: {
        tab1: '<div>Tab 1 Content</div>',
        tab2: '<div>Tab 2 Content</div>',
      },
    });
    expect(getByText('Tab 1 Content')).toBeTruthy();
    expect(getByText('Tab 2 Content')).toBeTruthy();
  });
});
