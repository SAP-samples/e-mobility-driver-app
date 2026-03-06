// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { spawn } from 'child_process';
import path from 'path';

import chalk from 'chalk';

import { BaseCommand } from '../framework/command-registry';
import { Logger } from '../utils/logger';

import { configCommand } from './config';

/**
 * Find the project root directory
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();

  if (currentDir.endsWith('/cli')) {
    currentDir = path.dirname(currentDir);
  }

  return currentDir;
}

/**
 * Start development servers for both backend and frontend
 */
async function startDevelopment(options?: {
  profile?: string;
  debug?: boolean;
  debugPort?: number;
}): Promise<void> {
  try {
    const projectRoot = findProjectRoot();
    const profile = options?.profile || 'hybrid';
    const debug = options?.debug || false;
    const debugPort = options?.debugPort || 9229;

    Logger.info('🚀 Starting development servers...');
    Logger.info(chalk.cyan('📦 Backend: CAP server'));
    Logger.info(chalk.cyan('🎨 Frontend: Vue.js app'));

    if (profile) {
      Logger.info(chalk.magenta(`🔧 Using profile: ${profile}`));
    }

    if (debug) {
      Logger.info(chalk.yellow(`🐛 Backend debug mode enabled on port ${debugPort}`));
      Logger.info(chalk.gray(`   Attach your IDE debugger to localhost:${debugPort}`));
    }

    Logger.info('');

    // Prepare environment with profile
    const env: Record<string, string> = {
      ...process.env,
      FORCE_COLOR: 'true',
    };

    // Prepare backend command args with exclusions for frontend files
    const backendArgs = ['watch', '--profile', profile];
    if (debug) {
      // Add Node.js debug flags for the spawned CDS process
      env.NODE_OPTIONS = `--inspect=${debugPort}`;
    }

    // Start backend server with prefixed output
    Logger.info(chalk.blue(`🔵 Starting backend server${debug ? ' (debug mode)' : ''}...`));
    const backendProcess = spawn('cds-ts', backendArgs, {
      cwd: projectRoot,
      env,
    });

    // Start frontend server with prefixed output
    Logger.info(chalk.green('🟢 Starting frontend server...'));
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, 'app', 'driver-vue'),
      env: { ...process.env, FORCE_COLOR: 'true' },
    });

    // Prefix backend output
    if (backendProcess.stdout) {
      backendProcess.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line: string) => line.trim());
        lines.forEach((line: string) => {
          console.log(chalk.blue('[BACKEND]'), line);
        });
      });
    }

    if (backendProcess.stderr) {
      backendProcess.stderr.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line: string) => line.trim());
        lines.forEach((line: string) => {
          console.error(chalk.red('[BACKEND-ERR]'), line);
        });
      });
    }

    // Prefix frontend output
    if (frontendProcess.stdout) {
      frontendProcess.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line: string) => line.trim());
        lines.forEach((line: string) => {
          console.log(chalk.green('[FRONTEND]'), line);
        });
      });
    }

    if (frontendProcess.stderr) {
      frontendProcess.stderr.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line: string) => line.trim());
        lines.forEach((line: string) => {
          console.error(chalk.yellow('[FRONTEND-WARN]'), line);
        });
      });
    }

    // Handle process termination
    const cleanup = () => {
      Logger.info('\n🛑 Stopping development servers...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Handle process errors
    backendProcess.on('error', (error) => {
      Logger.error('❌ Backend server error:', error.message);
    });

    frontendProcess.on('error', (error) => {
      Logger.error('❌ Frontend server error:', error.message);
    });

    // Keep the process alive
    await new Promise(() => {});
  } catch (error) {
    Logger.error(
      '❌ Failed to start development servers:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

/**
 * Start only the backend server (for debugging)
 */
async function startBackendOnly(options?: {
  profile?: string;
  debug?: boolean;
  debugPort?: number;
}): Promise<void> {
  try {
    const projectRoot = findProjectRoot();
    const profile = options?.profile || 'hybrid';
    const debug = options?.debug || false;
    const debugPort = options?.debugPort || 9229;

    Logger.info('🚀 Starting backend server only...');
    Logger.info(chalk.cyan('📦 Backend: CAP server'));

    if (profile) {
      Logger.info(chalk.magenta(`🔧 Using profile: ${profile}`));
    }

    if (debug) {
      Logger.info(chalk.yellow(`🐛 Debug mode enabled on port ${debugPort}`));
      Logger.info(chalk.gray(`   Attach your IDE debugger to localhost:${debugPort}`));
      Logger.info(
        chalk.gray(`   VS Code: Debug > Attach to Node Process > localhost:${debugPort}`),
      );
      Logger.info(
        chalk.gray(`   IntelliJ: Run > Attach to Node.js/Chrome > localhost:${debugPort}`),
      );
    }

    Logger.info('');

    // Prepare environment with profile
    const env: Record<string, string> = {
      ...process.env,
      FORCE_COLOR: 'true',
    };

    if (debug) {
      env.NODE_OPTIONS = `--inspect=${debugPort}`;
    }

    // Start backend server only with exclusions for frontend files
    Logger.info(chalk.blue(`🔵 Starting backend server${debug ? ' (debug mode)' : ''}...`));
    const backendProcess = spawn('cds-ts', ['watch', '--profile', profile], {
      cwd: projectRoot,
      stdio: 'inherit',
      env,
    });

    // Handle process termination
    const cleanup = () => {
      Logger.info('\n🛑 Stopping backend server...');
      backendProcess.kill();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Handle process errors
    backendProcess.on('error', (error) => {
      Logger.error('❌ Backend server error:', error.message);
    });

    // Keep the process alive
    await new Promise(() => {});
  } catch (error) {
    Logger.error(
      '❌ Failed to start backend server:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

/**
 * Start with configuration
 */
async function startWithConfig(): Promise<void> {
  Logger.info('🔧 Running configuration first...');
  await configCommand.action();
  Logger.info('');
  await startDevelopment();
}

/**
 * Start command - intuitive development server startup
 */
export const startCommand: BaseCommand = {
  name: 'start',
  description: 'Start both backend and frontend development servers',
  action: async (options: { profile?: string; debug?: boolean; debugPort?: number } = {}) => {
    await startDevelopment({
      profile: options.profile,
      debug: options.debug,
      debugPort: options.debugPort,
    });
  },
  options: [
    {
      flags: '--profile <name>',
      description: 'Profile to use for the CAP server (default: hybrid)',
      defaultValue: 'hybrid',
    },
    {
      flags: '--debug',
      description: 'Enable debug mode for backend server',
      defaultValue: false,
    },
    {
      flags: '--debug-port <port>',
      description: 'Debug port for backend server (default: 9229)',
      defaultValue: '9229',
    },
  ],
};

/**
 * Bootstrap command - complete setup + start
 */
export const bootstrapCommand: BaseCommand = {
  name: 'bootstrap',
  description: 'Configure environment and start development servers',
  action: startWithConfig,
};

/**
 * Backend-only command - for debugging
 */
export const backendCommand: BaseCommand = {
  name: 'backend',
  description: 'Start only the backend server (useful for debugging)',
  action: async (options: { profile?: string; debug?: boolean; debugPort?: number } = {}) => {
    await startBackendOnly({
      profile: options.profile,
      debug: options.debug,
      debugPort: options.debugPort,
    });
  },
  options: [
    {
      flags: '--profile <name>',
      description: 'Profile to use for the CAP server (default: hybrid)',
      defaultValue: 'hybrid',
    },
    {
      flags: '--debug',
      description: 'Enable debug mode for backend server',
      defaultValue: false,
    },
    {
      flags: '--debug-port <port>',
      description: 'Debug port for backend server (default: 9229)',
      defaultValue: '9229',
    },
  ],
};

/**
 * Backend-only start command - for easier debugging
 */
export const backendStartCommand: BaseCommand = {
  name: 'start-backend',
  description: 'Start only the backend development server',
  action: async (options: { profile?: string } = {}) => {
    await startBackendOnly({ profile: options.profile });
  },
  options: [
    {
      flags: '--profile <name>',
      description: 'Profile to use for the CAP server (default: hybrid)',
      defaultValue: 'hybrid',
    },
  ],
};
