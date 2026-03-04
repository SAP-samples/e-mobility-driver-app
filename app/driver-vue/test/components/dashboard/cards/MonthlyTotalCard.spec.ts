// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import MonthlyTotalCard from '@/components/dashboard/cards/MonthlyTotalCard.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('MonthlyTotalCard', () => {
  it('renders without crashing', () => {
    const { container } = render(MonthlyTotalCard, {
      props: {
        totalSessions: 10,
        totalKwh: 25.5,
        totalAmount: 99.99,
      },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders totalSessions, formatted kWh, and formatted price', () => {
    const { getByText } = render(MonthlyTotalCard, {
      props: {
        totalSessions: 7,
        totalKwh: 12.34,
        totalAmount: 56.78,
      },
      ...renderOptions,
    });
    expect(getByText('7')).toBeTruthy();
    expect(getByText((content) => content.includes('kWh'))).toBeTruthy();
    expect(getByText((content) => content.includes('€'))).toBeTruthy();
  });

  it('renders "Sessions" and "Spent" labels', () => {
    const { getByText } = render(MonthlyTotalCard, {
      props: {
        totalSessions: 3,
        totalKwh: 5.5,
        totalAmount: 20.0,
      },
      ...renderOptions,
    });
    expect(getByText('Sessions')).toBeTruthy();
    expect(getByText('Spent')).toBeTruthy();
  });
});
