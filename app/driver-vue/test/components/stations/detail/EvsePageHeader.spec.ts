// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createTestI18n } from '@test/support/i18n';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvsePageHeader from '@/components/stations/detail/EvsePageHeader.vue';

const renderOptions = {
  global: {
    plugins: [createTestI18n()],
  },
};

describe('EvsePageHeader', () => {
  const baseEvse = {
    id: 'evse-1',
    chargingStationName: 'Station Alpha',
    emi3Id: 'EMI3-XYZ',
  };

  it('renders charging station name and emi3Id', () => {
    const { getByText } = render(EvsePageHeader, { props: { evse: baseEvse }, ...renderOptions });
    expect(getByText('Charging Station Name')).toBeTruthy();
    expect(getByText('Station Alpha')).toBeTruthy();
    expect(getByText('eMI3')).toBeTruthy();
    expect(getByText('EMI3-XYZ')).toBeTruthy();
  });

  it('renders empty text if fields are missing', () => {
    const evse = { id: 'evse-2' };
    const { container } = render(EvsePageHeader, { props: { evse }, ...renderOptions });
    const textEls = container.querySelectorAll('.text');
    expect(textEls[0].textContent).toBe('');
    expect(textEls[1].textContent).toBe('');
  });

  it('renders correctly with only chargingStationName', () => {
    const evse = { id: 'evse-3', chargingStationName: 'Only Station' };
    const { getByText, container } = render(EvsePageHeader, { props: { evse }, ...renderOptions });
    expect(getByText('Charging Station Name')).toBeTruthy();
    expect(getByText('Only Station')).toBeTruthy();
    expect(getByText('eMI3')).toBeTruthy();
    const textEls = container.querySelectorAll('.text');
    expect(textEls[1].textContent).toBe('');
  });

  it('renders correctly with only emi3Id', () => {
    const evse = { id: 'evse-4', emi3Id: 'ONLY-EMI3' };
    const { getByText, container } = render(EvsePageHeader, { props: { evse }, ...renderOptions });
    expect(getByText('Charging Station Name')).toBeTruthy();
    expect(getByText('eMI3')).toBeTruthy();
    expect(getByText('ONLY-EMI3')).toBeTruthy();
    const textEls = container.querySelectorAll('.text');
    expect(textEls[0].textContent).toBe('');
  });

  it('renders empty for empty string fields', () => {
    const evse = { id: 'evse-5', chargingStationName: '', emi3Id: '' };
    const { container } = render(EvsePageHeader, { props: { evse }, ...renderOptions });
    const textEls = container.querySelectorAll('.text');
    expect(textEls[0].textContent).toBe('');
    expect(textEls[1].textContent).toBe('');
  });

  it('handles irrelevant fields gracefully', () => {
    const evse = { id: 'evse-6', foo: 'bar', chargingStationName: 'X', emi3Id: 'Y' };
    const { getByText } = render(EvsePageHeader, { props: { evse }, ...renderOptions });
    expect(getByText('X')).toBeTruthy();
    expect(getByText('Y')).toBeTruthy();
  });

  it('handles null evse prop gracefully', () => {
    // @ts-expect-error purposely passing null
    const { container } = render(EvsePageHeader, { props: { evse: null }, ...renderOptions });
    const textEls = container.querySelectorAll('.text');
    expect(textEls[0].textContent).toBe('');
    expect(textEls[1].textContent).toBe('');
  });
});
