// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import BadgeItem from '@/components/badges/BadgeItem.vue';
import Badges from '@/components/badges/Badges.vue';

const mockBadges = [
  {
    authenticationId: 'auth-1',
    visualBadgeId: 'VB-001',
    description: 'Test Badge 1',
    firstName: 'John',
    lastName: 'Doe',
    licensePlate: 'ABC-123',
    active: true,
  },
  {
    authenticationId: 'auth-2',
    visualBadgeId: 'VB-002',
    description: 'Test Badge 2',
    firstName: 'Jane',
    lastName: 'Smith',
    licensePlate: 'XYZ-789',
    active: false,
  },
];

const renderOptions = {
  global: {
    components: { BadgeItem },
    plugins: [createTestI18n()],
  },
};

describe('Badges.vue', () => {
  it('renders a list of BadgeItem components', () => {
    const { getAllByTestId } = render(Badges, {
      props: { badges: mockBadges },
      ...renderOptions,
    });
    expect(getAllByTestId('badge-item')).toHaveLength(mockBadges.length);
  });
});
