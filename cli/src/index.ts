#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { Command } from 'commander';

import { buildCommand } from './commands/build';
import { configCommand } from './commands/config';
import { deployCommand } from './commands/deploy';
import { generateQRCommand } from './commands/generate-qr';
import { installCommand } from './commands/install';
import { listCommand } from './commands/profiles';
import { backendCommand, bootstrapCommand, startCommand } from './commands/start';
import { commandRegistry } from './framework/command-registry';

// Register all commands
commandRegistry.register(buildCommand);
commandRegistry.register(configCommand);
commandRegistry.register(deployCommand);
commandRegistry.register(generateQRCommand);
commandRegistry.register(installCommand);
commandRegistry.register(listCommand);
commandRegistry.register(startCommand);
commandRegistry.register(backendCommand);
commandRegistry.register(bootstrapCommand);

const program = new Command();

program
  .name('driver-cli')
  .description('E-Mobility Driver App CLI - Essential development tools')
  .version('1.0.0');

// Setup all registered commands
commandRegistry.setupCommands(program);

// Display help if no command provided
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
