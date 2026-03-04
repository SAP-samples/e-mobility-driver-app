// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

import { useUserStore } from '@/store/userStore.ts';

export default async function useAuthFetch(
  requestInfo: RequestInfo | URL,
  requestInit?: RequestInit,
): Promise<Response> {
  const defaultRequestInit: RequestInit = { credentials: 'include' };
  const response = await fetch(requestInfo, { ...defaultRequestInit, ...requestInit });
  if (await isSessionExpired(response)) {
    throw new Error('Session expired, please log in again.');
  }
  return response;
}

async function isSessionExpired(response: Response): Promise<boolean> {
  const userStore = useUserStore();
  switch (response.status) {
    case 401:
    case 403:
      return true;
    case 200:
      if (response.headers.get('content-type') === 'text/html') {
        userStore.clearUser();
        return true;
      }
  }
  return false;
}
