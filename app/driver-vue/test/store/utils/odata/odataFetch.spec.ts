// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { createMockResponse } from '@test/support/mockResponse';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useAuthFetch from '@/composables/useAuthFetch';
import { odataFetch } from '@/utils/odata/odataFetch';

vi.mock('@/composables/useAuthFetch', () => ({
  default: vi.fn(),
}));
const mockUseAuthFetch = vi.mocked(useAuthFetch);

describe('odataFetch helper', () => {
  beforeEach(() => {
    mockUseAuthFetch.mockReset();
  });

  it('fetches data with minimal options', async () => {
    const mockResult = { value: [{ id: 1, name: 'A' }], '@odata.count': 1 };
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonData: mockResult }));
    const result = await odataFetch({ baseUrl: '/odata/', entity: 'Test' });
    expect(result).toEqual(mockResult);
    expect(mockUseAuthFetch).toHaveBeenCalledWith('/odata/Test', expect.anything());
  });

  it('fetches data with id, expand, filter, top, skip, and extraParams', async () => {
    const mockResult = { value: [{ id: 2 }], '@odata.count': 1 };
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonData: mockResult }));
    await odataFetch({
      baseUrl: '/odata/',
      entity: 'Entity',
      id: '42',
      expand: ['rel'],
      filter: { foo: 'bar' },
      top: 5,
      skip: 2,
      extraParams: { custom: 'x' },
    });
    const url = mockUseAuthFetch.mock.calls[0][0];
    expect(url).toContain('Entity(42)');
    expect(url).toContain('expand');
    expect(url).toContain('filter');
    expect(url).toContain('top=5');
    expect(url).toContain('skip=2');
    expect(url).toContain('custom=x');
  });

  it('throws if response.ok is false', async () => {
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: false, statusText: 'fail' }));
    await expect(odataFetch({ baseUrl: '/odata/', entity: 'Fail' })).rejects.toThrow(
      'OData fetch failed: fail',
    );
  });

  it('throws if useAuthFetch throws', async () => {
    mockUseAuthFetch.mockRejectedValue(new Error('network'));
    await expect(odataFetch({ baseUrl: '/odata/', entity: 'X' })).rejects.toThrow('network');
  });

  it('returns parsed JSON if response.ok', async () => {
    const mockResult = { value: [{ id: 3 }] };
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonData: mockResult }));
    const result = await odataFetch({ baseUrl: '/odata/', entity: 'Y' });
    expect(result).toEqual(mockResult);
  });

  it('handles malformed response (json throws)', async () => {
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonThrows: true }));
    await expect(odataFetch({ baseUrl: '/odata/', entity: 'Z' })).rejects.toThrow('json() error');
  });

  it('handles empty result', async () => {
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonData: {} }));
    const result = await odataFetch({ baseUrl: '/odata/', entity: 'Empty' });
    expect(result).toEqual({});
  });

  it('builds correct query string for all options', async () => {
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonData: { value: [] } }));
    await odataFetch({
      baseUrl: '/odata/',
      entity: 'E',
      expand: ['a', 'b'],
      filter: { foo: { eq: 1 } },
      top: 10,
      skip: 5,
      extraParams: { x: 1, y: 'z' },
    });
    const url = mockUseAuthFetch.mock.calls[0][0];
    expect(url).toContain('expand');
    expect(url).toContain('filter');
    expect(url).toContain('top=10');
    expect(url).toContain('skip=5');
    expect(url).toContain('x=1');
    expect(url).toContain('y=z');
  });

  it('includes orderBy parameter in query string', async () => {
    mockUseAuthFetch.mockResolvedValue(createMockResponse({ ok: true, jsonData: { value: [] } }));
    await odataFetch({
      baseUrl: '/odata/',
      entity: 'SortedEntity',
      orderBy: 'name desc',
    });
    const url = mockUseAuthFetch.mock.calls[0][0];
    expect(url).toContain('$orderby=name');
    expect(url).toContain('desc');
  });
});
