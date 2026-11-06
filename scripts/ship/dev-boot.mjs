import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fail, ROOT, ShipFailure, TOOL_ENV } from './lib.mjs';

const SOURCES = ['astro.config.mjs', 'package.json', 'tsconfig.json', 'wrangler.jsonc', 'public', 'src'];
const BOOT_LIMIT_MS = 90_000;

/** A port the OS says nobody holds, so a server someone else already runs can never answer for this one. */
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

/** Its own node_modules folder holding links, so Vite's cache lands in the copy and not in the real one. */
function throwawayCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-dev-boot-'));
  for (const entry of SOURCES) fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
  fs.mkdirSync(path.join(dir, 'node_modules'));
  for (const name of fs.readdirSync(path.join(ROOT, 'node_modules'))) {
    if (name !== '.bin' && name !== '.vite') fs.symlinkSync(path.join(ROOT, 'node_modules', name), path.join(dir, 'node_modules', name));
  }
  return dir;
}

const groupAlive = (pid) => {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
};

const signalGroup = (pid, signal) => {
  try {
    process.kill(-pid, signal);
  } catch {
    // Already gone.
  }
};

/**
 * Starts the real dev runtime, workerd included, and needs `/` to answer 200. The build and a dry
 * wrangler upload never start workerd, so a compatibility_date it can't run passes both.
 * It runs from a throwaway copy, because a second dev server in this folder would share .astro,
 * .wrangler/state and node_modules/.vite with one already running here. Only its own process
 * group is ever signalled. --ignore-lock keeps it in the foreground: under an AI agent, Astro
 * otherwise detaches a background server, exits 0 and leaves it running.
 */
export async function checkDevBoots() {
  const dir = throwawayCopy();
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  let output = '';
  let exited = null;
  const child = spawn(path.join(ROOT, 'node_modules/.bin/astro'), ['dev', '--ignore-lock', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: dir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...TOOL_ENV },
  });
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  child.on('exit', (code, signal) => (exited = { code, signal }));

  // A ship killed mid-check still must not leave workerd running.
  const abandon = () => {
    signalGroup(child.pid, 'SIGKILL');
    fs.rmSync(dir, { recursive: true, force: true });
  };
  process.on('exit', abandon);

  const tail = () => output.replace(/\x1b\[[0-9;]*m/g, '').trim().split('\n').slice(-12).join('\n');
  const started = Date.now();
  try {
    let last = 'no answer yet';
    while (Date.now() - started < BOOT_LIMIT_MS) {
      if (exited) fail(`The dev runtime exited before it was ready (code ${exited.code}, signal ${exited.signal}). The site wouldn't start under \`pnpm dev\`.\n${tail()}`);
      try {
        const response = await fetch(`${origin}/`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
        await response.arrayBuffer();
        if (exited) continue;
        if (response.status === 200) return { port, ms: Date.now() - started };
        // A page error is an answer, not a slow start.
        if (response.status >= 500) fail(`The dev runtime started but \`/\` answered ${response.status}.\n${tail()}`);
        last = `\`/\` answered ${response.status}`;
      } catch (error) {
        if (error instanceof ShipFailure) throw error;
        last = error.cause?.code ?? error.name;
      }
      await sleep(250);
    }
    fail(`The dev runtime didn't answer on ${origin} within ${BOOT_LIMIT_MS / 1000} s (${last}).\n${tail()}`);
  } finally {
    signalGroup(child.pid, 'SIGTERM');
    for (let waited = 0; waited < 5_000 && groupAlive(child.pid); waited += 100) await sleep(100);
    process.off('exit', abandon);
    abandon();
  }
}
