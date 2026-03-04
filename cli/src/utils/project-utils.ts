// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';

import fs from 'fs-extra';

/**
 * Find the project root directory (main project, not CLI package)
 */
export function findProjectRoot(): string {
  let currentDir = process.cwd();

  // If we're in the CLI directory, go up one level to find the main project
  if (path.basename(currentDir) === 'cli') {
    currentDir = path.dirname(currentDir);
  }

  // Look for main project indicators (package.json with driver-app name or cli subdirectory)
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const cliDirPath = path.join(currentDir, 'cli');
    const appDirPath = path.join(currentDir, 'app');

    if (fs.existsSync(packageJsonPath) && fs.existsSync(cliDirPath) && fs.existsSync(appDirPath)) {
      // This looks like the main project with both cli and app directories
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.name === 'driver-app') {
          return currentDir;
        }
      } catch {
        // If we can't read package.json, continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find project root (main driver-app project not found)');
}

/**
 * Get the path to the project's private configuration file (.cdsrc-private.json)
 * This file is always located at the project root, not in the CLI subdirectory
 */
export function getProjectPrivateConfigPath(): string {
  const projectRoot = findProjectRoot();
  return path.join(projectRoot, '.cdsrc-private.json');
}

/**
 * Get the path to the project's main configuration file (.cdsrc.json)
 */
export function getProjectConfigPath(): string {
  const projectRoot = findProjectRoot();
  return path.join(projectRoot, '.cdsrc.json');
}
