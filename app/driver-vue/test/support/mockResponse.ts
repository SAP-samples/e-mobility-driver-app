// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

export function createMockResponse({
  ok = true,
  jsonData = {},
  status = 200,
  statusText = 'OK',
  headers = {},
  jsonThrows = false,
}: {
  ok?: boolean;
  jsonData?: unknown;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  jsonThrows?: boolean;
} = {}) {
  return {
    ok,
    status,
    statusText,
    headers: {
      get: (key: string) => headers[key] || null,
    },
    redirected: false,
    type: 'basic',
    url: '',
    body: null,
    bodyUsed: false,
    clone() {
      return this;
    },
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => '',
    json: async () => {
      if (jsonThrows) throw new Error('json() error');
      return jsonData;
    },
  } as Response;
}
