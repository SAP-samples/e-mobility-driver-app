// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import EvseStatusTag from '@/components/stations/shared/EvseStatusTag.vue';

describe('EvseStatusTag', () => {
  it('renders with AVAILABLE status', () => {
    const evse = { id: 'evse-1', connectors: [{ connectorId: 1, status: 'AVAILABLE' }] };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Positive');
    expect(tag?.textContent).toMatch(/Available/i);
  });

  it('renders with CHARGING status', () => {
    const evse = { id: 'evse-2', connectors: [{ connectorId: 2, status: 'CHARGING' }] };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Information');
    expect(tag?.textContent).toMatch(/Occupied/i);
  });

  it('renders with INOPERATIVE status', () => {
    const evse = { id: 'evse-3', connectors: [{ connectorId: 3, status: 'UNAVAILABLE' }] };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Negative');
    expect(tag?.textContent).toMatch(/Inoperative/i);
  });

  it('renders with OUTOFORDER status', () => {
    const evse = { id: 'evse-4', connectors: [{ connectorId: 4, status: 'FAULTED' }] };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Negative');
    expect(tag?.textContent).toMatch(/Outoforder|Out of order/i);
  });

  it('renders with RESERVED status', () => {
    const evse = { id: 'evse-5', connectors: [{ connectorId: 5, status: 'RESERVED' }] };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Critical');
    expect(tag?.textContent).toMatch(/Reserved/i);
  });

  it('renders with unknown status', () => {
    const evse = { id: 'evse-6', connectors: [{ connectorId: 6, status: 'UNKNOWN' }] };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Negative');
    expect(tag?.textContent).toMatch(/Inoperative/i);
  });

  it('renders with multiple connectors, one CHARGING', () => {
    const evse = {
      id: 'evse-multi-1',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'CHARGING' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Information');
    expect(tag?.textContent).toMatch(/Occupied/i);
  });

  it('renders with multiple connectors, one FAULTED', () => {
    const evse = {
      id: 'evse-multi-2',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'FAULTED' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Positive');
    expect(tag?.textContent).toMatch(/Available/i);
  });

  it('renders with multiple connectors, all AVAILABLE', () => {
    const evse = {
      id: 'evse-multi-3',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'AVAILABLE' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Positive');
    expect(tag?.textContent).toMatch(/Available/i);
  });

  it('renders with multiple connectors, one RESERVED', () => {
    const evse = {
      id: 'evse-multi-4',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'RESERVED' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Positive');
    expect(tag?.textContent).toMatch(/Available/i);
  });

  it('renders with multiple connectors, one UNAVAILABLE', () => {
    const evse = {
      id: 'evse-multi-5',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'UNAVAILABLE' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Positive');
    expect(tag?.textContent).toMatch(/Available/i);
  });

  it('renders with multiple connectors, one PREPARING', () => {
    const evse = {
      id: 'evse-multi-6',
      connectors: [
        { connectorId: 1, status: 'UNAVAILABLE' },
        { connectorId: 2, status: 'PREPARING' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Information');
    expect(tag?.textContent).toMatch(/Preparing/i);
  });

  it('renders with multiple connectors, one FINISHING', () => {
    const evse = {
      id: 'evse-multi-7',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'FINISHING' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Information');
    expect(tag?.textContent).toMatch(/Occupied/i);
  });

  it('renders with multiple connectors, one SUSPENDED_EV', () => {
    const evse = {
      id: 'evse-multi-8',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'SUSPENDEDEV' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Information');
    expect(tag?.textContent).toMatch(/Occupied/i);
  });

  it('renders with multiple connectors, one SUSPENDED_EVSE', () => {
    const evse = {
      id: 'evse-multi-9',
      connectors: [
        { connectorId: 1, status: 'AVAILABLE' },
        { connectorId: 2, status: 'SUSPENDEDEVSE' },
      ],
    };
    const { container } = render(EvseStatusTag, { props: { evse } });
    const tag = container.querySelector('ui5-tag');
    expect(tag).toBeTruthy();
    expect(tag?.getAttribute('design')).toBe('Information');
    expect(tag?.textContent).toMatch(/Occupied/i);
  });
});
