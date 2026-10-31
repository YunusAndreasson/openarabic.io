#!/usr/bin/env node
// `pnpm ship:rollback`: restores the previous version of openarabic-site and nothing else.
// The name is fixed here and the version comes from .ship/published, never from an argument.
import { acquireLock, fail, REAL_DEPLOY_REFUSAL, REAL_DEPLOYS_ALLOWED, ShipFailure, WORKER } from './ship/lib.mjs';
import { checkSourceConfig } from './ship/guard.mjs';
import { readPreviewUrl, readPublished, rollbackCommandText, rollbackTo, writePublished } from './ship/deploy.mjs';
import { smoke } from './ship/smoke.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let rolledBack = false;

async function main() {
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) fail(`Unknown argument: ${unknown.join(' ')}. The only option is --dry-run; this command only ever acts on ${WORKER}.`);

  acquireLock(`pnpm ship:rollback${dryRun ? ' --dry-run' : ''}`);
  checkSourceConfig();
  console.log(`[guard] PASS: wrangler.jsonc names ${WORKER}, with no route and no live domain`);

  const published = readPublished();
  if (!published) fail('.ship/published does not exist, so there is no recorded version to roll back to.');
  const target = published.previous;
  if (!target?.workerVersion || !target?.hash) fail('.ship/published records no previous version and hash.');

  const reason = `pnpm ship:rollback to ${target.hash}`;
  if (dryRun) {
    console.log(`[rollback] WOULD RUN: ${rollbackCommandText(target, reason)}`);
    console.log(`[record] WOULD RUN: .ship/published back to hash ${target.hash}`);
    console.log('\nDRY RUN COMPLETE. Nothing changed.');
    return;
  }
  if (!REAL_DEPLOYS_ALLOWED) fail(REAL_DEPLOY_REFUSAL);

  if (!rollbackTo(target, reason)) fail('wrangler rollback failed. .ship/published is unchanged.');
  rolledBack = true;

  const url = readPreviewUrl();
  if (url) {
    const edge = await smoke(url, { expectedSha: target.indexSha256 ?? null });
    if (!edge.ok) fail(`Wrangler rolled back to ${target.workerVersion}, but the edge did not confirm it: ${edge.problems.join('; ')}. .ship/published is unchanged, so it no longer matches. Check before shipping.`);
    console.log(`[smoke] PASS: / is 200 with the bytes of that version, X-Robots-Tag: noindex and the meta, no Set-Cookie (try ${edge.attempts})`);
  } else {
    console.log('[smoke] NOT RUN: .ship/preview-url is missing, so the edge was not checked.');
  }

  writePublished({ worker: WORKER, ...target, rolledBackAt: new Date().toISOString() });
  console.log(`Rolled back ${WORKER} to ${target.workerVersion}, hash ${target.hash}.`);
}

main().catch((error) => {
  if (!(error instanceof ShipFailure)) throw error;
  console.error(rolledBack ? `\nROLLBACK STOPPED, after wrangler rolled back.\n${error.message}` : `\nROLLBACK STOPPED. Nothing changed.\n${error.message}`);
  process.exit(1);
});
