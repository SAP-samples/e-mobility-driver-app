// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { useDateFormat } from '@vueuse/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFormatter } from '@/composables/useFormatter';

// Mock useDateFormat from @vueuse/core
vi.mock('@vueuse/core', () => ({
  useDateFormat: vi.fn(),
}));

const mockedUseDateFormat = useDateFormat as unknown as ReturnType<typeof vi.fn>;

describe('useFormatter composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats date correctly', () => {
    mockedUseDateFormat.mockReturnValue({ value: '2025-07-15' });
    const { formatDate } = useFormatter();
    expect(formatDate(new Date()).value).toBe('2025-07-15');
  });

  it('formats date time correctly', () => {
    mockedUseDateFormat.mockReturnValue({ value: '2025-07-15 13:45' });
    const { formatDateTime } = useFormatter();
    expect(formatDateTime(new Date()).value).toBe('2025-07-15 13:45');
  });

  it('formats duration correctly', () => {
    const { formatDuration } = useFormatter();
    expect(formatDuration(0)).toBe('00H00');
    expect(formatDuration(3661)).toBe('01H01');
    expect(formatDuration(86399)).toBe('23H59');
  });

  it('formats price correctly', () => {
    const { formatPrice } = useFormatter();
    expect(formatPrice(12, 'EUR')).toBe('12.00 EUR');
    expect(formatPrice(12.345, 'USD')).toBe('12.35 USD');
    expect(formatPrice(-5, 'JPY')).toBe('-5.00 JPY');
  });

  it('formats kWh correctly', () => {
    const { formatKWh } = useFormatter();
    expect(formatKWh(0)).toBe('0 kWh');
    expect(formatKWh(1500)).toBe('1.50 kWh');
    expect(formatKWh(12345)).toBe('12.35 kWh');
    expect(formatKWh(-1000)).toBe('-1.00 kWh');
  });

  it('formats duration with negative and large values', () => {
    const { formatDuration } = useFormatter();
    expect(formatDuration(-1)).toBe('-1H-1'); // negative seconds, matches implementation
    expect(formatDuration(3600 * 100)).toBe('100H00'); // 100 hours
    expect(formatDuration(Number.MAX_SAFE_INTEGER)).toMatch(/\d+H\d+/); // very large
  });

  it('formats price with extreme and edge values', () => {
    const { formatPrice } = useFormatter();
    expect(formatPrice(0, 'USD')).toBe('0.00 USD');
    expect(formatPrice(0.004, 'USD')).toBe('0.00 USD'); // rounds down
    expect(formatPrice(0.005, 'USD')).toBe('0.01 USD'); // rounds up
    expect(formatPrice(9999999.999, 'EUR')).toBe('10000000.00 EUR');
    expect(formatPrice(NaN, 'USD')).toBe('-');
    expect(formatPrice(Infinity, 'USD')).toBe('-');
    expect(formatPrice(-Infinity, 'USD')).toBe('-');
  });

  it('formats kWh with edge and floating values', () => {
    const { formatKWh } = useFormatter();
    expect(formatKWh(1)).toBe('0.00 kWh'); // less than 1 Wh
    expect(formatKWh(999)).toBe('1.00 kWh'); // rounds up
    expect(formatKWh(1001)).toBe('1.00 kWh'); // rounds down
    expect(formatKWh(1000000)).toBe('1000.00 kWh'); // large value
    expect(formatKWh(NaN)).toBe('- kWh');
    expect(formatKWh(Infinity)).toBe('- kWh');
    expect(formatKWh(-Infinity)).toBe('- kWh');
  });

  it('formats date and datetime with null/undefined', () => {
    mockedUseDateFormat.mockReturnValue({ value: 'invalid' });
    const { formatDate, formatDateTime } = useFormatter();
    // @ts-expect-error purposely testing unknown/undefined/null
    expect(formatDate(null).value).toBe('invalid');
    expect(formatDateTime(undefined).value).toBe('invalid');
  });
});
