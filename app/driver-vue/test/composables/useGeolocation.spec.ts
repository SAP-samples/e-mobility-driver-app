// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGeolocation } from '@/composables/useGeolocation';

// Mock geolocation
const mockGetCurrentPosition = vi.fn();
const mockClearWatch = vi.fn();
const mockWatchPosition = vi.fn();

// Store original navigator to restore after tests
const originalNavigator = global.navigator;

// Types for geolocation mocking
interface MockGeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface MockGeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup geolocation mock
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
        clearWatch: mockClearWatch,
        watchPosition: mockWatchPosition,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const { geoLoading, geoError } = useGeolocation();

      expect(geoLoading.value).toBe(false);
      expect(geoError.value).toBeNull();
    });

    it('should return readonly reactive values', () => {
      const { geoLoading, geoError } = useGeolocation();

      // These should be readonly refs
      expect(geoLoading).toBeDefined();
      expect(geoError).toBeDefined();
    });

    it('should provide getCurrentLocation function', () => {
      const { getCurrentLocation } = useGeolocation();

      expect(typeof getCurrentLocation).toBe('function');
    });
  });

  describe('Successful Geolocation', () => {
    it('should successfully get current location', async () => {
      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGetCurrentPosition.mockImplementation((success) => {
        // Use setTimeout to make it async
        setTimeout(() => success(mockPosition), 0);
      });

      const { getCurrentLocation, geoLoading, geoError } = useGeolocation();

      const locationPromise = getCurrentLocation();

      // Should set loading to true immediately
      expect(geoLoading.value).toBe(true);
      expect(geoError.value).toBeNull();

      const result = await locationPromise;

      // Should return correct location data
      expect(result).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 50000,
      });

      // Should reset loading state
      expect(geoLoading.value).toBe(false);
      expect(geoError.value).toBeNull();
    });

    it('should call geolocation with correct options', async () => {
      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 45.764,
          longitude: 4.8357,
          accuracy: 15,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { getCurrentLocation } = useGeolocation();

      await getCurrentLocation();

      expect(mockGetCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    });

    it('should handle multiple successful calls', async () => {
      const positions = [
        {
          coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 10 },
          timestamp: Date.now(),
        },
        {
          coords: { latitude: 45.764, longitude: 4.8357, accuracy: 12 },
          timestamp: Date.now(),
        },
      ];

      let callCount = 0;
      mockGetCurrentPosition.mockImplementation((success) => {
        success(positions[callCount++]);
      });

      const { getCurrentLocation } = useGeolocation();

      const result1 = await getCurrentLocation();
      const result2 = await getCurrentLocation();

      expect(result1).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 50000,
      });

      expect(result2).toEqual({
        lat: 45.764,
        lon: 4.8357,
        radius: 50000,
      });
    });
  });

  describe('Geolocation Errors', () => {
    it('should handle geolocation not supported', async () => {
      // Mock navigator without geolocation
      vi.stubGlobal('navigator', {
        ...originalNavigator,
        geolocation: undefined,
      });

      const { getCurrentLocation, geoError } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation not supported');
      expect(geoError.value).toBe('Geolocation not supported');
    });

    it('should handle permission denied error', async () => {
      const mockError: MockGeolocationError = {
        code: 1,
        message: 'User denied the request for Geolocation.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGetCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback(mockError);
      });

      const { getCurrentLocation, geoLoading, geoError } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow(
        'Geolocation error: User denied the request for Geolocation.',
      );

      expect(geoLoading.value).toBe(false);
      expect(geoError.value).toBe('Geolocation error: User denied the request for Geolocation.');
    });

    it('should handle position unavailable error', async () => {
      const mockError: MockGeolocationError = {
        code: 2,
        message: 'Position unavailable.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGetCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback(mockError);
      });

      const { getCurrentLocation, geoError } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow(
        'Geolocation error: Position unavailable.',
      );
      expect(geoError.value).toBe('Geolocation error: Position unavailable.');
    });

    it('should handle timeout error', async () => {
      const mockError: MockGeolocationError = {
        code: 3,
        message: 'Timeout expired.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGetCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback(mockError);
      });

      const { getCurrentLocation, geoError } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation error: Timeout expired.');
      expect(geoError.value).toBe('Geolocation error: Timeout expired.');
    });

    it('should reset error state on successful call after error', async () => {
      const mockError: MockGeolocationError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      let shouldError = true;
      mockGetCurrentPosition.mockImplementation((success, errorCallback) => {
        if (shouldError) {
          errorCallback(mockError);
        } else {
          success(mockPosition);
        }
      });

      const { getCurrentLocation, geoError } = useGeolocation();

      // First call should error
      await expect(getCurrentLocation()).rejects.toThrow();
      expect(geoError.value).toBe('Geolocation error: Permission denied');

      // Second call should succeed and clear error
      shouldError = false;
      const result = await getCurrentLocation();

      expect(result).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 50000,
      });
      expect(geoError.value).toBeNull();
    });
  });

  describe('Loading State Management', () => {
    it('should set loading state during geolocation request', async () => {
      let resolveGeolocation: ((position: MockGeolocationPosition) => void) | undefined;
      const geolocationPromise = new Promise<MockGeolocationPosition>((resolve) => {
        resolveGeolocation = resolve;
      });

      mockGetCurrentPosition.mockImplementation((success) => {
        geolocationPromise.then(success);
      });

      const { getCurrentLocation, geoLoading } = useGeolocation();

      const locationPromise = getCurrentLocation();

      // Should be loading
      expect(geoLoading.value).toBe(true);

      // Resolve geolocation
      resolveGeolocation!({
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      await locationPromise;

      // Should not be loading anymore
      expect(geoLoading.value).toBe(false);
    });

    it('should reset loading state on error', async () => {
      const mockError: MockGeolocationError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGetCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback(mockError);
      });

      const { getCurrentLocation, geoLoading } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow();

      expect(geoLoading.value).toBe(false);
    });
  });

  describe('Concurrent Requests', () => {
    it('should prevent multiple simultaneous requests', async () => {
      let resolveGeolocation: ((position: MockGeolocationPosition) => void) | undefined;
      const geolocationPromise = new Promise<MockGeolocationPosition>((resolve) => {
        resolveGeolocation = resolve;
      });

      mockGetCurrentPosition.mockImplementation((success) => {
        geolocationPromise.then(success);
      });

      const { getCurrentLocation } = useGeolocation();

      const promise1 = getCurrentLocation();
      const promise2 = getCurrentLocation();

      // Second request should be rejected immediately
      await expect(promise2).rejects.toThrow('Geolocation request already in progress');

      // First request should still be pending
      expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);

      // Resolve first request
      resolveGeolocation!({
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const result = await promise1;
      expect(result).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 50000,
      });
    });

    it('should allow new request after previous one completes', async () => {
      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { getCurrentLocation } = useGeolocation();

      // First request
      await getCurrentLocation();

      // Second request should be allowed
      const result = await getCurrentLocation();

      expect(result).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 50000,
      });
      expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
    });

    it('should allow new request after previous one errors', async () => {
      const mockError: MockGeolocationError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      let shouldError = true;
      mockGetCurrentPosition.mockImplementation((success, errorCallback) => {
        if (shouldError) {
          errorCallback(mockError);
        } else {
          success(mockPosition);
        }
      });

      const { getCurrentLocation } = useGeolocation();

      // First request should error
      await expect(getCurrentLocation()).rejects.toThrow();

      // Second request should be allowed and succeed
      shouldError = false;
      const result = await getCurrentLocation();

      expect(result).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        radius: 50000,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing navigator object', async () => {
      vi.stubGlobal('navigator', undefined);

      const { getCurrentLocation, geoError } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation not supported');
      expect(geoError.value).toBe('Geolocation not supported');
    });

    it('should handle navigator without geolocation property', async () => {
      vi.stubGlobal('navigator', {
        userAgent: 'test',
      });

      const { getCurrentLocation, geoError } = useGeolocation();

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation not supported');
      expect(geoError.value).toBe('Geolocation not supported');
    });

    it('should use default radius value', async () => {
      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { getCurrentLocation } = useGeolocation();

      const result = await getCurrentLocation();

      expect(result.radius).toBe(50000); // Default radius
    });

    it('should handle very precise coordinates', async () => {
      const mockPosition: MockGeolocationPosition = {
        coords: {
          latitude: 48.8566123456789,
          longitude: 2.3522123456789,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { getCurrentLocation } = useGeolocation();

      const result = await getCurrentLocation();

      expect(result.lat).toBe(48.8566123456789);
      expect(result.lon).toBe(2.3522123456789);
    });
  });

  describe('Composable Isolation', () => {
    it('should create independent instances', () => {
      const instance1 = useGeolocation();
      const instance2 = useGeolocation();

      // Each instance should have its own state
      expect(instance1.geoLoading).not.toBe(instance2.geoLoading);
      expect(instance1.geoError).not.toBe(instance2.geoError);
      expect(instance1.getCurrentLocation).not.toBe(instance2.getCurrentLocation);
    });

    it('should not share state between instances', async () => {
      const mockError: MockGeolocationError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGetCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback(mockError);
      });

      const instance1 = useGeolocation();
      const instance2 = useGeolocation();

      // Error in instance1 should not affect instance2
      await expect(instance1.getCurrentLocation()).rejects.toThrow();

      expect(instance1.geoError.value).toBe('Geolocation error: Permission denied');
      expect(instance2.geoError.value).toBeNull();
    });
  });
});
