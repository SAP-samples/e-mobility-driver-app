// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import DynamicPageLayout from '@/components/layout/DynamicPageLayout.vue';

describe('DynamicPageLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(DynamicPageLayout);
    expect(container).toBeTruthy();
  });

  it('renders slot content when not loading', () => {
    const { getByText } = render(DynamicPageLayout, {
      props: { loading: false },
      slots: {
        default: '<div>Page Content</div>',
      },
    });
    expect(getByText('Page Content')).toBeTruthy();
  });

  it('renders loading indicator and loadingText when loading is true', () => {
    const { container } = render(DynamicPageLayout, {
      props: { loading: true, loadingText: 'Please wait...' },
    });
    const busyIndicator = container.querySelector('ui5-busy-indicator');
    expect(busyIndicator).toBeTruthy();
    expect(busyIndicator?.getAttribute('text')).toBe('Please wait...');
  });

  it('renders titleArea and headerArea slots', () => {
    const { getByText } = render(DynamicPageLayout, {
      slots: {
        titleArea: '<div>Title Area</div>',
        headerArea: '<div>Header Area</div>',
      },
    });
    expect(getByText('Title Area')).toBeTruthy();
    expect(getByText('Header Area')).toBeTruthy();
  });
});
