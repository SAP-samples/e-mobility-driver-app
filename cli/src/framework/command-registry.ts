// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { Command } from 'commander';

/**
 * Base command interface - all commands should implement this
 */
export interface BaseCommand {
  name: string;
  description: string;
  action: (options?: any) => Promise<void> | void;
  options?: CommandOption[];
}

/**
 * Command option interface
 */
export interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: string | boolean;
}

/**
 * Command registry - simple home-made framework for easy command addition
 */
export class CommandRegistry {
  private commands: BaseCommand[] = [];

  /**
   * Register a new command
   */
  register(command: BaseCommand): void {
    this.commands.push(command);
  }

  /**
   * Setup all registered commands with commander
   */
  setupCommands(program: Command): void {
    this.commands.forEach((cmd) => {
      const command = program
        .command(cmd.name)
        .description(cmd.description)
        .action((...args) => {
          // Extract options from the command object (last argument)
          const command = args[args.length - 1];
          const options = command.opts();
          return cmd.action(options);
        });

      // Add options if any
      if (cmd.options) {
        cmd.options.forEach((option) => {
          command.option(option.flags, option.description, option.defaultValue);
        });
      }
    });
  }

  /**
   * Get all registered commands
   */
  getCommands(): BaseCommand[] {
    return [...this.commands];
  }
}

/**
 * Global command registry instance
 */
export const commandRegistry = new CommandRegistry();
