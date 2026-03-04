// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['srv/**/*.{ts,js}', '!srv/**/*.d.ts', '!srv/**/*.test.{ts,js}'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'junit-report.xml',
      },
    ],
  ],
  testTimeout: 30000, // 30 seconds for integration tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  // Ignore node_modules except for ES modules that need transformation
  transformIgnorePatterns: ['node_modules/(?!(@sap|@cap-js)/)'],
};
