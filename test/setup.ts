// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

// Set environment variable for CDS test environment check
process.env.CDS_TEST_ENV_CHECK = 'true';

// Increase timeout for integration tests
jest.setTimeout(30000);
