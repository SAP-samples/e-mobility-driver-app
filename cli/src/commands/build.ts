// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import path from 'path';

import fs from 'fs-extra';

import { BaseCommand } from '../framework/command-registry';
import { Logger } from '../utils/logger';

/**
 * Find the project root directory (main project, not CLI package)
 */
function findProjectRoot(): string {
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
 * Check if MBT CLI is available
 */
function checkMbtCli(): void {
  Logger.info('🔍 Checking MBT CLI...');

  try {
    execSync('mbt --version', { encoding: 'utf8', stdio: 'pipe' });
    Logger.success('✅ MBT CLI is available');
  } catch (_error) {
    Logger.error('❌ MBT CLI not found. Please install it first.');
    Logger.info('   Installation instructions:');
    Logger.info('   - Download from: https://sap.github.io/cloud-mta-build-tool/');
    Logger.info('   - Or use npm: npm install -g mbt');
    process.exit(1);
  }
}

/**
 * Build MTA archive
 */
async function buildMta(): Promise<void> {
  try {
    Logger.highlight('🏗️ Building E-Mobility Driver App MTA Archive...');
    Logger.highlight('================================================');
    Logger.info('');

    // Find project root
    const projectRoot = findProjectRoot();
    Logger.info(`📁 Project root: ${projectRoot}`);
    Logger.info('');

    // Check MBT CLI
    checkMbtCli();
    Logger.info('');

    // Check if mta.yaml exists
    const mtaYamlPath = path.join(projectRoot, 'mta.yaml');
    if (!fs.existsSync(mtaYamlPath)) {
      Logger.error('❌ mta.yaml not found in project root');
      Logger.info('   Make sure you are in the correct project directory');
      process.exit(1);
    }

    Logger.success('✅ mta.yaml found');
    Logger.info('');

    // Run mbt build
    Logger.info('🔨 Building MTA archive...');
    Logger.info('   This may take several minutes...');
    Logger.info('');

    execSync('mbt build', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env },
    });

    Logger.info('');
    Logger.success('✅ MTA archive built successfully!');
    Logger.info('');

    // Check for generated archive
    const mtaArchivesDir = path.join(projectRoot, 'mta_archives');
    if (fs.existsSync(mtaArchivesDir)) {
      const files = fs.readdirSync(mtaArchivesDir).filter((file) => file.endsWith('.mtar'));
      if (files.length > 0) {
        Logger.info('📦 Generated archive(s):');
        files.forEach((file) => {
          Logger.highlight(`   • ${file}`);
        });
        Logger.info('');
        Logger.info('💡 Next steps:');
        Logger.info('   - Deploy with: npm run cli deploy');
        Logger.info('   - Or manually: cf deploy mta_archives/' + files[0]);
      }
    }
  } catch (error) {
    Logger.error('❌ Build failed:', error instanceof Error ? error.message : String(error));
    Logger.info('');
    Logger.warning('💡 Troubleshooting:');
    Logger.info('   - Ensure all dependencies are installed: npm run install:all');
    Logger.info('   - Check mta.yaml syntax');
    Logger.info('   - Review build logs above for specific errors');
    process.exit(1);
  }
}

/**
 * Build command - builds MTA archive using mbt
 */
export const buildCommand: BaseCommand = {
  name: 'build',
  description: 'Build MTA archive for deployment',
  action: buildMta,
};
