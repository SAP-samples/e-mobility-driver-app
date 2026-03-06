// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

import QuickHistoryCard from '@/components/dashboard/cards/QuickHistoryCard.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('QuickHistoryCard', () => {
  it('renders without crashing', () => {
    const { container } = render(QuickHistoryCard, {
      props: {
        sessions: [],
        onViewAll: vi.fn(),
      },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders session count and list items', () => {
    const sessions = [
      {
        id: 1,
        station: 'Station A',
        date: '2025-07-15',
        energy: 5.2,
        amount: 10.5,
        currency: 'EUR',
      },
      {
        id: 2,
        station: 'Station B',
        date: '2025-07-14',
        energy: 4.8,
        amount: 9.0,
        currency: 'EUR',
      },
    ];
    const { getByText } = render(QuickHistoryCard, {
      props: {
        sessions,
        onViewAll: vi.fn(),
      },
      ...renderOptions,
    });
    expect(getByText('2')).toBeTruthy();
    expect(getByText((content) => content.includes('Station A'))).toBeTruthy();
    expect(getByText((content) => content.includes('Station B'))).toBeTruthy();
    expect(getByText('Recent sessions')).toBeTruthy();
  });

  it('calls onViewAll when button is clicked', async () => {
    const onViewAll = vi.fn();
    const { getByText } = render(QuickHistoryCard, {
      props: {
        sessions: [],
        onViewAll,
      },
      ...renderOptions,
    });
    const button = getByText('View History');
    await fireEvent.click(button);
    expect(onViewAll).toHaveBeenCalled();
  });
});
