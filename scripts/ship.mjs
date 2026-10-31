#!/usr/bin/env node
// `pnpm ship`: the one way to deploy, order from docs/site-plan.md `Ship`.
// No skip flag exists. Anything but --dry-run is refused, so no flag can name another Worker.
import fs from 'node:fs';
import path from 'node:path';
import { acquireLock, bin, fail, REAL_DEPLOY_REFUSAL, REAL_DEPLOYS_ALLOWED, ROOT, ShipFailure, WORKER } from './ship/lib.mjs';
import { checkBuiltConfig, checkNoindex, checkSourceConfig } from './ship/guard.mjs';
import { colourBan, driftCheck, lintGate } from './ship/design-check.mjs';
import { checkBudgets } from './ship/budgets.mjs';
import { checkInBrowser } from './ship/browser-budgets.mjs';
import { checkClaims } from './ship/claims.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const results = [];
const notBuilt = [];

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

async function main() {
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.includes('--production')) fail('--production is refused before the cutover in Phase 6, on the owner\'s explicit go.');
  if (unknown.length > 0) fail(`Unknown argument: ${unknown.join(' ')}. The only option is --dry-run; the Worker name comes from the checked config, and no check can be skipped.`);

  console.log(`pnpm ship${dryRun ? ' --dry-run: everything except the upload' : ''}\n`);
  acquireLock(`pnpm ship${dryRun ? ' --dry-run' : ''}`);

  checkSourceConfig();
  report('guard', 'PASS', `wrangler.jsonc names ${WORKER}, with no route and no live domain`);

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

  // The stubs may stand only while there is nothing for them to protect.
  const extra = budgets.pages.filter((page) => path.basename(page) !== 'index.html' || path.dirname(page) !== path.join(ROOT, 'dist/client'));
  if (extra.length > 0) {
    fail(`The build has pages beyond the placeholder (${path.relative(ROOT, extra[0])}), but ${notBuilt.join(', ')} aren't built. Phase 2 fills them first.`);
  }

  // Last look at what would really be uploaded, in case anything changed it since the first.
  checkSourceConfig();
  checkBuiltConfig();
  const command = ['deploy', '--name', WORKER];
  if (dryRun) {
    report('deploy', 'WOULD RUN', `wrangler ${command.join(' ')}. Not run: no upload`);
    stub('smoke', '1.3 and 2.8', 'Needs a preview URL.');
    stub('record', '2.8', '.ship/published is untouched.');
    console.log(`\nDRY RUN COMPLETE. Worker: ${WORKER}. Routes: none. Nothing was uploaded.`);
    console.log(`NOT BUILT, so not passed: ${notBuilt.join(', ')}.`);
    return;
  }
  if (!REAL_DEPLOYS_ALLOWED) fail(REAL_DEPLOY_REFUSAL);
  fail('The deploy, smoke and record steps are built in tasks 1.3 and 2.8.');
}

main().catch((error) => {
  if (!(error instanceof ShipFailure)) throw error;
  console.error(`\nSHIP STOPPED. Nothing was uploaded.\n${error.message}`);
  process.exit(1);
});
