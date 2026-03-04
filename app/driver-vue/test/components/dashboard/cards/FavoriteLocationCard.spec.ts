// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

import FavoriteLocationCard from '@/components/dashboard/cards/FavoriteLocationCard.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('FavoriteLocationCard', () => {
  it('renders without crashing', () => {
    const { container } = render(FavoriteLocationCard, {
      props: {
        locationName: 'Main Location',
        available: 5,
        onViewStations: vi.fn(),
        loading: false,
      },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders locationName and available count', () => {
    const { getByText } = render(FavoriteLocationCard, {
      props: {
        locationName: 'Central Park',
        available: 7,
        onViewStations: vi.fn(),
        loading: false,
      },
      ...renderOptions,
    });
    expect(getByText('Central Park')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
  });

  it('shows loading indicator and text when loading is true', () => {
    const { getByText, container } = render(FavoriteLocationCard, {
      props: {
        locationName: 'West End',
        available: 3,
        onViewStations: vi.fn(),
        loading: true,
      },
      ...renderOptions,
    });
    expect(getByText('Loading...')).toBeTruthy();
    expect(container.querySelector('ui5-busy-indicator')).toBeTruthy();
  });

  it('shows "View stations list" when not loading', () => {
    const { getByText } = render(FavoriteLocationCard, {
      props: {
        locationName: 'East Side',
        available: 2,
        onViewStations: vi.fn(),
        loading: false,
      },
      ...renderOptions,
    });
    expect(getByText('View Charge Points')).toBeTruthy();
  });

  it('calls onViewStations when button is clicked', async () => {
    const onViewStations = vi.fn();
    const { getByText } = render(FavoriteLocationCard, {
      props: {
        locationName: 'South Point',
        available: 4,
        onViewStations,
        loading: false,
      },
      ...renderOptions,
    });
    const button = getByText('View Charge Points');
    await fireEvent.click(button);
    expect(onViewStations).toHaveBeenCalled();
  });
});
