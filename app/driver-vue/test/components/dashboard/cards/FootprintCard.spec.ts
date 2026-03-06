// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import FootprintCard from '@/components/dashboard/cards/FootprintCard.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('FootprintCard', () => {
  it('renders without crashing', () => {
    const { container } = render(FootprintCard, {
      props: {
        co2: 123.45,
      },
      ...renderOptions,
    });
    expect(container).toBeTruthy();
  });

  it('renders co2 value and label', () => {
    const { getByText } = render(FootprintCard, {
      props: {
        co2: 99.9,
      },
      ...renderOptions,
    });
    expect(getByText('99.9 kg CO₂')).toBeTruthy();
    expect(getByText('of emissions avoided')).toBeTruthy();
  });

  it('renders progress indicator with correct display value', () => {
    const { container } = render(FootprintCard, {
      props: {
        co2: 50,
      },
      ...renderOptions,
    });
    const progress = container.querySelector('ui5-progress-indicator');
    expect(progress).toBeTruthy();
    expect(progress?.getAttribute('display-value')).toBe('Level 3 / 5');
  });
});
