#!/usr/bin/env node
// `pnpm ship`: the one way to deploy, order from docs/site-plan.md `Ship`. Preview only, until the cutover.
// No skip flag exists. Anything but --dry-run is refused, so no flag can name another Worker.
import fs from 'node:fs';
import path from 'node:path';
import { acquireLock, bin, fail, PRODUCTION_ALLOWED, REAL_DEPLOY_REFUSAL, REAL_DEPLOYS_ALLOWED, ROOT, ShipFailure, walk, WORKER } from './ship/lib.mjs';
import { checkBuiltConfig, checkIndexable, checkNoindex, checkSourceConfig } from './ship/guard.mjs';
import { colourBan, driftCheck, lintGate } from './ship/design-check.mjs';
import { checkBudgets } from './ship/budgets.mjs';
import { checkInBrowser } from './ship/browser-budgets.mjs';
import { checkClaims } from './ship/claims.mjs';
import { checkDevBoots } from './ship/dev-boot.mjs';
import { hashBuild, previewTarget, readPublished, rollbackTo, upload, uploadCommand, writePreviewUrl, writePublished } from './ship/deploy.mjs';
import { sha256, smoke } from './ship/smoke.mjs';
import { prepareImages } from './ship/images.mjs';
import { checkBuiltPages, localWorker, requireParity, runParity } from './ship/parity.mjs';
import { fetchSnapshot } from './ship/fetch.mjs';
import { describeProblems, validateSnapshot } from './ship/validate.mjs';
import { compareSnapshots, loadBaseline, writeReport } from './ship/compare.mjs';
import { readSnapshot } from './ship/fetch.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const production = args.includes('--production');
const approveAt = args.indexOf('--approve');
const approve = approveAt === -1 ? null : (args[approveAt + 1] ?? '');
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

/** Fetch, validate, compare. Returns the snapshot the build may read, or stops the run. */
async function snapshotSteps(published) {
  const { snapshot, hash, file, meta } = await fetchSnapshot();
  const rows = Object.entries(meta.rows).map(([table, count]) => `${table} ${count}`).join(', ');
  report('fetch', 'PASS', `${hash}: ${rows}. ${meta.supabaseRequests} Supabase reads and ${meta.requests - meta.supabaseRequests} rating lookup in ${(meta.ms / 1000).toFixed(1)} s. Rating ${meta.rating?.average ?? 'unavailable'}`);

  const baseline = loadBaseline(published);
  const { problems, notes } = validateSnapshot(snapshot, baseline.snapshot);
  if (problems.length > 0) fail(`The snapshot is broken, so it can't be published or approved. ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n${describeProblems(problems)}`);
  report('validate', 'PASS', `completeness and relationships hold${notes.length > 0 ? `. ${notes.join('. ')}` : ''}`);

  if (approve !== null && approve !== hash) fail(`HELD AGAIN. --approve names ${approve}, but this fetch is ${hash}, so the data has moved on. Read the new report, then approve that hash.`);
  const result = compareSnapshots(baseline.snapshot, snapshot, { baselineNote: baseline.note });
  const approved = result.status === 'held' && approve === hash;
  if (result.status === 'unchanged') {
    report('compare', 'PASS', `identical to baseline ${baseline.hash}`);
    return { hash, file, approved };
  }
  const reportFile = writeReport(result, { hash, baselineHash: baseline.hash, approved });
  if (result.status === 'held' && !approved) {
    fail(`HELD for approval. Snapshot ${hash}:\n${result.reasons.map((reason) => `  ${reason}`).join('\n')}\nRead ${reportFile}. To publish exactly this snapshot: pnpm ship --approve ${hash}`);
  }
  report('compare', 'PASS', `${approved ? 'held, and approved by hash' : 'publishes'}: ${result.changes.length} field changes, ${Object.values(result.added).flat().length} new rows, ${Object.values(result.removed).flat().length} removed. Report: ${reportFile}`);
  return { hash, file, approved };
}

function build(snapshotFile) {
  // A stale build or redirect must never be what the guard reads.
  fs.rmSync(path.join(ROOT, 'dist'), { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, '.wrangler/deploy'), { recursive: true, force: true });
  const result = bin('astro', ['build'], { env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', OPENARABIC_SNAPSHOT: snapshotFile, OPENARABIC_PRODUCTION: production ? '1' : '0' } });
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
    const edge = await smoke(url, { expectedSha: published.indexSha256 ?? null, production: published.production === true });
    lines.push(edge.ok ? 'The edge serves that version again.' : `The edge did not confirm it: ${edge.problems.join('; ')}.`);
  } else {
    lines.push('Not checked at the edge: wrangler gave no preview URL.');
  }
  fail(lines.join('\n'));
}

async function main() {
  const unknown = args.filter((arg, index) => arg !== '--dry-run' && arg !== '--production' && index !== approveAt && (approveAt === -1 || index !== approveAt + 1));
  if (production && !dryRun && !PRODUCTION_ALLOWED) fail('--production is refused before the cutover in Phase 6, on the owner\'s explicit go.');
  if (unknown.length > 0) fail(`Unknown argument: ${unknown.join(' ')}. The only options are --dry-run, --production and --approve <hash>; the Worker name comes from the checked config, and no check can be skipped.`);
  if (approve !== null && !/^[0-9a-f]{64}$/.test(approve)) fail(`--approve needs the full snapshot hash from a held run's report, not "${approve.slice(0, 80)}".`);

  console.log(`pnpm ship${production ? ' --production' : ''}${dryRun ? ' --dry-run: everything except the upload' : ''}\n`);
  acquireLock(`pnpm ship${production ? ' --production' : ''}${dryRun ? ' --dry-run' : ''}`);

  checkSourceConfig(ROOT, production);
  report('guard', 'PASS', `wrangler.jsonc names ${WORKER}, with ${production ? 'at most the one live route' : 'no route and no live domain'}`);
  const published = readPublished();

  const summary = lintGate();
  driftCheck();
  const scanned = colourBan();
  report('design', 'PASS', `lint 0 errors, 0 warnings. ${summary} Tokens match DESIGN.md. No colour literal in DESIGN.md's body or ${scanned} source files`);

  const content = await snapshotSteps(published);

  const images = await prepareImages(readSnapshot(content.hash));
  report('images', 'PASS', `${images.images} article images in the build, ${images.fetched} newly copied${images.missing.length > 0 ? `. Stored but not downloadable, so their articles show no image: ${images.missing.join(', ')}` : ''}`);

  build(content.file);
  report('build', 'PASS', 'astro build, from a clean dist');

  const built = checkBuiltConfig(ROOT, production);
  report('guard, built', 'PASS', `${built.file} names ${built.name}, with ${production ? 'at most the one live route' : 'no route and no live domain'}; wrangler's redirect points at it`);

  const budgets = checkBudgets();
  if (production) checkIndexable(budgets.pages);
  else checkNoindex(budgets.pages);
  // Every page was checked. One line per page type, with its heaviest page.
  const heaviest = new Map();
  for (const fact of budgets.facts) {
    const entry = heaviest.get(fact.type) ?? { ...fact, pages: 0 };
    heaviest.set(fact.type, { route: fact.js >= entry.js ? fact.route : entry.route, type: fact.type, js: Math.max(entry.js, fact.js), css: Math.max(entry.css, fact.css), fontBytes: Math.max(entry.fontBytes, fact.fontBytes), pages: entry.pages + 1 });
  }
  for (const fact of heaviest.values()) {
    report('budgets', 'PASS', `${fact.type}, ${fact.pages} pages, heaviest ${fact.route}: JS ${fact.js} B, CSS ${fact.css} B, fonts ${fact.fontBytes} B; ${budgets.files} files`);
  }
  for (const fact of await checkInBrowser(budgets.pages)) {
    report('budgets, browser', 'PASS', `${fact.route}: ${fact.route.endsWith('opted in') ? `only Google's script, stood in at ${fact.transferred} B` : `no third-party request, ${fact.transferred} B transferred`}, LCP ${fact.lcp} ms, CLS ${fact.cls} (lab)`);
  }

  const claims = checkClaims();
  report('claims', 'PASS', `${claims.phrases} banned phrases absent from ${claims.files} files. ${claims.strings} public strings trace: ${claims.ledger} ledger, ${claims.designed} DESIGN.md, ${claims.draft} draft`);
  for (const item of claims.forPerson) console.log(`[claims] for a person, not machine-checkable: ${item}`);

  const local = await runParity('https://local.test', await localWorker(), { concurrency: 1 });
  const builtPages = checkBuiltPages(ROOT, production);
  requireParity(local, builtPages);
  report('parity', 'PASS', `${local.checked} URLs answer as docs/site-plan.md's table says, on the built Worker and files. ${builtPages.pages} pages have one title and canonical in <head> and the right JSON-LD. sitemap.xml holds ${builtPages.sitemap} URLs, with the data`);

  const dev = await checkDevBoots();
  report('dev runtime', 'PASS', `astro dev answered 200 on / in ${(dev.ms / 1000).toFixed(1)} s, on free port ${dev.port}, from a throwaway copy`);

  // Last look at what would really be uploaded, in case anything changed it since the first.
  checkSourceConfig(ROOT, production);
  const command = uploadCommand(checkBuiltConfig(ROOT, production));
  if (dryRun) {
    report('deploy', 'WOULD RUN', `wrangler ${command.join(' ')}. Not run: no upload`);
    report('smoke', 'WOULD RUN', 'Needs the preview URL an upload returns. Not run');
    report('record', 'WOULD RUN', '.ship/published is untouched');
    console.log(`\nDRY RUN COMPLETE. Worker: ${WORKER}. Routes: ${JSON.parse(fs.readFileSync(path.join(ROOT, built.file), 'utf8')).routes?.map((route) => route.pattern).join(', ') || 'none'}.${production ? ' Production: noindex off.' : ''} Nothing was uploaded.`);
    if (notBuilt.length > 0) console.log(`NOT BUILT, so not passed: ${notBuilt.join(', ')}.`);
    return;
  }
  if (!REAL_DEPLOYS_ALLOWED) fail(REAL_DEPLOY_REFUSAL);

  const buildHash = hashBuild();
  const indexSha256 = sha256(fs.readFileSync(path.join(ROOT, 'dist/client/index.html')));

  uploadBegan = true;
  const deployed = upload(command);
  if (deployed.failed) fail(`${deployed.failed}. .ship/published is unchanged, so the next run retries.`);
  // Wrangler named something else: nothing here may touch that Worker, a rollback least of all.
  if (deployed.name !== WORKER) fail(`STOP AND TELL THE OWNER. Wrangler reports it deployed "${deployed.name}", not ${WORKER}. No rollback was tried. .ship/published is unchanged.`);
  report('deploy', 'PASS', `${WORKER} version ${deployed.version}`);

  const url = previewTarget(deployed.targets, production);
  if (!url) await rollBackAfterFailure(published, null, `wrangler reported targets ${JSON.stringify(deployed.targets)}, not one place this ship can check`);
  writePreviewUrl(url);

  const routes = otherRoutes();
  const checked = await smoke(url, { expectedSha: indexSha256, otherRoutes: routes, production });
  if (!checked.ok) await rollBackAfterFailure(published, url, checked.problems.join('; '));
  report('smoke', 'PASS', `/ is 200 with this build's bytes, X-Robots-Tag: noindex and the meta, no Set-Cookie; ${routes.length} other route types too (try ${checked.attempts})`);

  const edgeParity = await runParity(url, fetch, { headers: true, production });
  if (edgeParity.failures.length > 0) await rollBackAfterFailure(published, url, `URL parity failed on ${edgeParity.failures.length} of ${edgeParity.checked}: ${edgeParity.failures.slice(0, 5).join('; ')}`);
  report('parity, preview', 'PASS', `${edgeParity.checked} URLs answer as the table says on workers.dev, each ${production ? 'indexable' : 'noindexed'} with no cookie`);

  const previous = published && { ...(published.production && { production: true }), hash: published.hash, hashOf: published.hashOf, buildHash: published.buildHash, workerVersion: published.workerVersion, indexSha256: published.indexSha256, publishedAt: published.publishedAt };
  writePublished({ worker: WORKER, ...(production && { production: true }), hash: content.hash, hashOf: 'snapshot', buildHash, ...(content.approved && { approved: true }), workerVersion: deployed.version, indexSha256, publishedAt: new Date().toISOString(), ...(previous && { previous }) });
  report('record', 'PASS', `.ship/published holds version ${deployed.version}, snapshot ${content.hash}`);

  console.log(`\nSHIPPED${production ? ' PRODUCTION' : ' to preview'} in ${((Date.now() - started) / 1000).toFixed(1)} s. ${url}`);
  if (notBuilt.length > 0) console.log(`NOT BUILT, so not passed: ${notBuilt.join(', ')}.`);
}

main().catch((error) => {
  if (!(error instanceof ShipFailure)) throw error;
  console.error(uploadBegan ? `\nSHIP STOPPED, after the upload began.\n${error.message}` : `\nSHIP STOPPED. Nothing was uploaded.\n${error.message}`);
  process.exit(1);
});
