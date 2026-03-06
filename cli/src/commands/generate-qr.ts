// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import path from 'path';

import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';

import { BaseCommand } from '../framework/command-registry.js';
import { CDSEvseClient } from '../utils/cds-evse-client.js';
import { Logger } from '../utils/logger.js';
import { PDFGenerator } from '../utils/pdf-generator.js';
import { getProjectPrivateConfigPath } from '../utils/project-utils.js';
import {
  generateEncryptionKey,
  getCFServiceKey,
  getLocalKey,
  maskKey,
  pushKeyToCF,
  showKeyStatus,
  updateCdsrcPrivate,
} from '../utils/qr-key-utils.js';
import { getPresetChoices } from '../utils/qr-style-presets.js';
import type { QRStyleConfig } from '../utils/qr-style-types.js';

export const generateQRCommand: BaseCommand = {
  name: 'generate-qr',
  description: 'Generate QR codes for EVSE charging stations in PDF format',
  options: [
    {
      flags: '--output <path>',
      description: 'Output directory for PDF files',
      defaultValue: './qr-codes',
    },
    {
      flags: '--site-area <name>',
      description: 'Filter by specific site area',
    },
    {
      flags: '--filter <criteria>',
      description: 'Filter EVSEs by name or code',
    },
    {
      flags: '--format <format>',
      description: 'PDF format (A4, Letter, or Sticker)',
      defaultValue: 'A4',
    },
    {
      flags: '--title <title>',
      description: 'Custom title for PDF',
      defaultValue: 'E-Mobility Quick Start',
    },
    {
      flags: '--interactive',
      description: 'Interactive mode with prompts',
    },
    // Key management options
    {
      flags: '--setup-key',
      description: 'Generate and setup encryption key locally',
    },
    {
      flags: '--sync-key-to-cf',
      description: 'Upload local encryption key to CF service',
    },
    {
      flags: '--sync-key-from-cf',
      description: 'Download encryption key from CF service',
    },
    {
      flags: '--show-key-status',
      description: 'Show encryption key status and sync information',
    },
    {
      flags: '--key-service-name <name>',
      description: 'CF service name for encryption key',
      defaultValue: 'driver-app-qr-config',
    },
  ],
  action: async (
    options: {
      output?: string;
      siteArea?: string;
      filter?: string;
      format?: string;
      title?: string;
      interactive?: boolean;
      setupKey?: boolean;
      syncKeyToCf?: boolean;
      syncKeyFromCf?: boolean;
      showKeyStatus?: boolean;
      keyServiceName?: string;
    } = {},
  ) => {
    const serviceName = options.keyServiceName || 'driver-app-qr-config';

    // Handle key management operations first (priority)
    if (options.setupKey) {
      return await handleSetupKey();
    }

    if (options.syncKeyToCf) {
      return await handleSyncKeyToCF(serviceName);
    }

    if (options.syncKeyFromCf) {
      return await handleSyncKeyFromCF(serviceName);
    }

    if (options.showKeyStatus) {
      return await showKeyStatus(serviceName);
    }

    // Regular QR generation workflow
    try {
      Logger.info('🔌 Starting QR Code Generation for EVSE Charging Stations...');

      // Interactive mode
      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'output',
            message: 'Output directory:',
            default: options.output,
          },
          {
            type: 'list',
            name: 'format',
            message: 'PDF format:',
            choices: ['A4', 'Letter', 'Sticker (5×7cm)'],
            default: options.format,
          },
          {
            type: 'input',
            name: 'title',
            message: 'PDF title:',
            default: options.title,
            when: (answers) => !answers.format.includes('Sticker'),
          },
        ]);

        Object.assign(options, answers);

        // QR Style preset selection (direct, no mode selection)
        const styleAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'styledPreset',
            message: 'QR Style preset:',
            choices: getPresetChoices(),
            default: 'standard',
          },
        ]);

        Object.assign(options, styleAnswers);

        // Additional prompts for Sticker format
        if (answers.format.includes('Sticker')) {
          const stickerAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'stickerTitle',
              message: 'Sticker title (press Enter to skip):',
              // No default - pressing Enter will result in empty string
            },
            {
              type: 'input',
              name: 'logoPath',
              message: 'Logo path - PNG/JPEG only (press Enter to skip):',
              validate: (input: string) => {
                if (!input || input.trim() === '') {
                  return true; // Empty is valid (optional)
                }
                const ext = input.toLowerCase().split('.').pop();
                if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
                  return true;
                }
                return 'Only PNG and JPEG formats are supported. SVG is not supported by PDFKit.';
              },
            },
          ]);

          Object.assign(options, stickerAnswers);
        }
      }

      // Ensure format has a default value and normalize it
      if (!options.format) {
        options.format = 'A4';
      }

      // Normalize and validate format
      // Handle "Sticker (5×5cm)" from interactive menu
      if (options.format.toLowerCase().includes('sticker')) {
        options.format = 'Sticker';
      } else {
        options.format =
          options.format.charAt(0).toUpperCase() + options.format.slice(1).toLowerCase();
      }

      if (!['A4', 'Letter', 'Sticker'].includes(options.format)) {
        throw new Error('Format must be either A4, Letter, or Sticker');
      }

      // Initialize CDS client (HTTP API approach)
      const port = 4004;
      Logger.info(`🔍 Connecting to CDS server on port: ${chalk.cyan(port)}`);

      const cdsClient = CDSEvseClient.getInstance();

      await cdsClient.connect({ port });

      // Test connection
      const isConnected = await cdsClient.testConnection();
      if (!isConnected) {
        throw new Error(
          'Failed to connect to CDS server. Please ensure the server is running on port 4004.',
        );
      }

      Logger.success('✅ Connected to CDS services');

      // Fetch EVSEs
      Logger.info('📡 Fetching EVSE data...');
      let evses;

      if (options.siteArea) {
        Logger.info(`🏢 Filtering by site area: ${chalk.cyan(options.siteArea)}`);
        evses = await cdsClient.fetchEVSEsBySiteArea(options.siteArea);
      } else {
        evses = await cdsClient.fetchEVSEs(options.filter);
      }

      if (evses.length === 0) {
        Logger.warn('⚠️  No EVSEs found matching the criteria');
        return;
      }

      // One QR code per EVSE (not per connector)
      const totalQRCodes = evses.length;

      Logger.info(
        `📊 Found ${chalk.green(evses.length)} EVSEs (${chalk.green(totalQRCodes)} QR codes will be generated)`,
      );

      // Show preview of what will be generated
      Logger.info('\n📋 Preview of EVSEs to be processed:');
      evses.slice(0, 5).forEach((evse, index) => {
        const location =
          evse.location?.siteAreaName || evse.location?.siteName || 'Unknown location';
        Logger.info(
          `   ${index + 1}. ${evse.name || evse.code || evse.id} (${location}) - ${evse.connectors.length} connector(s)`,
        );
      });

      if (evses.length > 5) {
        Logger.info(`   ... and ${evses.length - 5} more EVSEs`);
      }

      // Confirm generation
      if (options.interactive) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Generate ${totalQRCodes} QR codes in PDF format?`,
            default: true,
          },
        ]);

        if (!confirm) {
          Logger.info('❌ QR code generation cancelled');
          return;
        }
      }

      // Ensure output directory exists
      const outputDir = options.output || './qr-codes';
      await fs.ensureDir(outputDir);

      // Generate PDF filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filePrefix = options.format === 'Sticker' ? 'evse-qr-stickers' : 'evse-qr-codes';
      const filename = `${filePrefix}-${timestamp}.pdf`;
      const outputPath = path.join(outputDir, filename);

      // Get encryption key with auto-sync fallback
      Logger.info('🔐 Retrieving encryption key...');

      const configPath = getProjectPrivateConfigPath();
      let encryptionKey = await getLocalKey(configPath);

      if (!encryptionKey) {
        Logger.info('🔍 No local encryption key found, checking CF service...');

        try {
          // Try to retrieve from CF automatically
          const cfKey = await getCFServiceKey(serviceName);

          if (cfKey) {
            Logger.info('✅ Found key in CF service, synchronizing locally...');
            await updateCdsrcPrivate(configPath, { QR_ENCRYPTION_KEY: cfKey });
            encryptionKey = cfKey;
            Logger.success('🔄 Key synchronized from CF service');
          }
        } catch (error) {
          Logger.warn(`⚠️  Could not retrieve key from CF: ${(error as Error).message}`);
        }
      }

      // Final check for encryption key availability
      if (!encryptionKey) {
        Logger.error('❌ No encryption key available');
        Logger.info('💡 Please setup encryption key:');
        Logger.info('   • Generate new key: npm run cli generate-qr --setup-key');
        Logger.info('   • Manual sync from CF: npm run cli generate-qr --sync-key-from-cf');
        Logger.info('   • Check key status: npm run cli generate-qr --show-key-status');
        process.exit(1);
      }

      Logger.success('✅ Encryption key retrieved successfully');

      // Build QR style configuration with preset
      const qrStyleConfig: QRStyleConfig = {
        mode: 'styled', // Always use styled mode (presets handle everything)
        width: 512,
        height: 512,
        styled: {
          preset: (options as any).styledPreset || 'standard',
        },
      };

      // Add logo to style config if provided
      if ((options as any).logoPath) {
        qrStyleConfig.image = (options as any).logoPath;
      }

      // Generate PDF
      Logger.info('🎨 Generating professional PDF with encrypted QR codes...');

      const pdfPath = await PDFGenerator.generateQRCodePDF(
        evses,
        {
          outputPath,
          format: options.format as 'A4' | 'Letter' | 'Sticker',
          title: options.title || 'E-Mobility Quick Start',
          subtitle: 'Scan QR Code to Start Charging',
          footer: 'Scan with your E-Mobility app to start a charging session',
          // Sticker-specific options
          stickerTitle: (options as any).stickerTitle,
          logoPath: (options as any).logoPath,
          // QR Style configuration
          qrStyleConfig,
        },
        encryptionKey || undefined,
      );

      // Get file size for display
      const stats = await fs.stat(pdfPath);
      const fileSizeKB = Math.round(stats.size / 1024);

      Logger.success(`✅ PDF generated successfully!`);
      Logger.info(`📄 File: ${chalk.cyan(pdfPath)}`);
      Logger.info(`📏 Size: ${chalk.green(fileSizeKB)} KB`);
      Logger.info(`📊 Pages: ${chalk.green(totalQRCodes)} (one QR code per EVSE)`);

      // Show summary
      Logger.info('\n📈 Generation Summary:');
      Logger.info(`   • EVSEs processed: ${chalk.green(evses.length)}`);
      Logger.info(`   • QR codes generated: ${chalk.green(totalQRCodes)} (one per EVSE)`);
      Logger.info(`   • PDF format: ${chalk.cyan(options.format)}`);
      if (options.format === 'Sticker') {
        const pagesNeeded = Math.ceil(totalQRCodes / 16);
        Logger.info(`   • Stickers per page: ${chalk.green('16')} (5×7cm each)`);
        Logger.info(`   • Total pages: ${chalk.green(pagesNeeded)}`);
        if ((options as any).stickerTitle) {
          Logger.info(`   • Sticker title: ${chalk.cyan((options as any).stickerTitle)}`);
        }
        if ((options as any).logoPath) {
          Logger.info(`   • Logo: ${chalk.cyan((options as any).logoPath)}`);
        }
      }

      // Show next steps
      Logger.info('\n🎯 Next Steps:');
      Logger.info(`   1. Review the generated PDF: ${chalk.cyan(pdfPath)}`);
      Logger.info('   2. Print the PDF for customer distribution');
      Logger.info('   3. Customers can scan QR codes with your E-Mobility app');
      Logger.info('   4. QR codes will trigger the startChargingSession action');

      // Disconnect from CDS
      await cdsClient.disconnect();
    } catch (error) {
      Logger.error(
        `❌ QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // Show troubleshooting tips
      Logger.info('\n🔧 Troubleshooting:');
      Logger.info('   • Ensure the CDS server is running on port 4004');
      Logger.info('   • Start the server with: npm run cli start');
      Logger.info('   • Check server logs for any errors');

      process.exit(1);
    }
  },
};

/**
 * Handle setup key operation
 */
async function handleSetupKey(): Promise<void> {
  try {
    Logger.info('🎲 Generating new QR encryption key...');

    const newKey = generateEncryptionKey();
    const configPath = getProjectPrivateConfigPath();

    await updateCdsrcPrivate(configPath, { QR_ENCRYPTION_KEY: newKey });

    Logger.success('✅ New QR encryption key generated and saved locally');
    Logger.info(`🔑 Key: ${maskKey(newKey)}`);
    Logger.info(`📁 Saved to: ${configPath}`);
    Logger.info('\n🔄 Next steps:');
    Logger.info('   • Restart your CDS server to load the new key: npm start');
    Logger.info('   • Upload to CF service: npm run cli generate-qr --sync-key-to-cf');
  } catch (error) {
    Logger.error(`❌ Setup failed: ${(error as Error).message}`);
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
 * Handle sync key to CF operation
 */
async function handleSyncKeyToCF(serviceName: string): Promise<void> {
  try {
    Logger.info('📤 Synchronizing QR encryption key to Cloud Foundry...');
    Logger.info('=======================================================');
    Logger.info('');

    const configPath = getProjectPrivateConfigPath();
    const localKey = await getLocalKey(configPath);

    if (!localKey) {
      Logger.error('❌ No local key found in .cdsrc-private.json');
      Logger.info('💡 Use --setup-key to generate a new key first');
      process.exit(1);
    }

    // Check if logged in to CF
    if (!checkCfLogin()) {
      Logger.error('❌ Not logged in to Cloud Foundry');
      Logger.info('Please log in first:');
      Logger.info('   cf login -a <API_ENDPOINT> -o <ORG> -s <SPACE>');
      process.exit(1);
    }

    Logger.success('✅ Logged in to Cloud Foundry');

    // Show current target
    try {
      const target = execSync('cf target', { encoding: 'utf8' });
      Logger.info('Current CF target:');
      Logger.info(target);
    } catch (_error) {
      Logger.warn('⚠️  Could not retrieve CF target information');
    }

    Logger.info('');

    // Ask for confirmation before uploading the key
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Upload QR encryption key to CF service '${serviceName}' in this environment?`,
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❌ Key upload cancelled');
      return;
    }

    Logger.info('');
    Logger.info('📤 Uploading local key to CF service...');
    Logger.info(`🔑 Key: ${maskKey(localKey)}`);
    Logger.info(`📡 Service: ${serviceName}`);

    // Check if CF key already exists and is different
    try {
      const existingCfKey = await getCFServiceKey(serviceName);
      if (existingCfKey && existingCfKey !== localKey) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `CF service already has a different key. Overwrite with local key?`,
            default: false,
          },
        ]);

        if (!confirm) {
          Logger.info('❌ Upload cancelled');
          return;
        }
      }
    } catch (_error) {
      // CF key doesn't exist or can't be retrieved, proceed with upload
      Logger.info('🆕 CF service key not found, will create new one');
    }

    const success = await pushKeyToCF(localKey, serviceName);

    if (success) {
      Logger.success('✅ Key uploaded to CF service successfully');
      Logger.info(`📡 Service: ${serviceName}`);
      Logger.info('\n🔄 Next step:');
      Logger.info('   • Restart CF app to apply: cf restart driver-app-srv');
    } else {
      Logger.error('❌ Failed to upload key to CF service');
      process.exit(1);
    }
  } catch (error) {
    Logger.error(`❌ Sync to CF failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle sync key from CF operation
 */
async function handleSyncKeyFromCF(serviceName: string): Promise<void> {
  try {
    Logger.info(`📡 Fetching key from CF service: ${serviceName}`);

    const cfKey = await getCFServiceKey(serviceName);

    if (!cfKey) {
      Logger.error(`❌ No key found in CF service: ${serviceName}`);
      Logger.info('💡 Use --sync-key-to-cf to upload a local key first');
      process.exit(1);
    }

    Logger.success('✅ Key retrieved from CF service');
    Logger.info(`🔑 Key: ${maskKey(cfKey)}`);

    const configPath = getProjectPrivateConfigPath();

    // Check if local key already exists and is different
    const existingLocalKey = await getLocalKey(configPath);
    if (existingLocalKey && existingLocalKey !== cfKey) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Local key already exists and is different. Overwrite with CF key?',
          default: false,
        },
      ]);

      if (!confirm) {
        Logger.info('❌ Download cancelled');
        return;
      }
    }

    await updateCdsrcPrivate(configPath, { QR_ENCRYPTION_KEY: cfKey });

    Logger.success('✅ Key saved to local configuration');
    Logger.info(`📁 Saved to: ${configPath}`);
    Logger.info('\n🔄 Next step:');
    Logger.info('   • Restart CDS server to load the new key: npm start');
  } catch (error) {
    Logger.error(`❌ Sync from CF failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
