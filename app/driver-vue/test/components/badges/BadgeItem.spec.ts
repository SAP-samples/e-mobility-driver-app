// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import BadgeItem from '@/components/badges/BadgeItem.vue';

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
    plugins: [createTestI18n()],
  },
};

describe('BadgeItem.vue', () => {
  it('renders badge details and status for active badge', () => {
    const badge = mockBadges[0];
    const { getByText, container } = render(BadgeItem, {
      props: { badge },
      ...renderOptions,
    });
    const header = container.querySelector('ui5-card-header');
    expect(header?.getAttribute('title-text')).toBe(badge.visualBadgeId);
    expect(getByText('Active')).toBeTruthy();
    expect(getByText(badge.firstName)).toBeTruthy();
    expect(getByText(badge.lastName)).toBeTruthy();
    expect(getByText(badge.licensePlate)).toBeTruthy();
    // Check ui5-tag design attribute or property
    const tags = container.querySelectorAll('ui5-tag');
    expect(tags.length).toBeGreaterThan(0);
    const hasPositive = Array.from(tags).some(
      (tag) =>
        tag.getAttribute('design') === 'Positive' ||
        // @ts-expect-error: UI5 Web Components expose design as a property, not a TS type
        tag.design === 'Positive',
    );
    expect(hasPositive).toBe(true);
  });

  it('renders badge details and status for inactive badge', () => {
    const badge = mockBadges[1];
    const { getByText, container } = render(BadgeItem, {
      props: { badge },
      ...renderOptions,
    });
    expect(getByText('Expired')).toBeTruthy();
    // Check ui5-tag design attribute or property
    const tags = container.querySelectorAll('ui5-tag');
    expect(tags.length).toBeGreaterThan(0);
    const hasNegative = Array.from(tags).some(
      (tag) =>
        tag.getAttribute('design') === 'Negative' ||
        // @ts-expect-error: UI5 Web Components expose design as a property, not a TS type
        tag.design === 'Negative',
    );
    expect(hasNegative).toBe(true);
  });
});
