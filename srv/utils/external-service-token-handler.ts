// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { LRUCache } from 'lru-cache';
import { CdsRequestWithContext } from 'types/cds-request';
import { ServiceWithUaa } from 'types/xsuaa-service';

import cds from '@sap/cds';
import { XsuaaService } from '@sap/xssec';

// Token cache with LRU eviction policy
const tokenCache = new LRUCache<string, string>({
  max: 50, // Maximum number of cached tokens
});

/**
 * Calculates the token buffer in seconds based on environment configuration
 */
function getTokenBufferSeconds(expiresIn: number): number {
  const bufferSeconds = parseInt(process.env.TOKEN_BUFFER_SECONDS || '30', 10);

  // Use absolute seconds buffer with validation, fallback to 30 if invalid
  const validBufferSeconds = isNaN(bufferSeconds) ? 30 : bufferSeconds;
  return Math.max(0, Math.min(validBufferSeconds, expiresIn - 1));
}

/**
 * Gets a cached token or fetches a new one if not available/expired
 */
export async function getOrFetchToken(uaaConfig: object, serviceName: string): Promise<string> {
  // Use serviceName directly as cache key - it's unique and simple
  let token = tokenCache.get(serviceName);
  if (token) {
    return token;
  }

  // Cache miss - fetch new token
  const authService = new XsuaaService(uaaConfig);
  const tokenResponse = await authService.fetchClientCredentialsToken();

  if (tokenResponse?.access_token && tokenResponse?.expires_in) {
    const bufferSeconds = getTokenBufferSeconds(tokenResponse.expires_in);
    const ttlMs = (tokenResponse.expires_in - bufferSeconds) * 1000;

    // Only cache if TTL is positive (token has sufficient lifetime)
    if (ttlMs > 0) {
      tokenCache.set(serviceName, tokenResponse.access_token, { ttl: ttlMs });
    }

    return tokenResponse.access_token;
  }

  throw new Error('Failed to fetch valid token from UAA service');
}

/**
 * Centralized before handler for Bearer token injection for all external services.
 * Registers itself for all services defined in cds.requires, directly on the external service proxy.
 *
 * Features:
 * - Token caching with automatic expiration based on token TTL
 * - Configurable safety buffer before token expiration (TOKEN_BUFFER_SECONDS or TOKEN_BUFFER_PERCENTAGE)
 * - LRU cache with max 50 entries to prevent memory leaks
 * - Simple service name as cache key (optimal performance)
 * - Automatic token refresh when cache expires
 * - Zero serialization overhead for cache keys
 */
export async function registerExternalServiceTokenHandler() {
  // Get all external services from cds.requires
  const requires: Record<string, { kind?: string }> = cds.env.requires || {};
  const externalServiceNames = Object.keys(requires).filter((name) =>
    ['odata', 'rest', 'cds'].includes(requires[name]?.kind || ''),
  );
  for (const serviceName of externalServiceNames) {
    const extService = (await cds.connect.to(serviceName)) as unknown as ServiceWithUaa & {
      before: (
        events: string | string[],
        handler: (req: CdsRequestWithContext) => Promise<void>,
      ) => void;
    };
    extService.before(['*'], async (req: CdsRequestWithContext) => {
      const uaa = extService.options.credentials.uaa;
      const token = await getOrFetchToken(uaa, serviceName);

      // Set authorization on req.headers (not req.context.headers).
      //
      // CAP 9.7.0 changed the JWT lookup order in remote service requests so the user's
      // IAS token from cds.context.user.authInfo.token.jwt now takes priority over
      // req.context.headers.authorization. Setting req.context.headers therefore has no
      // effect in production with IAS auth — the user JWT is forwarded instead of the
      // client-credentials token we want to inject.
      //
      // _getHeaders() in the remote service merges req.headers into requestConfig.headers,
      // and fetchClient.js merges as `{ ...destination.headers, ...requestConfig.headers }` —
      // so authorization set via req.headers always wins over the forwardAuthToken JWT.
      //
      // req.headers may be absent on programmatic / internal calls, so initialize it.
      if (!req.headers) {
        (req as { headers?: Record<string, string> }).headers = {};
      }
      req.headers['authorization'] = `Bearer ${token}`;
    });
  }
}
