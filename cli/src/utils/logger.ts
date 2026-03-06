// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import chalk from 'chalk';

/**
 * Utility functions for CLI output
 */
export class Logger {
  static info(message: string): void {
    console.log(chalk.blue(message));
  }

  static success(message: string): void {
    console.log(chalk.green(message));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(message));
  }

  static warn(message: string): void {
    console.log(chalk.yellow(message));
  }

  static error(message: string, error?: any): void {
    console.error(chalk.red(message));
    if (error) {
      console.error(chalk.gray(error.message || error));
    }
  }

  static highlight(message: string): void {
    console.log(chalk.cyan(message));
  }
}
