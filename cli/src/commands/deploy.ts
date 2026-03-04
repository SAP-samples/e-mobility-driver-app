// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import path from 'path';

import fs from 'fs-extra';
import inquirer from 'inquirer';

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
 * Check if CF CLI is available
 */
function checkCfCli(): void {
  Logger.info('🔍 Checking Cloud Foundry CLI...');

  try {
    execSync('cf --version', { encoding: 'utf8', stdio: 'pipe' });
    Logger.success('✅ Cloud Foundry CLI is available');
  } catch (_error) {
    Logger.error('❌ Cloud Foundry CLI not found. Please install it first.');
    Logger.info('   Installation instructions:');
    Logger.info('   - Download from: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html');
    Logger.info('   - Or use package manager (brew, apt, etc.)');
    process.exit(1);
  }
}

/**
 * Check if user is logged in to CF
 */
function checkCfLogin(): boolean {
  try {
    execSync('cf target', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Find available MTA archives
 */
function findMtaArchives(projectRoot: string): string[] {
  const mtaArchivesDir = path.join(projectRoot, 'mta_archives');

  if (!fs.existsSync(mtaArchivesDir)) {
    return [];
  }

  return fs
    .readdirSync(mtaArchivesDir)
    .filter((file: string) => file.endsWith('.mtar'))
    .sort((a: string, b: string) => {
      // Sort by modification time, newest first
      const aPath = path.join(mtaArchivesDir, a);
      const bPath = path.join(mtaArchivesDir, b);
      const aStat = fs.statSync(aPath);
      const bStat = fs.statSync(bPath);
      return bStat.mtime.getTime() - aStat.mtime.getTime();
    });
}

/**
 * Deploy MTA archive
 */
async function deployMta(): Promise<void> {
  try {
    Logger.highlight('🚀 Deploying E-Mobility Driver App to Cloud Foundry...');
    Logger.highlight('===================================================');
    Logger.info('');

    // Find project root
    const projectRoot = findProjectRoot();
    Logger.info(`📁 Project root: ${projectRoot}`);
    Logger.info('');

    // Check CF CLI
    checkCfCli();
    Logger.info('');

    // Check if logged in
    if (!checkCfLogin()) {
      Logger.warning('⚠️ Not logged in to Cloud Foundry');
      Logger.info('Please log in first:');
      Logger.highlight('   cf login -a <API_ENDPOINT> -o <ORG> -s <SPACE>');
      Logger.info('');

      const { shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldContinue',
          message: 'Would you like to continue with login?',
          default: false,
        },
      ]);

      if (!shouldContinue) {
        Logger.info('Deployment cancelled. Please log in and try again.');
        return;
      }

      // Show current target after potential login
      try {
        const target = execSync('cf target', { encoding: 'utf8', stdio: 'pipe' });
        Logger.info('Current CF target:');
        Logger.info(target);
      } catch (_error) {
        Logger.error('❌ Still not logged in. Please run cf login manually.');
        process.exit(1);
      }
    } else {
      Logger.success('✅ Logged in to Cloud Foundry');

      // Show current target
      try {
        const target = execSync('cf target', { encoding: 'utf8' });
        Logger.info('Current target:');
        Logger.info(target);
      } catch (_error) {
        // Target info failed, but we're logged in
      }
    }

    Logger.info('');

    // Find MTA archives
    const archives = findMtaArchives(projectRoot);

    if (archives.length === 0) {
      Logger.error('❌ No MTA archives found in mta_archives/ directory');
      Logger.info('💡 Build an archive first with: npm run cli build');
      process.exit(1);
    }

    let selectedArchive: string;

    if (archives.length === 1) {
      selectedArchive = archives[0];
      Logger.info(`📦 Found archive: ${selectedArchive}`);
    } else {
      Logger.info(`📦 Found ${archives.length} archives:`);
      archives.forEach((archive: string, index: number) => {
        Logger.info(`   ${index + 1}. ${archive}`);
      });
      Logger.info('');

      const { archiveChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'archiveChoice',
          message: 'Select archive to deploy:',
          choices: archives.map((archive: string) => ({
            name: archive,
            value: archive,
          })),
        },
      ]);

      selectedArchive = archiveChoice;
    }

    Logger.info('');

    // Confirm deployment
    const { confirmDeploy } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDeploy',
        message: `Deploy ${selectedArchive} to Cloud Foundry?`,
        default: true,
      },
    ]);

    if (!confirmDeploy) {
      Logger.info('Deployment cancelled.');
      return;
    }

    // Deploy
    Logger.info('');
    Logger.info('🚀 Deploying to Cloud Foundry...');
    Logger.info('   This may take several minutes...');
    Logger.info('');

    const archivePath = path.join('mta_archives', selectedArchive);
    execSync(`cf deploy ${archivePath}`, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env },
    });

    Logger.info('');
    Logger.success('✅ Deployment completed successfully!');
    Logger.info('');
    Logger.info('💡 Next steps:');
    Logger.info('   - Check deployment status: cf apps');
    Logger.info('   - View logs: cf logs <app-name>');
    Logger.info('   - Access your application through the provided routes');
  } catch (error) {
    Logger.error('❌ Deployment failed:', error instanceof Error ? error.message : String(error));
    Logger.info('');
    Logger.warning('💡 Troubleshooting:');
    Logger.info('   - Check your Cloud Foundry login: cf target');
    Logger.info('   - Verify your organization and space permissions');
    Logger.info('   - Review deployment logs above for specific errors');
    Logger.info('   - Check if services are properly bound');
    process.exit(1);
  }
}

/**
 * Deploy command - deploys MTA archive to Cloud Foundry
 */
export const deployCommand: BaseCommand = {
  name: 'deploy',
  description: 'Deploy MTA archive to Cloud Foundry',
  action: deployMta,
};
