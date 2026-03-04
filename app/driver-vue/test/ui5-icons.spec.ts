// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

// Track if the icon packages are imported by using spies
const iconsImport = vi.fn();
const tntImport = vi.fn();
const businessSuiteImport = vi.fn();

vi.mock('@ui5/webcomponents-icons/dist/AllIcons.js', () => {
  iconsImport();
  return { __esModule: true };
});
vi.mock('@ui5/webcomponents-icons-tnt/dist/AllIcons.js', () => {
  tntImport();
  return { __esModule: true };
});
vi.mock('@ui5/webcomponents-icons-business-suite/dist/AllIcons.js', () => {
  businessSuiteImport();
  return { __esModule: true };
});

describe('ui5-icons.ts', () => {
  it('should import all required UI5 icon packages', async () => {
    await import('@/ui5-icons');
    expect(iconsImport).toHaveBeenCalled();
    expect(tntImport).toHaveBeenCalled();
    expect(businessSuiteImport).toHaveBeenCalled();
  });
});
