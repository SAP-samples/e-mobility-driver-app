// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { isWithinRadius } from '@/store/utils/geo';

describe('isWithinRadius', () => {
  it('returns true for the same point', () => {
    expect(isWithinRadius(0, 0, 0, 0, 1)).toBe(true);
  });

  it('returns true for points within the radius', () => {
    // ~78m apart
    expect(isWithinRadius(48.8584, 2.2945, 48.8591, 2.2945, 100)).toBe(true);
  });

  it('returns false for points outside the radius', () => {
    // ~157m apart
    expect(isWithinRadius(48.8584, 2.2945, 48.8598, 2.2945, 100)).toBe(false);
  });

  it('returns true for points very close to the radius (floating point tolerance)', () => {
    // ~999.6m apart, radius 1000m
    expect(isWithinRadius(48.8584, 2.2945, 48.867393, 2.2945, 1000)).toBe(true);
  });

  it('works for negative lat/lon values', () => {
    expect(isWithinRadius(-34.6037, -58.3816, -34.6037, -58.3816, 10)).toBe(true);
  });
});
