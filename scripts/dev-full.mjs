import { spawn } from 'node:child_process';
import process from 'node:process';

const rootDir = process.cwd();
const isWindows = process.platform === 'win32';

const runCommand = (command, args = []) => spawn(command, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env },
  shell: isWindows && command.endsWith('.cmd'),
});

const frontend = runCommand(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev']);
const api = runCommand(process.execPath, ['--env-file=.env', 'guild-loot-api/server.js']);

let shuttingDown = false;

const stopAll = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of [frontend, api]) {
    if (child.exitCode === null && !child.killed) {
      child.kill(signal);
    }
  }
};

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

const exitWithStatus = (child, code, signal) => {
  if (shuttingDown) {
    process.exit(0);
  }

  const reason = signal ? `signal ${signal}` : `code ${code}`;
  console.error(`Process exited unexpectedly: ${child === frontend ? 'frontend' : 'api'} (${reason})`);
  stopAll('SIGTERM');
  process.exit(code ?? 1);
};

frontend.on('exit', (code, signal) => exitWithStatus(frontend, code, signal));
api.on('exit', (code, signal) => exitWithStatus(api, code, signal));
