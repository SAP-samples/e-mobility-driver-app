// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvseApi } from '@/store/evse/api';
import { EvseQuery } from '@/store/evse/query-builder';
import type { Evse } from '@/store/evse/types';
import { odataFetch } from '@/utils/odata/odataFetch';

// Mock odataFetch (same pattern as SessionApi)
vi.mock('@/utils/odata/odataFetch', () => ({
  odataFetch: vi.fn(),
}));

// Type the mocked function
const mockOdataFetch = vi.mocked(odataFetch);

const mockEvse: Evse = {
  id: '12345',
  emi3Id: 'EMI3_001',
  index: 1,
  code: 'EVSE_001',
  name: 'Test EVSE',
  parking: 'P1',
  parkingLevel: 'Level 0',
  parkingSpace: 'A01',
  chargingStationId: 'CS_001',
  chargingStationName: 'Test Charging Station',
  connectors: [
    {
      connectorId: 1,
      type: 'Type2',
      currentType: 'AC',
      voltage: 400,
      numberOfPhases: 3,
      evseIndex: 1,
      current: 32,
      currentLimit: 32,
      status: 'Available',
      maximumPower: 22,
    },
  ],
  location: {
    parkingLevel: 'Level 0',
    parkingName: 'Main Parking',
    parkingSpace: 'A01',
    companyId: 'COMP_001',
    siteId: 'SITE_001',
    siteName: 'Downtown Station',
    siteAreaId: 'AREA_001',
    siteAreaName: 'Area A',
    address: {
      number: '123',
      street: 'Test Street',
      postalCode: '10115',
      city: 'Berlin',
      countryCode: 'DE',
      country: 'Germany',
      state: 'Berlin',
    },
    coordinates: {
      latitude: '52.520008',
      longitude: '13.404954',
    },
  },
};

describe('EvseApi', () => {
  let api: EvseApi;
  const baseUrl = 'http://localhost:3000/odata/v4/charge-point/';

  beforeEach(() => {
    api = new EvseApi(baseUrl);
    vi.clearAllMocks();
  });

  describe('Entity configuration', () => {
    it('should return correct entity name', () => {
      expect(api.getEntityName()).toBe('ChargePoints');
    });

    it('should return correct expand fields', () => {
      expect(api.getExpandFields()).toEqual([
        'location($expand=coordinates,address)',
        'connectors',
        'chargingStation($select=id,lastSeenAt,disabled,registrationStatus,siteName,siteAreaName)',
      ]);
    });
  });

  describe('fetch', () => {
    it('should fetch EVSEs with query', async () => {
      const mockResponse = {
        value: [mockEvse],
        '@odata.count': 1,
      };

      mockOdataFetch.mockResolvedValueOnce(mockResponse);

      const query = new EvseQuery();
      query.page(1, 10);

      const result = await api.fetch(query);

      expect(result.data).toEqual([mockEvse]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(mockOdataFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl,
          entity: 'ChargePoints',
          top: 10,
          skip: 0,
        }),
      );
    });

    it('should handle fetch errors', async () => {
      mockOdataFetch.mockRejectedValueOnce(new Error('Network error'));

      const query = new EvseQuery();

      await expect(api.fetch(query)).rejects.toThrow('Network error');
    });
  });

  describe('fetchById', () => {
    it('should fetch EVSE by ID', async () => {
      // When fetching by ID, OData returns the entity directly (not wrapped in { value: [...] })
      mockOdataFetch.mockResolvedValueOnce(mockEvse as never);

      const result = await api.fetchById('12345');

      expect(result).toEqual(mockEvse);
      expect(mockOdataFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl,
          entity: 'ChargePoints',
          id: '12345',
        }),
      );
    });

    it('should return null when EVSE not found', async () => {
      mockOdataFetch.mockRejectedValueOnce(new Error('Not Found'));

      const result = await api.fetchById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should find EVSE by code successfully', async () => {
      const mockResponse = {
        value: [mockEvse],
      };

      mockOdataFetch.mockResolvedValueOnce(mockResponse);

      const result = await api.findByCode('EVSE_001');

      expect(result).toEqual(mockEvse);
      expect(mockOdataFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl,
          entity: 'ChargePoints',
          top: 1,
          skip: 0,
        }),
      );
    });

    it('should return null when code not found', async () => {
      const mockResponse = {
        value: [],
      };

      mockOdataFetch.mockResolvedValueOnce(mockResponse);

      const result = await api.findByCode('UNKNOWN');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockOdataFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.findByCode('EVSE_001');

      expect(result).toBeNull();
    });

    it('should handle empty response gracefully', async () => {
      mockOdataFetch.mockResolvedValueOnce({ value: [] });

      const result = await api.findByCode('EVSE_001');

      expect(result).toBeNull();
    });
  });

  describe('findByChargingStationId', () => {
    it('should find EVSE by charging station ID successfully', async () => {
      const mockResponse = {
        value: [mockEvse],
      };

      mockOdataFetch.mockResolvedValueOnce(mockResponse);

      const result = await api.findByChargingStationId('CS_001');

      expect(result).toEqual(mockEvse);
      expect(mockOdataFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl,
          entity: 'ChargePoints',
          top: 1,
          skip: 0,
        }),
      );
    });

    it('should return null when charging station not found', async () => {
      const mockResponse = {
        value: [],
      };

      mockOdataFetch.mockResolvedValueOnce(mockResponse);

      const result = await api.findByChargingStationId('UNKNOWN');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockOdataFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.findByChargingStationId('CS_001');

      expect(result).toBeNull();
    });

    it('should handle empty response gracefully', async () => {
      mockOdataFetch.mockResolvedValueOnce({ value: [] });

      const result = await api.findByChargingStationId('CS_001');

      expect(result).toBeNull();
    });
  });
});
