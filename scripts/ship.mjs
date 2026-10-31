#!/usr/bin/env node
// `pnpm ship`: the one way to deploy, order from docs/site-plan.md `Ship`. Preview only, until the cutover.
// No skip flag exists. Anything but --dry-run is refused, so no flag can name another Worker.
import fs from 'node:fs';
import path from 'node:path';
import { acquireLock, bin, fail, REAL_DEPLOY_REFUSAL, REAL_DEPLOYS_ALLOWED, ROOT, ShipFailure, walk, WORKER } from './ship/lib.mjs';
import { checkBuiltConfig, checkNoindex, checkPlaceholderOnly, checkSourceConfig } from './ship/guard.mjs';
import { colourBan, driftCheck, lintGate } from './ship/design-check.mjs';
import { checkBudgets } from './ship/budgets.mjs';
import { checkInBrowser } from './ship/browser-budgets.mjs';
import { checkClaims } from './ship/claims.mjs';
import { checkDevBoots } from './ship/dev-boot.mjs';
import { hashBuild, previewTarget, readPublished, rollbackTo, upload, uploadCommand, writePreviewUrl, writePublished } from './ship/deploy.mjs';
import { sha256, smoke } from './ship/smoke.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const started = Date.now();
const results = [];
const notBuilt = [];
let uploadBegan = false;

function report(step, status, detail = '') {
  results.push({ step, status, detail });
  console.log(`[${step}] ${status}${detail ? `: ${detail}` : ''}`);
}

function stub(step, task, what) {
  notBuilt.push(step);
  report(step, 'NOT BUILT', `${what} Task ${task}. Not a pass.`);
}

function build() {
  // A stale build or redirect must never be what the guard reads.
  fs.rmSync(path.join(ROOT, 'dist'), { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, '.wrangler/deploy'), { recursive: true, force: true });
  const result = bin('astro', ['build']);
  if (result.status !== 0) fail(`astro build failed:\n${result.stdout}\n${result.stderr}`);
}

/** One of each kind of file besides the page: plan task 1.3 wants the header on every route type. */
function otherRoutes() {
  const client = path.join(ROOT, 'dist/client');
  const routes = walk(client).map((file) => `/${path.relative(client, file)}`);
  return [routes.find((route) => route.startsWith('/_astro/')), routes.find((route) => route.startsWith('/licenses/'))].filter(Boolean);
}

/** Per the plan: back to the recorded version, by explicit name, with `published` left alone. */
async function rollBackAfterFailure(published, url, why) {
  const lines = [`Smoke failed on the new version: ${why}`, '.ship/published is unchanged.'];
  if (!published) {
    lines.push(`Nothing is recorded to roll back to, so the failed version stays on the ${WORKER} preview. It's noindexed; the next good run replaces it.`);
    fail(lines.join('\n'));
  }
  if (!rollbackTo(published, `pnpm ship: smoke failed, back to ${published.hash}`)) {
    lines.push(`AUTOMATIC ROLLBACK FAILED. ${WORKER} is still serving the failed version. Run a new pnpm ship once the cause is fixed.`);
    fail(lines.join('\n'));
  }
  lines.push(`Rolled back ${WORKER} to ${published.workerVersion}, hash ${published.hash}.`);
  if (url) {
    const edge = await smoke(url, { expectedSha: published.indexSha256 ?? null });
    lines.push(edge.ok ? 'The edge serves that version again.' : `The edge did not confirm it: ${edge.problems.join('; ')}.`);
  } else {
    lines.push('Not checked at the edge: wrangler gave no preview URL.');
  }
  fail(lines.join('\n'));
}

async function main() {
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.includes('--production')) fail('--production is refused before the cutover in Phase 6, on the owner\'s explicit go.');
  if (unknown.length > 0) fail(`Unknown argument: ${unknown.join(' ')}. The only option is --dry-run; the Worker name comes from the checked config, and no check can be skipped.`);

  console.log(`pnpm ship${dryRun ? ' --dry-run: everything except the upload' : ''}\n`);
  acquireLock(`pnpm ship${dryRun ? ' --dry-run' : ''}`);

  checkSourceConfig();
  report('guard', 'PASS', `wrangler.jsonc names ${WORKER}, with no route and no live domain`);
  const published = readPublished();

  const summary = lintGate();
  driftCheck();
  const scanned = colourBan();
  report('design', 'PASS', `lint 0 errors, 0 warnings. ${summary} Tokens match DESIGN.md. No colour literal in DESIGN.md's body or ${scanned} source files`);

  stub('fetch', '2.1', 'Reads no Supabase data yet.');
  stub('validate', '2.2', 'Structural validation has nothing to validate yet.');
  stub('compare', '2.2', 'No publish guard or baseline yet.');

  build();
  report('build', 'PASS', 'astro build, from a clean dist');

  const built = checkBuiltConfig();
  report('guard, built', 'PASS', `${built.file} names ${built.name}, with no route and no live domain; wrangler's redirect points at it`);

  const budgets = checkBudgets();
  checkNoindex(budgets.pages);
  for (const fact of budgets.facts) {
    report('budgets', 'PASS', `${fact.route} (${fact.type}): JS ${fact.js} B, CSS ${fact.css} B, fonts ${fact.fontBytes} B; ${budgets.files} files`);
  }
  for (const fact of await checkInBrowser(budgets.pages)) {
    report('budgets, browser', 'PASS', `${fact.route}: no third-party request, ${fact.transferred} B transferred, LCP ${fact.lcp} ms, CLS ${fact.cls} (lab)`);
  }

  const claims = checkClaims();
  report('claims', 'PASS', `${claims.phrases} banned phrases absent from ${claims.files} files. ${claims.strings} public strings trace: ${claims.ledger} ledger, ${claims.designed} DESIGN.md, ${claims.draft} draft`);
  for (const item of claims.forPerson) console.log(`[claims] for a person, not machine-checkable: ${item}`);

  stub('parity', '2.7', 'No URL parity test yet.');
  checkPlaceholderOnly(budgets.pages, notBuilt);
  report('placeholder', 'PASS', `one prerendered page and no Worker code, so ${notBuilt.join(', ')} have nothing to protect yet`);

  const dev = await checkDevBoots();
  report('dev runtime', 'PASS', `astro dev answered 200 on / in ${(dev.ms / 1000).toFixed(1)} s, on free port ${dev.port}, from a throwaway copy`);

  // Last look at what would really be uploaded, in case anything changed it since the first.
  checkSourceConfig();
  const command = uploadCommand(checkBuiltConfig());
  if (dryRun) {
    report('deploy', 'WOULD RUN', `wrangler ${command.join(' ')}. Not run: no upload`);
    report('smoke', 'WOULD RUN', 'Needs the preview URL an upload returns. Not run');
    report('record', 'WOULD RUN', '.ship/published is untouched');
    console.log(`\nDRY RUN COMPLETE. Worker: ${WORKER}. Routes: none. Nothing was uploaded.`);
    console.log(`NOT BUILT, so not passed: ${notBuilt.join(', ')}.`);
    return;
  }
  if (!REAL_DEPLOYS_ALLOWED) fail(REAL_DEPLOY_REFUSAL);

  const hash = hashBuild();
  const indexSha256 = sha256(fs.readFileSync(path.join(ROOT, 'dist/client/index.html')));

  uploadBegan = true;
  const deployed = upload(command);
  if (deployed.failed) fail(`${deployed.failed}. .ship/published is unchanged, so the next run retries.`);
  // Wrangler named something else: nothing here may touch that Worker, a rollback least of all.
  if (deployed.name !== WORKER) fail(`STOP AND TELL THE OWNER. Wrangler reports it deployed "${deployed.name}", not ${WORKER}. No rollback was tried. .ship/published is unchanged.`);
  report('deploy', 'PASS', `${WORKER} version ${deployed.version}`);

  const url = previewTarget(deployed.targets);
  if (!url) await rollBackAfterFailure(published, null, `wrangler reported targets ${JSON.stringify(deployed.targets)}, not one workers.dev preview URL`);
  writePreviewUrl(url);

  const routes = otherRoutes();
  const checked = await smoke(url, { expectedSha: indexSha256, otherRoutes: routes });
  if (!checked.ok) await rollBackAfterFailure(published, url, checked.problems.join('; '));
  report('smoke', 'PASS', `/ is 200 with this build's bytes, X-Robots-Tag: noindex and the meta, no Set-Cookie; ${routes.length} other route types too (try ${checked.attempts})`);

  const previous = published && { hash: published.hash, hashOf: published.hashOf, workerVersion: published.workerVersion, indexSha256: published.indexSha256, publishedAt: published.publishedAt };
  writePublished({ worker: WORKER, hash, hashOf: 'build', workerVersion: deployed.version, indexSha256, publishedAt: new Date().toISOString(), ...(previous && { previous }) });
  report('record', 'PASS', `.ship/published holds version ${deployed.version}, build hash ${hash}`);

  console.log(`\nSHIPPED to preview in ${((Date.now() - started) / 1000).toFixed(1)} s. ${url}`);
  console.log(`NOT BUILT, so not passed: ${notBuilt.join(', ')}.`);
}

main().catch((error) => {
  if (!(error instanceof ShipFailure)) throw error;
  console.error(uploadBegan ? `\nSHIP STOPPED, after the upload began.\n${error.message}` : `\nSHIP STOPPED. Nothing was uploaded.\n${error.message}`);
  process.exit(1);
});
