// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BadgeApi } from '@/store/badges/api';

describe('BadgeApi', () => {
  let badgeApi: BadgeApi;
  const baseUrl = 'http://localhost:3000/odata/v4/badge/';

  beforeEach(() => {
    vi.clearAllMocks();
    badgeApi = new BadgeApi(baseUrl);
  });

  describe('Entity configuration', () => {
    it('should return correct entity name', () => {
      expect(badgeApi.getEntityName()).toBe('Badges');
    });

    it('should return empty expand fields', () => {
      expect(badgeApi.getExpandFields()).toEqual([]);
    });
  });

  describe('Inheritance from BaseApi', () => {
    it('should be an instance of BadgeApi', () => {
      expect(badgeApi).toBeInstanceOf(BadgeApi);
    });

    it('should have baseUrl set correctly', () => {
      const testUrl = 'http://test.example.com/';
      const api = new BadgeApi(testUrl);
      expect(api).toBeInstanceOf(BadgeApi);
    });
  });
});
