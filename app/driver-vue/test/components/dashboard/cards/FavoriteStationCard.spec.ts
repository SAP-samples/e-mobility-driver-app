// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

import FavoriteStationCard from '@/components/dashboard/cards/FavoriteStationCard.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('FavoriteStationCard', () => {
  it('renders without crashing', () => {
    const { container } = render(FavoriteStationCard, {
      props: {
        station: 'Station A',
        available: 3,
        onNavigate: vi.fn(),
      },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders station name and available count', () => {
    const { getByText } = render(FavoriteStationCard, {
      props: {
        station: 'Central Station',
        available: 5,
        onNavigate: vi.fn(),
      },
      ...renderOptions,
    });
    expect(getByText('Central Station')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('shows "Available charging points" text', () => {
    const { getByText } = render(FavoriteStationCard, {
      props: {
        station: 'West Station',
        available: 2,
        onNavigate: vi.fn(),
      },
      ...renderOptions,
    });
    expect(getByText('Charge points available')).toBeTruthy();
  });

  it('calls onNavigate when button is clicked', async () => {
    const onNavigate = vi.fn();
    const { getByText } = render(FavoriteStationCard, {
      props: {
        station: 'East Station',
        available: 4,
        onNavigate,
      },
      ...renderOptions,
    });
    const button = getByText('View on map');
    await fireEvent.click(button);
    expect(onNavigate).toHaveBeenCalled();
  });
});
