// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import DashboardCardLayout from '@/components/dashboard/layout/DashboardCardLayout.vue';

describe('DashboardCardLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(DashboardCardLayout);
    expect(container).toBeTruthy();
  });

  it('renders title, content, and actions slots', () => {
    const { getByText } = render(DashboardCardLayout, {
      slots: {
        title: '<span>Card Title</span>',
        default: '<div>Card Content</div>',
        actions: '<button>Action</button>',
      },
    });
    expect(getByText('Card Title')).toBeTruthy();
    expect(getByText('Card Content')).toBeTruthy();
    expect(getByText('Action')).toBeTruthy();
  });

  it('applies with-actions class when actions slot is present', () => {
    const { container } = render(DashboardCardLayout, {
      slots: {
        actions: '<button>Action</button>',
      },
    });
    const cardContent = container.querySelector('.card-content');
    expect(cardContent?.classList.contains('with-actions')).toBe(true);
  });

  it('does not apply with-actions class when actions slot is absent', () => {
    const { container } = render(DashboardCardLayout);
    const cardContent = container.querySelector('.card-content');
    expect(cardContent?.classList.contains('with-actions')).toBe(false);
  });
});
