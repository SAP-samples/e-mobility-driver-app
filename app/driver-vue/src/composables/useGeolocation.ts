// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { readonly, ref } from 'vue';

// Types
interface LocationData {
  lat: number;
  lon: number;
  radius: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

export function useGeolocation() {
  const geoLoading = ref(false);
  const geoError = ref<string | null>(null);

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!window.navigator?.geolocation) {
        const error = 'Geolocation not supported';
        geoError.value = error;
        reject(new Error(error));
        return;
      }

      if (geoLoading.value) {
        reject(new Error('Geolocation request already in progress'));
        return;
      }

      geoLoading.value = true;
      geoError.value = null;

      window.navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locationData: LocationData = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            radius: 50000, // Default radius in meters
          };
          geoLoading.value = false;
          resolve(locationData);
        },
        (error: GeolocationError) => {
          const errorMessage = `Geolocation error: ${error.message}`;
          geoError.value = errorMessage;
          geoLoading.value = false;
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    });
  };

  return {
    geoLoading: readonly(geoLoading),
    geoError: readonly(geoError),
    getCurrentLocation,
  };
}
