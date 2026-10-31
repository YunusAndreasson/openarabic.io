#!/usr/bin/env node
// `pnpm ship:rollback`: restores the previous version of openarabic-site and nothing else.
// The name is fixed here and the version comes from .ship/published, never from an argument.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { acquireLock, fail, REAL_DEPLOY_REFUSAL, REAL_DEPLOYS_ALLOWED, ROOT, ShipFailure, WORKER } from './ship/lib.mjs';
import { checkSourceConfig } from './ship/guard.mjs';

const VERSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function main() {
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) fail(`Unknown argument: ${unknown.join(' ')}. The only option is --dry-run; this command only ever acts on ${WORKER}.`);

  acquireLock(`pnpm ship:rollback${dryRun ? ' --dry-run' : ''}`);
  checkSourceConfig();
  console.log(`[guard] PASS: wrangler.jsonc names ${WORKER}, with no route and no live domain`);

  const file = path.join(ROOT, '.ship/published');
  if (!fs.existsSync(file)) fail('.ship/published does not exist, so there is no recorded version to roll back to.');
  const published = JSON.parse(fs.readFileSync(file, 'utf8'));
  const target = published.previous;
  if (!target?.workerVersion || !target?.hash) fail('.ship/published records no previous version and hash.');
  if (!VERSION.test(target.workerVersion)) fail(`.ship/published holds "${target.workerVersion}", which isn't a Worker version id.`);
  if (published.worker !== WORKER) fail(`.ship/published is for "${published.worker}", not ${WORKER}.`);

  const command = ['rollback', target.workerVersion, '--name', WORKER, '--yes', '--message', `pnpm ship:rollback to ${target.hash}`];
  if (dryRun) {
    console.log(`[rollback] WOULD RUN: wrangler ${command.join(' ')}`);
    console.log(`[record] WOULD RUN: .ship/published back to hash ${target.hash}`);
    console.log('\nDRY RUN COMPLETE. Nothing changed.');
    return;
  }
  if (!REAL_DEPLOYS_ALLOWED) fail(REAL_DEPLOY_REFUSAL);

  const result = spawnSync(path.join(ROOT, 'node_modules/.bin/wrangler'), command, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) fail('wrangler rollback failed. .ship/published is unchanged.');
  fs.writeFileSync(file, `${JSON.stringify({ worker: WORKER, ...target, rolledBackAt: new Date().toISOString() }, null, 2)}\n`);
  console.log(`Rolled back ${WORKER} to ${target.workerVersion}, hash ${target.hash}.`);
}

try {
  main();
} catch (error) {
  if (!(error instanceof ShipFailure)) throw error;
  console.error(`\nROLLBACK STOPPED. Nothing changed.\n${error.message}`);
  process.exit(1);
}
