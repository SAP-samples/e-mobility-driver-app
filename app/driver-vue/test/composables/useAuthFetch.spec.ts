// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useAuthFetch from '@/composables/useAuthFetch';

vi.mock('cross-fetch', () => ({
  default: vi.fn(),
}));

const crossFetch = fetch as unknown as ReturnType<typeof vi.fn>;

const mockLogin = vi.fn();
const mockClearUser = vi.fn();
vi.mock('@/store/userStore.ts', () => ({
  useUserStore: () => ({ login: mockLogin, clearUser: mockClearUser }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAuthFetch', () => {
  it('returns response for normal fetch', async () => {
    crossFetch.mockResolvedValueOnce({ status: 200, headers: { get: () => 'application/json' } });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(200);
  });

  it('throws on 401', async () => {
    crossFetch.mockResolvedValueOnce({ status: 401, headers: { get: () => 'application/json' } });
    await expect(useAuthFetch('/api/data')).rejects.toThrow('Session expired');
  });

  it('throws on 403', async () => {
    crossFetch.mockResolvedValueOnce({ status: 403, headers: { get: () => 'application/json' } });
    await expect(useAuthFetch('/api/data')).rejects.toThrow('Session expired');
  });

  it('calls login and throws on 200 with text/html', async () => {
    crossFetch.mockResolvedValueOnce({
      status: 200,
      headers: { get: (k: string) => (k === 'content-type' ? 'text/html' : null) },
    });
    await expect(useAuthFetch('/api/data')).rejects.toThrow('Session expired');
    expect(mockClearUser).toHaveBeenCalled();
  });

  it('does not throw on 200 with application/json', async () => {
    crossFetch.mockResolvedValueOnce({
      status: 200,
      headers: { get: (k: string) => (k === 'content-type' ? 'application/json' : null) },
    });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(200);
  });

  it('merges custom RequestInit', async () => {
    crossFetch.mockResolvedValueOnce({ status: 200, headers: { get: () => 'application/json' } });
    const res = await useAuthFetch('/api/data', { method: 'POST', headers: { foo: 'bar' } });
    expect(res.status).toBe(200);
    expect(crossFetch).toHaveBeenCalledWith(
      '/api/data',
      expect.objectContaining({ method: 'POST', headers: { foo: 'bar' }, credentials: 'include' }),
    );
  });

  it('handles 200 with missing content-type header', async () => {
    crossFetch.mockResolvedValueOnce({ status: 200, headers: { get: () => null } });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(200);
  });

  it('handles 200 with content-type header in different case', async () => {
    crossFetch.mockResolvedValueOnce({
      status: 200,
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/html' : null) },
    });
    await expect(useAuthFetch('/api/data')).rejects.toThrow('Session expired');
  });

  it('handles 200 with content-type and extra parameters', async () => {
    crossFetch.mockResolvedValueOnce({
      status: 200,
      headers: { get: () => 'text/html; charset=utf-8' },
    });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(200);
  });

  it('handles 204 No Content', async () => {
    crossFetch.mockResolvedValueOnce({ status: 204, headers: { get: () => null } });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(204);
  });

  it('handles 500 server error as normal response', async () => {
    crossFetch.mockResolvedValueOnce({ status: 500, headers: { get: () => 'application/json' } });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(500);
  });

  it('accepts URL object as requestInfo', async () => {
    crossFetch.mockResolvedValueOnce({ status: 200, headers: { get: () => 'application/json' } });
    const url = new URL('https://example.com/api/data');
    const res = await useAuthFetch(url);
    expect(res.status).toBe(200);
  });

  it('handles undefined RequestInit', async () => {
    crossFetch.mockResolvedValueOnce({ status: 200, headers: { get: () => 'application/json' } });
    const res = await useAuthFetch('/api/data', undefined);
    expect(res.status).toBe(200);
  });

  it('handles 200 with empty string content-type', async () => {
    crossFetch.mockResolvedValueOnce({ status: 200, headers: { get: () => '' } });
    const res = await useAuthFetch('/api/data');
    expect(res.status).toBe(200);
  });

  it('handles 200 with headers.get throwing', async () => {
    crossFetch.mockResolvedValueOnce({
      status: 200,
      headers: {
        get: () => {
          throw new Error('header error');
        },
      },
    });
    await expect(useAuthFetch('/api/data')).rejects.toThrow('header error');
  });

  it('throws if fetch throws', async () => {
    crossFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(useAuthFetch('/api/data')).rejects.toThrow('Network error');
  });
});
