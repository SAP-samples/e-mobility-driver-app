// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { exec } from 'child_process';
import crypto from 'crypto';
import { promisify } from 'util';

import fs from 'fs-extra';

import { getProjectPrivateConfigPath } from './project-utils';

const execAsync = promisify(exec);

/**
 * Push encryption key to CF user-provided service
 */
export async function pushKeyToCF(key: string, serviceName: string): Promise<boolean> {
  try {
    console.log(`📡 Managing CF service: ${serviceName}`);

    // Check if service exists
    let serviceExists = false;
    try {
      const { stdout } = await execAsync(`cf service ${serviceName} --guid`);
      serviceExists = stdout.trim().length > 0;
      console.log(`✅ Service ${serviceName} already exists`);
    } catch (_error) {
      console.log(`🆕 Service ${serviceName} does not exist, will create it`);
      serviceExists = false;
    }

    if (serviceExists) {
      // Service exists, update it
      console.log(`📝 Updating existing service: ${serviceName}`);
      await execAsync(
        `cf update-user-provided-service ${serviceName} -p '{"QR_ENCRYPTION_KEY":"${key}"}'`,
      );
      console.log(`✅ Successfully updated service: ${serviceName}`);
    } else {
      // Service doesn't exist, create it
      console.log(`📝 Creating new service: ${serviceName}`);
      try {
        await execAsync(
          `cf create-user-provided-service ${serviceName} -p '{"QR_ENCRYPTION_KEY":"${key}"}'`,
        );
        console.log(`✅ Successfully created service: ${serviceName}`);
      } catch (createError) {
        console.error(`❌ Failed to create service: ${(createError as Error).message}`);
        console.log('💡 Possible solutions:');
        console.log('   • Check if you have permissions to create services in this space');
        console.log('   • Verify the service name is valid and not already taken');
        console.log('   • Ensure you are in the correct CF space: cf target');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ CF operation failed:', (error as Error).message);
    console.log('💡 Troubleshooting:');
    console.log('   • Make sure you are logged in to CF: cf login');
    console.log('   • Check your CF target: cf target');
    console.log('   • Verify you have the necessary permissions');
    return false;
  }
}

/**
 * Get encryption key from CF service
 */
export async function getCFServiceKey(serviceName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('cf env driver-app-srv');

    // Find the start of VCAP_SERVICES
    const vcapStart = stdout.indexOf('VCAP_SERVICES: {');
    if (vcapStart === -1) {
      console.warn('No VCAP_SERVICES found in CF environment');
      return null;
    }

    // Find the end of VCAP_SERVICES by looking for the next section or end
    const jsonStart = stdout.indexOf('{', vcapStart);
    let braceCount = 0;
    let jsonEnd = jsonStart;

    for (let i = jsonStart; i < stdout.length; i++) {
      if (stdout[i] === '{') braceCount++;
      if (stdout[i] === '}') braceCount--;
      if (braceCount === 0) {
        jsonEnd = i + 1;
        break;
      }
    }

    const vcapJson = stdout.substring(jsonStart, jsonEnd);
    const vcapServices = JSON.parse(vcapJson);
    const userProvided = vcapServices['user-provided'] || [];

    const service = userProvided.find((s: any) => s.name === serviceName);
    return service?.credentials?.QR_ENCRYPTION_KEY || null;
  } catch (error) {
    throw new Error(`Could not retrieve key from CF: ${(error as Error).message}`);
  }
}

/**
 * Update .cdsrc-private.json with QR encryption configuration
 */
export async function updateCdsrcPrivate(
  configPath: string,
  envVars: Record<string, string>,
): Promise<void> {
  let config: any = {};

  if (await fs.pathExists(configPath)) {
    config = await fs.readJson(configPath);
  }

  if (!config['qr-encryption']) {
    config['qr-encryption'] = {};
  }

  Object.assign(config['qr-encryption'], envVars);

  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * Get current key from .cdsrc-private.json
 */
export async function getLocalKey(configPath: string): Promise<string | null> {
  try {
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      // Try new qr-encryption structure first, then fallback to old env structure
      return config['qr-encryption']?.QR_ENCRYPTION_KEY || config.env?.QR_ENCRYPTION_KEY || null;
    }
    return null;
  } catch (error) {
    console.warn('Could not read local config:', (error as Error).message);
    return null;
  }
}

/**
 * Generate a secure encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate encryption key format
 */
export function isValidEncryptionKey(key: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(key);
}

/**
 * Show comprehensive key status
 */
export async function showKeyStatus(serviceName: string): Promise<void> {
  let cfKey;
  console.log('🔍 QR Encryption Key Status:\n');

  // Local config key
  const configPath = getProjectPrivateConfigPath();
  const localKey = await getLocalKey(configPath);
  console.log(`Local Config: ${localKey ? '✅ Set' : '❌ Not set'}`);
  if (localKey) {
    console.log(`  Key: ${localKey.substring(0, 8)}...${localKey.substring(56)}`);
    console.log(`  Path: ${configPath}`);
  }

  // CF Service key
  try {
    cfKey = await getCFServiceKey(serviceName);
    console.log(`CF Service (${serviceName}): ${cfKey ? '✅ Set' : '❌ Not set'}`);
    if (cfKey) {
      console.log(`  Key: ${cfKey.substring(0, 8)}...${cfKey.substring(56)}`);
    }

    // Sync status between local and CF
    if (localKey && cfKey) {
      const inSync = localKey === cfKey;
      console.log(`\nLocal/CF Sync: ${inSync ? '✅ In sync' : '⚠️  Out of sync'}`);

      if (!inSync) {
        console.log('💡 Use --sync-key-from-cf or --sync-key-to-cf to synchronize');
      }
    }
  } catch (error) {
    console.log(`CF Service (${serviceName}): ❌ Error retrieving`);
    console.log(`  Error: ${(error as Error).message}`);
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!localKey) {
    console.log('   • Run --setup-key to generate initial configuration');
  } else if (localKey && !cfKey) {
    console.log('   • Run --sync-key-to-cf to upload key to CF service');
  } else if (localKey) {
    console.log('   • Restart your CDS server to load the local key');
  }
}

/**
 * Mask sensitive key for display
 */
export function maskKey(key: string): string {
  if (key.length < 16) return key;
  return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
}
