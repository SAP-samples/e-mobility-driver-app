// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import ResponsiveGridLayout from '@/components/layout/ResponsiveGridLayout.vue';

describe('ResponsiveGridLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(ResponsiveGridLayout);
    expect(container).toBeTruthy();
  });

  it('renders slot content', () => {
    const { getByText } = render(ResponsiveGridLayout, {
      slots: {
        default: '<div>Grid Item</div>',
      },
    });
    expect(getByText('Grid Item')).toBeTruthy();
  });

  it('applies custom minWidth, maxColumns, and gap props', () => {
    const { container } = render(ResponsiveGridLayout, {
      props: {
        minWidth: '400px',
        maxColumns: 2,
        gap: '2rem',
      },
    });
    const root = container.querySelector('.responsive-grid-layout') as HTMLElement;
    expect(root.style.getPropertyValue('--min-width')).toBe('400px');
    expect(root.style.getPropertyValue('--max-columns')).toBe('2');
    expect(root.style.getPropertyValue('--gap')).toBe('2rem');
  });

  it('uses default prop values if not provided', () => {
    const { container } = render(ResponsiveGridLayout);
    const root = container.querySelector('.responsive-grid-layout') as HTMLElement;
    expect(root.style.getPropertyValue('--min-width')).toBe('320px');
    expect(root.style.getPropertyValue('--max-columns')).toBe('4');
    expect(root.style.getPropertyValue('--gap')).toBe('1rem');
  });

  it('updates CSS variables when props change', async () => {
    const { container, rerender } = render(ResponsiveGridLayout, {
      props: {
        minWidth: '400px',
        maxColumns: 2,
        gap: '2rem',
      },
    });
    const root = container.querySelector('.responsive-grid-layout') as HTMLElement;
    expect(root.style.getPropertyValue('--min-width')).toBe('400px');
    expect(root.style.getPropertyValue('--max-columns')).toBe('2');
    expect(root.style.getPropertyValue('--gap')).toBe('2rem');
    await rerender({ minWidth: '500px', maxColumns: 3, gap: '3rem' });
    expect(root.style.getPropertyValue('--min-width')).toBe('500px');
    expect(root.style.getPropertyValue('--max-columns')).toBe('3');
    expect(root.style.getPropertyValue('--gap')).toBe('3rem');
  });

  it('renders multiple slot items', () => {
    const { getByText } = render(ResponsiveGridLayout, {
      slots: {
        default: '<div>Item 1</div><div>Item 2</div>',
      },
    });
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });

  it('falls back to default if maxColumns is undefined', () => {
    const { container } = render(ResponsiveGridLayout, {
      props: {
        maxColumns: undefined,
      },
    });
    const root = container.querySelector('.responsive-grid-layout') as HTMLElement;
    expect(root.style.getPropertyValue('--max-columns')).toBe('4');
  });
});
