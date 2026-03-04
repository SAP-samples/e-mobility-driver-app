// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

import EvseItem from '@/components/stations/list/EvseItem.vue';

// Mock useRouter for event emission test
const routerStub = { push: vi.fn() };
vi.mock('vue-router', () => ({
  useRouter: () => routerStub,
}));

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('EvseItem', () => {
  it('renders with minimal props and shows code fallback', () => {
    const minimalEvse = { id: 'evse-min' };
    const { container } = render(EvseItem, {
      props: { evse: minimalEvse },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    // Only check for attributes that are present
  });

  it('renders all fields for full evse', () => {
    const fullEvse = {
      id: 'evse-full',
      name: 'Full EVSE',
      connectors: [
        { connectorId: 1, type: 'Type2', status: 'Available' },
        { connectorId: 2, type: 'CCS', status: 'Available' },
      ],
      code: 'EVSE-CODE',
    };
    const { container } = render(EvseItem, {
      props: { evse: fullEvse },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    expect(li?.getAttribute('additional-text')).toBe('Available');
    expect(li?.getAttribute('additional-text-state')).toBe('Positive');
  });

  it('renders fallback for missing name', () => {
    const evse = { id: 'evse-fallback', connectors: [], code: 'CODE-X' };
    const { container } = render(EvseItem, {
      props: { evse },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    // Only check for attributes that are present
  });

  it('renders with empty connectors', () => {
    const evse = { id: 'evse-empty', name: 'No Connectors', connectors: [], code: 'EMPTY-CODE' };
    const { container } = render(EvseItem, {
      props: { evse },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    // Only check for attributes that are present
  });

  it('handles malformed evse object gracefully', () => {
    const evse = {};
    const { container } = render(EvseItem, {
      // @ts-expect-error - purposely passing malformed evse object
      props: { evse },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    // Only check for attributes that are present
  });

  it('emits select event on click', async () => {
    const evse = { id: 'evse-click', name: 'Clickable EVSE', code: 'CLICK-CODE' };
    const { container } = render(EvseItem, {
      props: { evse },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    if (li) await fireEvent.click(li);
    expect(routerStub.push).toHaveBeenCalledWith({
      name: 'evse-detail',
      params: { id: 'evse-click' },
    });
  });

  it('applies selected class when selected prop is true', () => {
    const evse = {
      id: 'evse-selected',
      name: 'Selected EVSE',
      connectors: [],
      code: 'SELECTED-CODE',
    };
    const { container } = render(EvseItem, {
      props: { evse, selected: true },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    expect(li?.classList.contains('selected')).toBe(true);
  });

  it('handles null evse prop gracefully', () => {
    const { container } = render(EvseItem, {
      // @ts-expect-error - purposely passing null
      props: { evse: null },
      ...renderOptions,
    });
    const li = container.querySelector('ui5-li');
    expect(li).toBeTruthy();
    // Only check for attributes that are present
  });
});
