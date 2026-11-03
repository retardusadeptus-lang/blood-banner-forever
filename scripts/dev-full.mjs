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

const api = runCommand(process.execPath, ['guild-loot-api/server.js']);
let frontend;

const apiPort = process.env.API_PORT || process.env.PORT || '4002';

const waitForApi = async () => {
  const deadline = Date.now() + 15000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${apiPort}/api/version`);
      if (response.ok) return;
      lastError = new Error(`API health check returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error(`API did not become ready: ${lastError?.message || 'unknown error'}`);
};

let shuttingDown = false;

const stopAll = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of [frontend, api]) {
    if (child && child.exitCode === null && !child.killed) {
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
  console.error(`Process exited unexpectedly: ${child === frontend ? 'frontend' : 'api (including Discord bot)'} (${reason})`);
  stopAll('SIGTERM');
  process.exit(code ?? 1);
};

try {
  await waitForApi();
  frontend = runCommand(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev']);
} catch (error) {
  console.error(error.message);
  stopAll('SIGTERM');
  process.exit(1);
}

frontend.on('exit', (code, signal) => exitWithStatus(frontend, code, signal));
api.on('exit', (code, signal) => exitWithStatus(api, code, signal));
