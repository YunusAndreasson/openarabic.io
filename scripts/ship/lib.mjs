import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const WORKER = 'openarabic-site';
export const LIVE_WORKER = 'openarabic-web';
export const LIVE_DOMAIN = 'openarabic.io';

// On since task 1.3, under D16: the noindexed workers.dev preview only. The off switch for every upload and rollback.
export const REAL_DEPLOYS_ALLOWED = true;
// The owner's go, D15: docs/decisions/2026-11-01-owner-go.md. The owner runs the production ship.
export const PRODUCTION_ALLOWED = true;
export const REAL_DEPLOY_REFUSAL = 'Real deploys are switched off in scripts/ship/lib.mjs. Use --dry-run.';

/** A check that stops the run. The message is what the owner reads. */
export class ShipFailure extends Error {}

export const fail = (message) => {
  throw new ShipFailure(message);
};

export const rel = (file) => path.relative(ROOT, file);

export function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function bin(name, args, options = {}) {
  return spawnSync(path.join(ROOT, 'node_modules/.bin', name), args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', WRANGLER_SEND_METRICS: 'false' },
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

const LOCK = path.join(ROOT, '.ship/lock');

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/** Refuses a second run and names the first. A lock left by a crash is never taken over silently. */
export function acquireLock(command) {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  try {
    fs.writeFileSync(
      LOCK,
      `${JSON.stringify({ command, pid: process.pid, started: new Date().toISOString() })}\n`,
      { flag: 'wx' },
    );
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let first = {};
    try {
      first = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
    } catch {
      // Unreadable lock: still a lock.
    }
    const who = `"${first.command ?? 'unknown'}", pid ${first.pid ?? 'unknown'}, started ${first.started ?? 'unknown'}`;
    fail(
      first.pid && !isAlive(first.pid)
        ? `Refusing to start: .ship/lock names ${who}, which is no longer running. If it crashed, check its state, then delete .ship/lock.`
        : `Refusing to start: another run holds .ship/lock: ${who}.`,
    );
  }
  const release = () => fs.rmSync(LOCK, { force: true });
  process.on('exit', release);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => process.exit(1));
  }
  return release;
}
