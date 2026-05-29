// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import cds from '@sap/cds';

// Mock only the external dependencies, not CDS itself
const mockXsuaaService = jest.fn();
const mockFetchClientCredentialsToken = jest.fn();

jest.mock('@sap/xssec', () => ({
  XsuaaService: mockXsuaaService,
}));

// Import the module after mocking external dependencies
import {
  getOrFetchToken,
  registerExternalServiceTokenHandler,
} from '../../srv/utils/external-service-token-handler';

describe('External Service Token Handler', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockXsuaaService.mockImplementation(() => ({
      fetchClientCredentialsToken: mockFetchClientCredentialsToken,
    }));
  });

  describe('Unit Tests - getOrFetchToken', () => {
    const mockUaaConfig = { clientid: 'test-client', clientsecret: 'test-secret' };
    const serviceName = 'TestService';

    // Store original environment variables
    const originalBufferSeconds = process.env.TOKEN_BUFFER_SECONDS;

    afterEach(() => {
      // Restore original environment variables
      if (originalBufferSeconds !== undefined) {
        process.env.TOKEN_BUFFER_SECONDS = originalBufferSeconds;
      } else {
        delete process.env.TOKEN_BUFFER_SECONDS;
      }
    });

    it('should return cached token when available', async () => {
      // Setup: Mock a successful token fetch first to populate cache
      const mockToken = 'cached-token-123';
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: 3600,
      });

      // First call should fetch and cache
      const firstResult = await getOrFetchToken(mockUaaConfig, serviceName);
      expect(firstResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Second call should return cached token without fetching
      const secondResult = await getOrFetchToken(mockUaaConfig, serviceName);
      expect(secondResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should fetch new token when cache is empty', async () => {
      const mockToken = 'new-token-456';
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: 3600,
      });

      const result = await getOrFetchToken(mockUaaConfig, 'NewService');

      expect(result).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should cache token with proper TTL calculation', async () => {
      const mockToken = 'ttl-token-789';
      const expiresIn = 3600; // 1 hour
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: expiresIn,
      });

      const result = await getOrFetchToken(mockUaaConfig, 'TTLService');

      expect(result).toBe(mockToken);
      // Verify the token was cached (subsequent call should not fetch again)
      const cachedResult = await getOrFetchToken(mockUaaConfig, 'TTLService');
      expect(cachedResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should cache token even with short TTL due to buffer validation', async () => {
      const mockToken = 'short-lived-token';
      const shortExpiresIn = 20; // 20 seconds (less than default 30-second buffer)
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: shortExpiresIn,
      });

      const result = await getOrFetchToken(mockUaaConfig, 'ShortLivedService');

      expect(result).toBe(mockToken);

      // Second call should return cached token since buffer is capped at expiresIn-1 (19 seconds)
      const secondResult = await getOrFetchToken(mockUaaConfig, 'ShortLivedService');
      expect(secondResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should throw error when token fetch fails', async () => {
      mockFetchClientCredentialsToken.mockResolvedValue(null);

      await expect(getOrFetchToken(mockUaaConfig, 'FailingService')).rejects.toThrow(
        'Failed to fetch valid token from UAA service',
      );
    });

    it('should throw error when token response is invalid', async () => {
      mockFetchClientCredentialsToken.mockResolvedValue({
        // Missing access_token
        expires_in: 3600,
      });

      await expect(getOrFetchToken(mockUaaConfig, 'InvalidTokenService')).rejects.toThrow(
        'Failed to fetch valid token from UAA service',
      );
    });

    it('should throw error when expires_in is missing', async () => {
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: 'valid-token',
        // Missing expires_in
      });

      await expect(getOrFetchToken(mockUaaConfig, 'NoExpiryService')).rejects.toThrow(
        'Failed to fetch valid token from UAA service',
      );
    });

    it('should handle XsuaaService constructor errors', async () => {
      mockXsuaaService.mockImplementation(() => {
        throw new Error('Invalid UAA configuration');
      });

      await expect(getOrFetchToken(mockUaaConfig, 'ErrorService')).rejects.toThrow(
        'Invalid UAA configuration',
      );
    });

    it('should handle fetchClientCredentialsToken errors', async () => {
      mockFetchClientCredentialsToken.mockRejectedValue(new Error('Network error'));

      await expect(getOrFetchToken(mockUaaConfig, 'NetworkErrorService')).rejects.toThrow(
        'Network error',
      );
    });

    it('should use custom TOKEN_BUFFER_SECONDS when configured', async () => {
      // Set custom buffer seconds
      process.env.TOKEN_BUFFER_SECONDS = '60';

      const mockToken = 'custom-buffer-token';
      const expiresIn = 120; // 2 minutes
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: expiresIn,
      });

      const result = await getOrFetchToken(mockUaaConfig, 'CustomBufferService');
      expect(result).toBe(mockToken);

      // Token should be cached since TTL (120-60=60 seconds) is positive
      const cachedResult = await getOrFetchToken(mockUaaConfig, 'CustomBufferService');
      expect(cachedResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should cache token when buffer exceeds token lifetime due to validation', async () => {
      // Set buffer that exceeds token lifetime
      process.env.TOKEN_BUFFER_SECONDS = '200';

      const mockToken = 'excessive-buffer-token';
      const expiresIn = 100; // 100 seconds (less than 200-second buffer)
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: expiresIn,
      });

      const result = await getOrFetchToken(mockUaaConfig, 'ExcessiveBufferService');
      expect(result).toBe(mockToken);

      // Second call should return cached token since buffer is capped at expiresIn-1 (99 seconds)
      const secondResult = await getOrFetchToken(mockUaaConfig, 'ExcessiveBufferService');
      expect(secondResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid environment variable values gracefully', async () => {
      // Set invalid value
      process.env.TOKEN_BUFFER_SECONDS = 'invalid';

      const mockToken = 'invalid-config-token';
      const expiresIn = 3600;
      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: expiresIn,
      });

      // Should fall back to default 30-second buffer when invalid values are provided
      const result = await getOrFetchToken(mockUaaConfig, 'InvalidConfigService');
      expect(result).toBe(mockToken);

      // Token should be cached since buffer falls back to 30 seconds (TTL = 3600-30 = 3570 seconds)
      const cachedResult = await getOrFetchToken(mockUaaConfig, 'InvalidConfigService');
      expect(cachedResult).toBe(mockToken);
      expect(mockFetchClientCredentialsToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests - Real CDS Environment', () => {
    let originalRequires: typeof cds.env.requires;

    beforeAll(() => {
      // Store original requires configuration
      originalRequires = cds.env.requires;
    });

    afterAll(() => {
      // Restore original requires configuration
      cds.env.requires = originalRequires;
    });

    beforeEach(() => {
      // Set up test configuration for external services
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds.env as any).requires = {
        ChargingStationService: { kind: 'odata' },
        RemoteBadgeService: { kind: 'rest' },
        SomeOtherService: { kind: 'cds' },
        DatabaseService: { kind: 'sqlite' }, // Should be filtered out
      };
    });

    it('should filter and register only external services', async () => {
      // Mock cds.connect.to to track which services are processed
      const originalConnect = cds.connect.to;
      const mockConnect = jest.fn().mockResolvedValue({
        options: {
          credentials: {
            uaa: { clientid: 'test-client', clientsecret: 'test-secret' },
          },
        },
        before: jest.fn(),
      });
      cds.connect.to = mockConnect;

      try {
        await registerExternalServiceTokenHandler();

        // Verify that external services are processed
        expect(mockConnect).toHaveBeenCalledWith('ChargingStationService');
        expect(mockConnect).toHaveBeenCalledWith('RemoteBadgeService');
        expect(mockConnect).toHaveBeenCalledWith('SomeOtherService');

        // Verify that non-external services are not processed
        expect(mockConnect).not.toHaveBeenCalledWith('DatabaseService');
      } finally {
        // Restore original connect function
        cds.connect.to = originalConnect;
      }
    });

    it('should register before handlers for all external services', async () => {
      const mockService = {
        options: {
          credentials: {
            uaa: { clientid: 'test-client', clientsecret: 'test-secret' },
          },
        },
        before: jest.fn(),
      };

      // Mock cds.connect.to to return our mock service
      const originalConnect = cds.connect.to;
      cds.connect.to = jest.fn().mockResolvedValue(mockService);

      try {
        await registerExternalServiceTokenHandler();

        // Each service should have a before handler registered
        expect(mockService.before).toHaveBeenCalledTimes(3);
        expect(mockService.before).toHaveBeenCalledWith(['*'], expect.any(Function));
      } finally {
        // Restore original connect function
        cds.connect.to = originalConnect;
      }
    });

    it('should inject token into req.headers (overrides forwardAuthToken in CAP 9.7+)', async () => {
      // Regression guard for CAP 9.7.0 change:
      //   "Remote services: Prefer cds.context.user?.authInfo?.token?.jwt over JWT in HTTP
      //    header of incoming request"
      //
      // This makes the user's IAS JWT take priority over req.context.headers.authorization,
      // silently overriding any client-credentials token we set there. The fix is to set
      // authorization on req.headers, which CAP merges into requestConfig.headers and
      // ultimately wins over destination.headers in fetchClient.js (`{ ...destination,
      // ...requestConfig }`). If a future change moves the assignment back to
      // req.context.headers, this test fails.
      const mockToken = 'bearer-token-123';
      const mockService = {
        options: {
          credentials: {
            uaa: { clientid: 'test-client', clientsecret: 'test-secret' },
          },
        },
        before: jest.fn(),
      };

      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: 3600,
      });

      // Mock cds.connect.to to return our mock service
      const originalConnect = cds.connect.to;
      cds.connect.to = jest.fn().mockResolvedValue(mockService);

      try {
        await registerExternalServiceTokenHandler();

        // Get the registered handler function
        const beforeHandler = mockService.before.mock.calls[0][1];

        // Create mock request with req.headers — this is what CAP's _getHeaders() reads
        // and merges into requestConfig.headers for the outgoing HTTP request.
        const mockRequest = {
          headers: {} as Record<string, string>,
        };

        // Execute the handler
        await beforeHandler(mockRequest);

        // Token must land on req.headers (not req.context.headers) to actually reach the wire
        expect(mockRequest.headers['authorization']).toBe(`Bearer ${mockToken}`);
      } finally {
        // Restore original connect function
        cds.connect.to = originalConnect;
      }
    });

    it('should initialize req.headers when absent (programmatic / internal calls)', async () => {
      // CdsRequestWithContext does not declare a top-level `headers` property, and CAP may
      // pass requests without one (e.g. programmatic service.run() calls). The handler must
      // create the object before assigning, otherwise it crashes with TypeError.
      const uniqueServiceName = 'NoHeadersTestService';
      const mockToken = 'no-headers-token';
      const mockService = {
        options: {
          credentials: {
            uaa: { clientid: 'test-client', clientsecret: 'test-secret' },
          },
        },
        before: jest.fn(),
      };

      const originalRequires = cds.env.requires;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds.env as any).requires = {
        [uniqueServiceName]: { kind: 'odata' },
      };

      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: 3600,
      });

      const originalConnect = cds.connect.to;
      cds.connect.to = jest.fn().mockResolvedValue(mockService);

      try {
        await registerExternalServiceTokenHandler();
        const beforeHandler = mockService.before.mock.calls[0][1];

        // Request with neither headers nor context — represents an internal/programmatic call
        const mockRequest = {} as { headers?: Record<string, string> };

        await expect(beforeHandler(mockRequest)).resolves.not.toThrow();

        expect(mockRequest.headers).toBeDefined();
        expect(mockRequest.headers!.authorization).toBe(`Bearer ${mockToken}`);
      } finally {
        cds.connect.to = originalConnect;
        cds.env.requires = originalRequires;
      }
    });

    it('should overwrite a pre-existing req.headers.authorization (forwardAuthToken JWT)', async () => {
      // Simulates a request where CAP has already populated req.headers.authorization with
      // the forwarded user JWT (forwardAuthToken: true). Our handler must overwrite it with
      // the client-credentials token so the external service receives the correct identity.
      const uniqueServiceName = 'OverwriteHeaderTestService';
      const mockToken = 'client-creds-token-xyz';
      const mockService = {
        options: {
          credentials: {
            uaa: { clientid: 'test-client', clientsecret: 'test-secret' },
          },
        },
        before: jest.fn(),
      };

      // Override cds.env.requires to use a unique service name so the LRU token cache
      // doesn't return a token from a prior test
      const originalRequires = cds.env.requires;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds.env as any).requires = {
        [uniqueServiceName]: { kind: 'odata' },
      };

      mockFetchClientCredentialsToken.mockResolvedValue({
        access_token: mockToken,
        expires_in: 3600,
      });

      const originalConnect = cds.connect.to;
      cds.connect.to = jest.fn().mockResolvedValue(mockService);

      try {
        await registerExternalServiceTokenHandler();
        const beforeHandler = mockService.before.mock.calls[0][1];

        const mockRequest = {
          headers: {
            authorization: 'Bearer user-ias-jwt-from-incoming-request',
          } as Record<string, string>,
        };

        await beforeHandler(mockRequest);

        expect(mockRequest.headers['authorization']).toBe(`Bearer ${mockToken}`);
      } finally {
        cds.connect.to = originalConnect;
        cds.env.requires = originalRequires;
      }
    });

    it('should handle errors during token fetching', async () => {
      // Create a fresh mock service for this test with a unique service name
      const uniqueServiceName = 'ErrorTestService';
      const mockService = {
        options: {
          credentials: {
            uaa: { clientid: 'test-client', clientsecret: 'test-secret' },
          },
        },
        before: jest.fn(),
      };

      // Override cds.env.requires to use our unique service name
      const originalRequires = cds.env.requires;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds.env as any).requires = {
        [uniqueServiceName]: { kind: 'odata' },
      };

      // Mock cds.connect.to to return our mock service
      const originalConnect = cds.connect.to;
      cds.connect.to = jest.fn().mockResolvedValue(mockService);

      try {
        // Set up the mock to reject BEFORE registering the handler
        mockFetchClientCredentialsToken.mockRejectedValue(new Error('Token fetch failed'));

        await registerExternalServiceTokenHandler();

        const beforeHandler = mockService.before.mock.calls[0][1];

        const mockRequest = {
          headers: {} as Record<string, string>,
        };

        // Test that error handling code path is covered - error should propagate
        await expect(beforeHandler(mockRequest)).rejects.toThrow('Token fetch failed');
      } finally {
        // Restore original connect function and requires
        cds.connect.to = originalConnect;
        cds.env.requires = originalRequires;
      }
    });

    it('should handle empty cds.env.requires', async () => {
      // Temporarily override the requires
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cds.env as any).requires = {};

      // Mock cds.connect.to to track calls
      const originalConnect = cds.connect.to;
      const mockConnect = jest.fn();
      cds.connect.to = mockConnect;

      try {
        await registerExternalServiceTokenHandler();

        // Should not call connect.to for any services
        expect(mockConnect).not.toHaveBeenCalled();
      } finally {
        // Restore original connect function
        cds.connect.to = originalConnect;
      }
    });

    it('should handle null cds.env.requires', async () => {
      // Temporarily override the requires - explicit test manipulation
      const originalRequires = cds.env.requires;
      (cds.env as { requires: typeof cds.env.requires | null }).requires = null;

      // Mock cds.connect.to to track calls
      const originalConnect = cds.connect.to;
      const mockConnect = jest.fn();
      cds.connect.to = mockConnect;

      try {
        await registerExternalServiceTokenHandler();

        // Should not call connect.to for any services
        expect(mockConnect).not.toHaveBeenCalled();
      } finally {
        // Restore original connect function and requires
        cds.connect.to = originalConnect;
        cds.env.requires = originalRequires;
      }
    });
  });

  describe('Business Logic Tests', () => {
    it('should correctly identify external service types', () => {
      const mockRequires: Record<string, { kind?: string }> = {
        ChargingStationService: { kind: 'odata' },
        RemoteBadgeService: { kind: 'rest' },
        SomeOtherService: { kind: 'cds' },
        DatabaseService: { kind: 'sqlite' },
        FileService: { kind: 'file' },
        ServiceWithoutKind: {},
      };

      const externalServiceNames = Object.keys(mockRequires).filter((name) =>
        ['odata', 'rest', 'cds'].includes(mockRequires[name]?.kind || ''),
      );

      expect(externalServiceNames).toHaveLength(3);
      expect(externalServiceNames).toContain('ChargingStationService');
      expect(externalServiceNames).toContain('RemoteBadgeService');
      expect(externalServiceNames).toContain('SomeOtherService');
      expect(externalServiceNames).not.toContain('DatabaseService');
      expect(externalServiceNames).not.toContain('FileService');
      expect(externalServiceNames).not.toContain('ServiceWithoutKind');
    });
  });
});
