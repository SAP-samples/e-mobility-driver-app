// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import path from 'path';

import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';

import { BaseCommand } from '../framework/command-registry';
import { Logger } from '../utils/logger';

interface ServiceBinding {
  binding: {
    type: string;
    apiEndpoint: string;
    org: string;
    space: string;
    instance: string;
    key: string;
  };
  vcap: {
    name: string;
  };
}

interface ServiceConfig {
  kind: string;
  model?: string;
  credentials?: {
    path: string;
    forwardAuthToken: boolean;
  };
  '[production]'?: {
    vcap: {
      name: string;
    };
  };
}

interface ConfigFile {
  requires: {
    [key: string]: any; // For service bindings and other configurations
  };
  'auth-dev'?: {
    [key: string]: {
      email: string;
      name: string;
      roles: string;
    };
  };
  env?: {
    [key: string]: any;
  };
  [key: string]: any;
}

interface MainConfigFile {
  requires: {
    [serviceName: string]: ServiceConfig;
  };
}

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
 * Read the main CDS configuration to identify external services
 */
function getExternalServices(): string[] {
  const projectRoot = findProjectRoot();
  const mainConfigPath = path.join(projectRoot, '.cdsrc.json');

  if (!fs.existsSync(mainConfigPath)) {
    Logger.warning('⚠️ .cdsrc.json not found');
    return [];
  }

  try {
    const mainConfig: MainConfigFile = fs.readJsonSync(mainConfigPath);
    const externalServices: string[] = [];

    for (const [serviceName, serviceConfig] of Object.entries(mainConfig.requires)) {
      // Identify OData services that need bindings
      if (serviceConfig.kind === 'odata' && serviceConfig.model) {
        externalServices.push(serviceName);
      }
    }

    return externalServices;
  } catch (error) {
    Logger.error('❌ Failed to read .cdsrc.json:', error);
    return [];
  }
}

/**
 * Setup service bindings and auto-generate external service bindings
 */
async function setupServiceBindings(profile: string): Promise<ServiceBinding | null> {
  Logger.info('🔗 Setting up service bindings...');

  try {
    const projectRoot = findProjectRoot();

    // Run cds bind command for the specific profile
    execSync(`cds bind -2 emobility-api --for ${profile}`, {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    // Read the generated binding from .cdsrc-private.json
    const privateConfigPath = path.join(projectRoot, '.cdsrc-private.json');
    let baseBinding: ServiceBinding | null = null;

    if (fs.existsSync(privateConfigPath)) {
      try {
        const privateConfig = fs.readJsonSync(privateConfigPath);
        const profileConfig = privateConfig.requires?.[`[${profile}]`];

        if (profileConfig?.['custom-service:emobility-api']) {
          baseBinding = profileConfig['custom-service:emobility-api'];
        }
      } catch (error) {
        Logger.warning('⚠️ Could not read existing private config');
        Logger.error('Debug:', error);
      }
    }

    Logger.success('✅ Service bindings configured');
    return baseBinding;
  } catch (error) {
    Logger.error('❌ Failed to setup service bindings');
    throw error;
  }
}

/**
 * Generate service bindings for external services
 */
function generateExternalServiceBindings(
  baseBinding: ServiceBinding,
  externalServices: string[],
): Record<string, ServiceBinding> {
  const serviceBindings: Record<string, ServiceBinding> = {};

  for (const serviceName of externalServices) {
    serviceBindings[serviceName] = {
      binding: { ...baseBinding.binding },
      vcap: {
        name: 'emobility-api', // Use the service instance name
      },
    };
  }

  return serviceBindings;
}

/**
 * Manage profiles in the private configuration
 */
async function manageProfiles(): Promise<{ profile: string; action: string }> {
  const projectRoot = findProjectRoot();
  const privateConfigPath = path.join(projectRoot, '.cdsrc-private.json');

  // Read existing profiles
  let existingConfig: ConfigFile | null = null;
  let existingProfiles: string[] = [];

  if (fs.existsSync(privateConfigPath)) {
    try {
      existingConfig = fs.readJsonSync(privateConfigPath);
      if (existingConfig?.requires) {
        existingProfiles = Object.keys(existingConfig.requires)
          .filter((key) => key.startsWith('[') && key.endsWith(']'))
          .map((key) => key.slice(1, -1)); // Remove brackets
      }
    } catch (error) {
      Logger.warning('⚠️ Could not read existing private config');
      Logger.error('Debug:', error);
    }
  }

  const choices = [
    { name: 'Create/Update profile', value: 'upsert' },
    ...(existingProfiles.length > 0 ? [{ name: 'Delete profile', value: 'delete' }] : []),
    { name: 'List profiles', value: 'list' },
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
    },
  ]);

  if (action === 'list') {
    if (existingProfiles.length === 0) {
      Logger.info('📋 No profiles found');
    } else {
      Logger.info('📋 Existing profiles:');
      existingProfiles.forEach((profile) => {
        Logger.highlight(`  • ${profile}`);
      });
    }
    return manageProfiles(); // Return to menu
  }

  if (action === 'delete') {
    const { profileToDelete } = await inquirer.prompt([
      {
        type: 'list',
        name: 'profileToDelete',
        message: 'Select profile to delete:',
        choices: existingProfiles,
      },
    ]);

    return { profile: profileToDelete, action: 'delete' };
  }

  // For upsert, ask for profile name
  const { profile } = await inquirer.prompt([
    {
      type: 'input',
      name: 'profile',
      message: 'Enter profile name:',
      default: 'hybrid',
      validate: (input: string) => {
        const profileRegex = /^[a-zA-Z0-9_-]+$/;
        return (
          profileRegex.test(input) ||
          'Please enter a valid profile name (letters, numbers, underscore, dash only)'
        );
      },
    },
  ]);

  return { profile, action: 'upsert' };
}

/**
 * Setup mocked authentication with profile support
 */
async function setupMockedAuth(profile: string, baseBinding: ServiceBinding | null): Promise<void> {
  const projectRoot = findProjectRoot();
  const privateConfigPath = path.join(projectRoot, '.cdsrc-private.json');

  Logger.info(`👤 Setting up authentication for profile: ${profile}`);

  // Prompt for user information
  const userInfo = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'devMode',
      message: 'Enable development mode (custom auth with user details)?',
      default: true,
    },
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || 'Please enter a valid email address';
      },
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter your full name:',
      validate: (input: string) => input.trim().length > 0 || 'Name cannot be empty',
    },
    {
      type: 'checkbox',
      name: 'roles',
      message: 'Select user roles:',
      choices: [
        { name: 'Admin', value: 'admin', checked: true },
        { name: 'User', value: 'user', checked: true },
        { name: 'Badge Read', value: 'badgeRead', checked: true },
        { name: 'Charge Point Read', value: 'chargePointRead', checked: true },
        { name: 'Charging Session Read', value: 'chargingSessionRead', checked: true },
      ],
    },
  ]);

  const { devMode, email, name, roles } = userInfo;

  // Read existing config to preserve other profiles and settings
  let existingConfig: ConfigFile = { requires: {} };
  if (fs.existsSync(privateConfigPath)) {
    try {
      existingConfig = fs.readJsonSync(privateConfigPath);
    } catch (error) {
      Logger.warning('⚠️ Could not read existing private config, creating new one');
      Logger.error('Debug:', error);
    }
  }

  // Get external services and generate bindings
  const externalServices = getExternalServices();
  Logger.info(`🔍 Found external services: ${externalServices.join(', ')}`);

  // Prepare profile configuration
  const profileKey = `[${profile}]`;
  const profileConfig: any = {};

  // Add service bindings if we have a base binding
  if (baseBinding) {
    // Add the custom service binding
    profileConfig['custom-service:emobility-api'] = baseBinding;

    // Add external service bindings
    const externalBindings = generateExternalServiceBindings(baseBinding, externalServices);
    Object.assign(profileConfig, externalBindings);
  }

  // Merge with existing profile config if it exists
  if (existingConfig.requires[profileKey]) {
    Object.assign(profileConfig, existingConfig.requires[profileKey]);
  }

  // Create the updated configuration
  const updatedConfig: ConfigFile = {
    ...existingConfig,
    requires: {
      ...existingConfig.requires,
      [profileKey]: profileConfig,
    },
  };

  // Add auth-dev configuration if in dev mode
  if (devMode) {
    updatedConfig['auth-dev'] ??= {};
    updatedConfig['auth-dev'][profileKey] = {
      email,
      name,
      roles: roles.join(','),
    };
  }

  // Write configuration
  await fs.writeJson(privateConfigPath, updatedConfig, { spaces: 2 });

  // Ensure .gitignore includes the private config
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.cdsrc-private.json')) {
      await fs.appendFile(gitignorePath, '\n.cdsrc-private.json\n');
    }
  }

  Logger.success(`✅ Profile "${profile}" configured successfully`);
  Logger.info(`🎯 External services automatically configured: ${externalServices.join(', ')}`);

  if (devMode) {
    Logger.success(`✅ Development authentication configured for profile "${profile}"`);
    Logger.info(`👤 User: ${name} (${email})`);
    Logger.info(`🎭 Roles: ${roles.join(', ')}`);
  }

  Logger.info(chalk.yellow('⚠️  Restart your CAP server for changes to take effect'));
}

/**
 * Delete a profile
 */
async function deleteProfile(profileToDelete: string): Promise<void> {
  const projectRoot = findProjectRoot();
  const privateConfigPath = path.join(projectRoot, '.cdsrc-private.json');

  if (!fs.existsSync(privateConfigPath)) {
    Logger.error('❌ No private configuration file found');
    return;
  }

  try {
    const existingConfig = fs.readJsonSync(privateConfigPath);
    const profileKey = `[${profileToDelete}]`;

    if (!existingConfig.requires?.[profileKey]) {
      Logger.error(`❌ Profile "${profileToDelete}" not found`);
      return;
    }

    // Remove the profile
    delete existingConfig.requires[profileKey];

    // Also remove auth-dev entry for this profile if it exists
    if (existingConfig['auth-dev']?.[profileKey]) {
      delete existingConfig['auth-dev'][profileKey];

      // If auth-dev is now empty, remove it entirely
      if (Object.keys(existingConfig['auth-dev']).length === 0) {
        delete existingConfig['auth-dev'];
      }
    }

    // Write updated configuration
    await fs.writeJson(privateConfigPath, existingConfig, { spaces: 2 });

    Logger.success(`✅ Profile "${profileToDelete}" deleted successfully`);
  } catch (error) {
    Logger.error('❌ Failed to delete profile:', error);
  }
}

/**
 * Main config command function
 */
async function configureProject(): Promise<void> {
  try {
    Logger.info('🔧 Configuring project...');

    // Manage profiles
    const { profile, action } = await manageProfiles();

    if (action === 'delete') {
      await deleteProfile(profile);
      return;
    }

    // Setup service bindings
    const baseBinding = await setupServiceBindings(profile);

    // Setup authentication for the profile
    await setupMockedAuth(profile, baseBinding);

    Logger.success('✅ Project configuration completed');
  } catch (error) {
    Logger.error(
      '❌ Configuration failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

/**
 * Config command - comprehensive project configuration
 */
export const configCommand: BaseCommand = {
  name: 'config',
  description: 'Configure development environment (profiles, service bindings + authentication)',
  action: configureProject,
};
