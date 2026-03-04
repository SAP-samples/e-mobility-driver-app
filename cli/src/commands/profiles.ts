// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';

import fs from 'fs-extra';

import { BaseCommand } from '../framework/command-registry';
import { Logger } from '../utils/logger';

/**
 * Find the project root directory
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();

  if (currentDir.endsWith('/cli')) {
    currentDir = path.dirname(currentDir);
  }

  const packageJsonPath = path.join(currentDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    return currentDir;
  }

  throw new Error('Could not find project root (package.json not found)');
}

/**
 * List available profiles
 */
async function listProfiles(): Promise<void> {
  try {
    const projectRoot = findProjectRoot();
    const privateConfigPath = path.join(projectRoot, '.cdsrc-private.json');

    if (!fs.existsSync(privateConfigPath)) {
      Logger.info('📋 No profiles found - run "config" command to create profiles');
      return;
    }

    const config = fs.readJsonSync(privateConfigPath);
    const profiles: string[] = [];

    if (config?.requires) {
      Object.keys(config.requires).forEach((key) => {
        if (key.startsWith('[') && key.endsWith(']')) {
          profiles.push(key.slice(1, -1)); // Remove brackets
        }
      });
    }

    if (profiles.length === 0) {
      Logger.info('📋 No profiles found - run "config" command to create profiles');
    } else {
      Logger.info('📋 Available profiles:');
      profiles.forEach((profile) => {
        Logger.highlight(`  • ${profile}`);
      });
    }
  } catch (error) {
    Logger.error('❌ Failed to list profiles:', error);
  }
}

/**
 * List command - show available profiles
 */
export const listCommand: BaseCommand = {
  name: 'profiles',
  description: 'List available development profiles',
  action: listProfiles,
};
