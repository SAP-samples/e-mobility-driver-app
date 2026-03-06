// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import DashboardGenericLayout from '@/components/layout/DashboardGenericLayout.vue';

describe('DashboardGenericLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(DashboardGenericLayout);
    expect(container).toBeTruthy();
  });

  it('renders default slot content', () => {
    const { getByText } = render(DashboardGenericLayout, {
      slots: {
        default: '<div>Default Card</div>',
      },
    });
    expect(getByText('Default Card')).toBeTruthy();
  });

  it('does not render highlighted card slot by default', () => {
    const { queryByText } = render(DashboardGenericLayout, {
      slots: {
        'highlighted-card': '<div>Highlighted Card</div>',
      },
    });
    expect(queryByText('Highlighted Card')).toBeNull();
  });

  it('renders highlighted card slot when highlightedCard is true', () => {
    const { getByText } = render(DashboardGenericLayout, {
      props: { highlightedCard: true },
      slots: {
        'highlighted-card': '<div>Highlighted Card</div>',
      },
    });
    expect(getByText('Highlighted Card')).toBeTruthy();
  });
});
