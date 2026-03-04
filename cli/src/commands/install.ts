// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import path from 'path';

import fs from 'fs-extra';

import { BaseCommand } from '../framework/command-registry';
import { Logger } from '../utils/logger';

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
 * Check if Node.js and npm meet minimum requirements
 */
function checkPrerequisites(): void {
  Logger.info('🔍 Checking prerequisites...');

  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

    if (majorVersion < 20) {
      Logger.error(
        `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js >= 20`,
      );
      process.exit(1);
    }

    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

    Logger.success('✅ Prerequisites check passed');
    Logger.info(`   Node.js: ${nodeVersion}`);
    Logger.info(`   npm: ${npmVersion}`);
  } catch (_error) {
    Logger.error('❌ Node.js or npm is not installed. Please install Node.js >= 20 with npm >= 8');
    process.exit(1);
  }
}

/**
 * Install dependencies in a specific directory
 */
function installDependencies(directory: string, name: string, projectRoot: string): void {
  const fullPath = path.join(projectRoot, directory);

  if (!fs.existsSync(fullPath)) {
    Logger.warning(`⚠️ Directory ${directory} not found. Skipping ${name} installation.`);
    return;
  }

  const packageJsonPath = path.join(fullPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    Logger.warning(`⚠️ No package.json found in ${directory}. Skipping ${name} installation.`);
    return;
  }

  Logger.info(`📦 Installing ${name} dependencies...`);

  try {
    execSync('npm install', {
      cwd: fullPath,
      stdio: 'inherit',
      env: { ...process.env },
    });
    Logger.success(`✅ ${name} dependencies installed`);
  } catch (error) {
    Logger.error(`❌ Failed to install ${name} dependencies`);
    throw error;
  }
}

/**
 * Check and install SAP CDS CLI if not available
 */
function checkCdsCli(): void {
  Logger.info('🔍 Checking SAP CDS CLI...');

  try {
    execSync('cds --version', { encoding: 'utf8', stdio: 'pipe' });
    Logger.success('✅ SAP CDS CLI is available');
  } catch (_error) {
    Logger.warning('⚠️ SAP CDS CLI not found globally. Installing...');

    try {
      execSync('npm install -g @sap/cds-dk', {
        stdio: 'inherit',
        env: { ...process.env },
      });
      Logger.success('✅ SAP CDS CLI installed globally');
    } catch (_installError) {
      Logger.warning(
        '⚠️ Failed to install SAP CDS CLI globally. You may need to install it manually or check permissions.',
      );
      Logger.info('   Run: npm install -g @sap/cds-dk');
    }
  }
}

/**
 * Check build and deployment tools
 */
function checkBuildDeployTools(): void {
  Logger.info('🔍 Checking build and deployment tools...');

  // Check MBT CLI
  try {
    execSync('mbt --version', { encoding: 'utf8', stdio: 'pipe' });
    Logger.success('✅ MBT CLI is available');
  } catch (_error) {
    Logger.warning('⚠️ MBT CLI not found (needed for building)');
    Logger.info('   Install with: npm install -g mbt');
    Logger.info('   Or download from: https://sap.github.io/cloud-mta-build-tool/');
  }

  // Check CF CLI
  try {
    execSync('cf --version', { encoding: 'utf8', stdio: 'pipe' });
    Logger.success('✅ Cloud Foundry CLI is available');
  } catch (_error) {
    Logger.warning('⚠️ Cloud Foundry CLI not found (needed for deployment)');
    Logger.info('   Download from: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html');
  }
}

/**
 * Display post-installation instructions
 */
function showNextSteps(): void {
  Logger.success('🎉 All dependencies installed successfully!');
  Logger.info('');
  Logger.highlight('Next steps:');
  Logger.info('  1. Configure your development environment:');
  Logger.warning('     npm run cli config');
  Logger.info('');
  Logger.info('  2. Start development servers:');
  Logger.warning('     npm run cli start');
  Logger.info('');
  Logger.info('  3. Or use the quick bootstrap command:');
  Logger.warning('     npm run cli bootstrap');
  Logger.info('');
  Logger.highlight('Build and deployment:');
  Logger.info('  • Build MTA archive:');
  Logger.warning('     npm run cli build');
  Logger.info('  • Deploy to Cloud Foundry:');
  Logger.warning('     npm run cli deploy');
  Logger.info('');
  Logger.info('For more information, see the README.md file.');
}

/**
 * Main install command function
 */
async function installAllDependencies(): Promise<void> {
  try {
    Logger.highlight('🚀 Installing E-Mobility Driver App Dependencies...');
    Logger.highlight('==================================================');
    Logger.info('');

    // Find project root
    const projectRoot = findProjectRoot();
    Logger.info(`📁 Project root: ${projectRoot}`);
    Logger.info(`📁 Current working directory: ${process.cwd()}`);
    Logger.info('');

    // Check prerequisites
    checkPrerequisites();
    Logger.info('');

    // Install dependencies in order
    Logger.info('📦 Installing project dependencies...');
    Logger.info('');

    // 1. Root dependencies
    installDependencies('.', 'root project', projectRoot);
    Logger.info('');

    // 2. CLI dependencies (skip if we're already running from CLI with dependencies)
    const currentDir = process.cwd();
    if (path.basename(currentDir) === 'cli') {
      Logger.info('📦 CLI dependencies already available (running from CLI directory)');
      Logger.success('✅ CLI dependencies confirmed');
    } else {
      installDependencies('cli', 'CLI', projectRoot);
    }
    Logger.info('');

    // 3. Frontend dependencies
    installDependencies('app/driver-vue', 'frontend', projectRoot);
    Logger.info('');

    Logger.info('');

    // 5. Check CDS CLI
    checkCdsCli();

    // Show next steps
    showNextSteps();
  } catch (error) {
    Logger.error('❌ Installation failed:', error instanceof Error ? error.message : String(error));
    Logger.info('');
    Logger.warning('💡 You can try:');
    Logger.info('  - Run the command again');
    Logger.info('  - Check your internet connection');
    Logger.info('  - Clear npm cache: npm cache clean --force');
    Logger.info('  - Install dependencies manually in each directory');
    process.exit(1);
  }
}

/**
 * Install command - installs all project dependencies
 */
export const installCommand: BaseCommand = {
  name: 'install',
  description: 'Install all dependencies across all project modules',
  action: installAllDependencies,
};
