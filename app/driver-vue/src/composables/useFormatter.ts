// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { type DateLike, type UseDateFormatReturn, useDateFormat } from '@vueuse/core';

export function useFormatter() {
  function formatDate(date: DateLike): UseDateFormatReturn {
    return useDateFormat(date, 'YYYY-MM-DD');
  }
  function formatDateTime(date: DateLike): UseDateFormatReturn {
    return useDateFormat(date, 'YYYY-MM-DD HH:mm');
  }
  function formatDuration(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}H${minutes.toString().padStart(2, '0')}`;
  }
  function formatPrice(price: number, currency: string): string {
    if (!Number.isFinite(price)) return '-';
    return `${price.toFixed(2)} ${currency}`;
  }
  function formatKWh(wattHours: number): string {
    if (!Number.isFinite(wattHours)) return '- kWh';
    if (wattHours === 0) return `0 kWh`;
    const kWh = wattHours / 1000;
    return `${kWh.toFixed(2)} kWh`;
  }

  return { formatDate, formatDateTime, formatDuration, formatPrice, formatKWh };
}
