#!/usr/bin/env node
// `pnpm ship:test`: seeds each failure in docs/site-plan.md Phase 1 and proves `pnpm ship --dry-run`
// stops on it, before any upload. Everything runs in a throwaway copy of the repo, so a seed can't be
// left behind or collide with other work here. The copy's wrangler is a spy, which also proves nothing
// reached it, and every run meets a fake network loaded with --import: the preview, Supabase and the App Store all answer from local
// files, and any other remote host throws. Real wrangler is never called, and no real preview or Supabase request is made.
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, hashOf, TABLES } from './ship/fetch.mjs';
import { compareSnapshots, MAX_TOUCHED_SENTENCES } from './ship/compare.mjs';
import { validateSnapshot } from './ship/validate.mjs';
import { indexSnapshot, loadSnapshot } from '../src/lib/snapshot.mjs';
import { doctor, fixture, fixtureSitemap } from './ship-test/fixture.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COPY = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-ship-test-'));
const SOURCES = ['astro.config.mjs', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'wrangler.jsonc', 'DESIGN.md', 'PRODUCT.md', 'docs/draft-copy.txt', 'docs/research/parity', 'public', 'scripts', 'src', 'vendor'];
const GENERATED = new Set(['node_modules', 'dist', '.astro', '.wrangler', '.ship', 'generated', 'img', 'reader.js']);
const SPY_LOG = path.join(COPY, 'wrangler-spy.log');
const FAKE_NETWORK = path.join(REPO, 'scripts/ship-test/fake-network.mjs');
const REQUEST_LOG = path.join(COPY, 'requests.log');
// Shaped like the real key, and not one: the suite never reads the app's source.
const KEY_SIGNATURE = 'NOTAREALSIGNATUREONLYFORTHETESTS';
const jwt = (role) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role, ref: 'kkmnzbeugdoajtzfjkxg' })).toString('base64url')}.${KEY_SIGNATURE}`;
const RUN_ENV = { NODE_OPTIONS: `--import=${FAKE_NETWORK}`, OPENARABIC_ANON_KEY: jwt('anon') };
const NEW_VERSION = 'aaaaaaaa-2222-4333-8444-555555555555';
const PREVIEW = 'https://openarabic-site.stub.workers.dev';

function hashTree(root, entries) {
  const hash = createHash('sha256');
  const add = (file) => {
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) if (!GENERATED.has(name)) add(path.join(file, name));
    } else {
      hash.update(path.relative(root, file)).update(fs.readFileSync(file));
    }
  };
  for (const entry of entries) if (fs.existsSync(path.join(root, entry))) add(path.join(root, entry));
  return hash.digest('hex');
}

function prepare() {
  for (const entry of SOURCES) fs.cpSync(path.join(REPO, entry), path.join(COPY, entry), { recursive: true });
  // node_modules: real packages, but the copy's own .bin, so its wrangler can be the spy.
  const modules = path.join(COPY, 'node_modules');
  fs.mkdirSync(path.join(modules, '.bin'), { recursive: true });
  for (const name of fs.readdirSync(path.join(REPO, 'node_modules'))) {
    if (name !== '.bin') fs.symlinkSync(path.join(REPO, 'node_modules', name), path.join(modules, name));
  }
  for (const name of fs.readdirSync(path.join(REPO, 'node_modules/.bin'))) {
    if (name !== 'wrangler') fs.copyFileSync(path.join(REPO, 'node_modules/.bin', name), path.join(modules, '.bin', name));
  }
  fs.writeFileSync(path.join(modules, '.bin/wrangler'), `#!/bin/sh
echo "$@" >> "${SPY_LOG}"
case "$1" in
  deploy)
    [ -n "$SPY_DEPLOY_FAIL" ] && exit 1
    printf '{"type":"deploy","version":1,"worker_name":"%s","version_id":"${NEW_VERSION}","targets":["%s"]}\\n' "\${SPY_WORKER:-openarabic-site}" "\${SPY_TARGET:-${PREVIEW}}" >> "$WRANGLER_OUTPUT_FILE_PATH"
    ;;
  rollback)
    [ -n "$SPY_ROLLBACK_FAIL" ] && exit 1
    ;;
esac
exit 0
`, { mode: 0o755 });
}

// What a fetch of the unchanged fake database must give, byte for byte. The rating is 4.96 at the fake store, so 5 once rounded.
const inColumnOrder = (db) => Object.fromEntries(Object.keys(TABLES).map((table) => [table, db[table].map((row) => Object.fromEntries(TABLES[table].map((column) => [column, row[column]])))]));
const asSnapshot = (db) => ({ format: 1, tables: inColumnOrder(db), restricted: ['word_types'], rating: { store: 'us', average: 5 } });
const BASE_BYTES = canonical(asSnapshot(fixture()));
const BASE_HASH = hashOf(BASE_BYTES);

function seedData() {
  fs.writeFileSync(path.join(COPY, 'fake-db.json'), JSON.stringify(fixture()));
  fs.mkdirSync(path.join(COPY, '.ship/snapshots'), { recursive: true });
  fs.writeFileSync(path.join(COPY, `.ship/snapshots/${BASE_HASH}.json`), BASE_BYTES);
  fs.writeFileSync(path.join(COPY, '.ship/baseline'), `${BASE_HASH}\n`);
  // The frozen list as this data would have written it, so the parity table runs in full on the fixture.
  fs.writeFileSync(path.join(COPY, 'docs/research/parity/sitemap-2026-11-01.txt'), `${fixtureSitemap(fixture())}\n`);
}

/** The next fetch reads the fake database with this done to it. */
function writeDb(change) {
  const db = fixture();
  change(db);
  fs.writeFileSync(path.join(COPY, 'fake-db.json'), JSON.stringify(db));
}

const REAL_TREE_BEFORE = hashTree(REPO, SOURCES);
prepare();
seedData();
const PRISTINE = hashTree(COPY, SOURCES);

const at = (file) => path.join(COPY, file);
const read = (file) => fs.readFileSync(at(file), 'utf8');
const write = (file, text) => {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true });
  fs.writeFileSync(at(file), text);
};
const edit = (file, from, to) => {
  const text = read(file);
  if (!text.includes(from)) throw new Error(`Seed target not found in ${file}: ${from}`);
  write(file, text.replace(from, to));
};

function restore() {
  for (const entry of SOURCES) fs.rmSync(at(entry), { recursive: true, force: true });
  for (const entry of SOURCES) fs.cpSync(path.join(REPO, entry), at(entry), { recursive: true });
  fs.rmSync(at('.ship'), { recursive: true, force: true });
  seedData();
  if (hashTree(COPY, SOURCES) !== PRISTINE) throw new Error('Restore failed: the copy differs from the pristine source.');
}

let extraEnv = {};
const run = (script, ...args) => {
  const result = spawnSync('pnpm', ['--silent', script, ...args], { cwd: COPY, encoding: 'utf8', timeout: 180_000, env: { ...process.env, ...RUN_ENV, ...extraEnv } });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};

/** A real run: the checks are real, and the upload and the edge are the stubs. */
const runReal = (script, env = {}, args = []) => {
  if (!read('node_modules/.bin/wrangler').startsWith('#!/bin/sh\necho')) throw new Error('The spy is not installed. Stopping before any wrangler call.');
  const result = spawnSync('pnpm', ['--silent', script, ...args], {
    cwd: COPY,
    encoding: 'utf8',
    timeout: 240_000,
    env: { ...process.env, ...RUN_ENV, ...env },
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};
const spyCalls = () => (fs.existsSync(SPY_LOG) ? fs.readFileSync(SPY_LOG, 'utf8').trim().split('\n') : []);
const publishedNow = () => (fs.existsSync(at('.ship/published')) ? JSON.parse(read('.ship/published')) : null);
const sha = (text) => createHash('sha256').update(text).digest('hex');

const incompressible = (bytes) => randomBytes(bytes).toString('base64');
const seedScript = incompressible(2200);
const PAGE = 'src/pages/index.astro';
const HEADING = '<p class="lede">If you can sound out Arabic script, you can start reading classical texts.</p>';
// A page that isn't home, because the home page has its own limits: docs/decisions/2026-10-31-home-rebuild.md.
const OTHER_PAGE = (head, body = '') => `<!doctype html><html lang="en"><head><meta name="robots" content="noindex, nofollow" /><title>OpenArabic: Read the Classics</title>${head}</head><body>${body}</body></html>`;
const BUILD_HOOK = (change) =>
  `integrations: [generated(), { name: 'seed', hooks: { 'astro:build:done': async () => { const fs = await import('node:fs'); const f = process.cwd() + '/dist/server/wrangler.json'; const c = JSON.parse(fs.readFileSync(f, 'utf8')); ${change}; fs.writeFileSync(f, JSON.stringify(c)); } } }],`;

const results = [];
// `pnpm ship:test --only <regex>`: only the seeded dry runs whose names match, plus every unit and real-run case. The full suite takes about an hour.
const onlyAt = process.argv.indexOf('--only');
const ONLY = onlyAt === -1 ? null : new RegExp(process.argv[onlyAt + 1], 'i');
const skipped = (name) => ONLY !== null && !ONLY.test(name);

function record(name, ok, detail, required = false) {
  results.push({ name, ok, detail, required });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${required ? '[plan] ' : ''}${name}${detail ? `\n       ${detail}` : ''}`);
}

/** The seed must stop the dry run, with this message, before the deploy step, with wrangler untouched. */
function stops(name, seed, expected, { required = false, args = ['--dry-run'], env = {}, inspect = () => true } = {}) {
  if (skipped(name)) return;
  seed();
  extraEnv = env;
  const { status, output } = run('ship', ...args);
  extraEnv = {};
  const reachedDeploy = /^\[deploy\]/m.test(output);
  const spy = fs.existsSync(SPY_LOG);
  const message = output.split('Nothing was uploaded.\n')[1]?.trim().split('\n').slice(0, 2).join(' ') ?? output.trim().slice(-300);
  const ok = status === 1 && expected.test(output) && /SHIP STOPPED\. Nothing was uploaded\./.test(output) && !reachedDeploy && !spy && inspect(output);
  record(name, ok, message, required);
  restore();
}

function passes(name, seed = () => {}, { args = [], env = {}, inspect = () => true, required = false } = {}) {
  if (skipped(name)) return;
  seed();
  extraEnv = env;
  const { status, output } = run('ship', '--dry-run', ...args);
  extraEnv = {};
  const ok = status === 0 && (args.includes('--production') ? /DRY RUN COMPLETE\. Worker: openarabic-site\. Routes: (none|openarabic\.io)\. Production: noindex off\. Nothing was uploaded\./ : /DRY RUN COMPLETE\. Worker: openarabic-site\. Routes: none\. Nothing was uploaded\./).test(output) && !fs.existsSync(SPY_LOG) && inspect(output);
  record(name, ok, ok ? '' : output.slice(-1500), required);
  restore();
}

function rollback(name, seed, args, expected, wantStatus) {
  seed();
  const { status, output } = run('ship:rollback', ...args);
  record(name, status === wantStatus && expected.test(output), output.trim().split('\n').slice(-2).join(' '));
  restore();
}

const VERSION = '11111111-2222-4333-8444-555555555555';
const CURRENT = '99999999-2222-4333-8444-555555555555';
const seedPublished = (over = {}) => () =>
  write('.ship/published', JSON.stringify({ worker: 'openarabic-site', hash: 'bbb', workerVersion: CURRENT, previous: { hash: 'aaa', workerVersion: VERSION }, ...over }));

/** Each thing smoke must catch, one at a time, with no waiting. */
async function smokeUnits() {
  const { smoke } = await import(path.join(REPO, 'scripts/ship/smoke.mjs'));
  const META = '<meta name="robots" content="noindex, nofollow">';
  const edge = ({ status = 200, headers = { 'x-robots-tag': 'noindex' }, body = META, asset = headers } = {}) => async (url) =>
    new URL(url).pathname === '/' ? new Response(body, { status, headers }) : new Response('x', { headers: asset });
  const quick = { attempts: 1, waitMs: 0, expectedSha: sha(META), otherRoutes: ['/_astro/a.css'] };
  const cases = [
    ['Smoke: a good page passes', {}, null],
    ['Smoke: 500 on / fails', { status: 500 }, /answered 500/],
    ['Smoke: a redirect on / fails', { status: 302 }, /answered 302/],
    ['Smoke: no X-Robots-Tag fails', { headers: {} }, /\/ has no "X-Robots-Tag: noindex"/],
    ['Smoke: X-Robots-Tag without noindex fails', { headers: { 'x-robots-tag': 'nofollow' } }, /\/ has no "X-Robots-Tag: noindex"/],
    ['Smoke: no meta fails', { body: '<p></p>' }, /\/ has no noindex meta/],
    ['Smoke: a Set-Cookie fails', { headers: { 'x-robots-tag': 'noindex', 'set-cookie': 'a=1' } }, /\/ sets a cookie/],
    ["Smoke: the previous build's bytes fail", { body: `${META}<p>old</p>` }, /bytes differ/],
    ['Smoke: an asset without the header fails', { asset: {} }, /_astro\/a\.css has no "X-Robots-Tag: noindex"/],
    ['Smoke: an asset with a Set-Cookie fails', { asset: { 'x-robots-tag': 'noindex', 'set-cookie': 'a=1' } }, /_astro\/a\.css sets a cookie/],
  ];
  for (const [name, over, expected] of cases) {
    const result = await smoke(PREVIEW, { ...quick, fetchImpl: edge(over) });
    const text = result.problems.join('; ');
    record(name, expected ? !result.ok && expected.test(text) : result.ok, text);
  }
  const down = await smoke(PREVIEW, { ...quick, fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  record('Smoke: no answer at all fails', !down.ok, down.problems.join('; '));
}

/** The real upload, smoke, record and rollback paths, against the spy and the stubbed edge. */
function realRuns() {
  const previousBody = '<meta name="robots" content="noindex"><p>previous</p>';
  const seedRecorded = () => {
    seedPublished({ indexSha256: sha(previousBody), publishedAt: 'earlier' })();
    write('.ship/preview-url', `${PREVIEW}\n`);
  };
  const seedRollback = () => {
    seedPublished({ previous: { hash: 'aaa', workerVersion: VERSION, indexSha256: sha(previousBody) } })();
    write('.ship/preview-url', `${PREVIEW}\n`);
  };
  const unchanged = (before) => JSON.stringify(publishedNow()) === JSON.stringify(before);
  const reset = () => {
    restore();
    fs.rmSync(SPY_LOG, { force: true });
  };

  let result = runReal('ship');
  let calls = spyCalls();
  let after = publishedNow();
  record('Real run, first ever: uploads from the built config, with no --name, then records', result.status === 0 && calls.length === 1 && calls[0] === 'deploy --config dist/server/wrangler.json' && /\[worker\] dist\/server\/wrangler\.json names: openarabic-site/.test(result.output), calls.join(' | ') + (result.status === 0 ? '' : result.output.slice(-800)));
  record('Real run: published holds the snapshot hash, version and time, and no URL', after?.workerVersion === NEW_VERSION && after?.hash === BASE_HASH && after?.hashOf === 'snapshot' && Boolean(after?.publishedAt) && !JSON.stringify(after).includes('workers.dev') && read('.ship/preview-url').trim() === PREVIEW, JSON.stringify(after));
  reset();

  seedRecorded();
  result = runReal('ship');
  after = publishedNow();
  record('Real run, again: moves the old version to previous', result.status === 0 && after?.workerVersion === NEW_VERSION && after?.previous?.workerVersion === CURRENT && after?.previous?.hash === 'bbb', JSON.stringify(after?.previous));
  reset();

  seedRecorded();
  let before = publishedNow();
  result = runReal('ship', { STUB_EDGE: 'bad-until-rollback', STUB_PREVIOUS_BODY: previousBody });
  calls = spyCalls();
  record('Smoke fails after upload: rolls back the recorded version by explicit name, published untouched, and says so', result.status === 1 && calls[0].startsWith('deploy ') && calls[1]?.startsWith(`rollback ${CURRENT} --name openarabic-site --yes `) && calls.length === 2 && unchanged(before) && /Rolled back openarabic-site to/.test(result.output) && /The edge serves that version again/.test(result.output) && !/Nothing was uploaded/.test(result.output), calls.join(' | '));
  reset();

  result = runReal('ship', { STUB_EDGE: 'no-header' });
  calls = spyCalls();
  record('Smoke fails on the first ever ship: nothing to roll back to, no record, and says so', result.status === 1 && calls.length === 1 && publishedNow() === null && /Nothing is recorded to roll back to/.test(result.output), calls.join(' | '));
  reset();

  seedRecorded();
  before = publishedNow();
  result = runReal('ship', { STUB_EDGE: 'no-header', SPY_ROLLBACK_FAIL: '1' });
  record('Smoke and the rollback both fail: published untouched, and says the failed version is live', result.status === 1 && unchanged(before) && /AUTOMATIC ROLLBACK FAILED/.test(result.output), '');
  reset();

  seedRecorded();
  before = publishedNow();
  result = runReal('ship', { SPY_DEPLOY_FAIL: '1' });
  calls = spyCalls();
  record('A failed upload: published untouched, no rollback, the next run retries', result.status === 1 && calls.length === 1 && unchanged(before) && /next run retries/.test(result.output) && !/Nothing was uploaded/.test(result.output), calls.join(' | '));
  reset();

  seedRecorded();
  before = publishedNow();
  result = runReal('ship', { SPY_WORKER: 'openarabic-web' });
  calls = spyCalls();
  record('Wrangler reports another Worker: no rollback of it, published untouched', result.status === 1 && calls.length === 1 && unchanged(before) && /STOP AND TELL THE OWNER/.test(result.output), calls.join(' | '));
  reset();

  seedRecorded();
  before = publishedNow();
  result = runReal('ship', { SPY_TARGET: 'https://openarabic.io/*' });
  calls = spyCalls();
  record('Wrangler reports a target other than the preview: treated as a failed smoke', result.status === 1 && calls[1]?.startsWith(`rollback ${CURRENT} --name openarabic-site `) && unchanged(before), calls.join(' | '));
  reset();

  seedRollback();
  result = runReal('ship:rollback', { STUB_EDGE: 'previous', STUB_PREVIOUS_BODY: previousBody });
  calls = spyCalls();
  after = publishedNow();
  record('Rollback, real path: only --name openarabic-site, confirmed at the edge, version and hash restored', result.status === 0 && calls.length === 1 && calls[0].startsWith(`rollback ${VERSION} --name openarabic-site --yes `) && after.workerVersion === VERSION && after.hash === 'aaa', calls.join(' | ') + (result.status === 0 ? '' : result.output.slice(-500)));
  reset();

  seedRollback();
  before = publishedNow();
  result = runReal('ship:rollback', { SPY_ROLLBACK_FAIL: '1' });
  record('Rollback: wrangler fails, published untouched', result.status === 1 && unchanged(before) && /ROLLBACK STOPPED\. Nothing changed\./.test(result.output));
  reset();

  seedRollback();
  before = publishedNow();
  result = runReal('ship:rollback', { STUB_EDGE: 'no-header' });
  record('Rollback: the edge disagrees, published untouched, and says wrangler did act', result.status === 1 && unchanged(before) && /after wrangler rolled back/.test(result.output) && /did not confirm/.test(result.output));
  reset();
}

const heldHash = (output) => output.match(/HELD for approval\. Snapshot ([0-9a-f]{64})/)?.[1];
const reportOf = (output) => {
  const file = output.match(/Read (\.ship\/reports\/[0-9a-f]{64}\.md)/)?.[1] ?? output.match(/Report: (\.ship\/reports\/[0-9a-f]{64}\.md)/)?.[1];
  return file ? read(file) : '';
};
const fetchedHash = (output) => output.match(/\[fetch\] PASS: ([0-9a-f]{64})/)?.[1];

/** Plan task 2.1: the fetch, through the real command, against the fake database. */
function fetchCases() {
  // Fails before the compare, so none of these reach the build.
  const failing = [
    ['A truncated page fails', 'truncated:sentence_words', /read \d+ rows against an exact count of \d+: a truncated page/, true],
    ['A repeated page fails', 'repeated:article_sentences', /a repeated or out-of-order page/],
    ['A deleted table fails', 'gone:articles', /articles doesn't exist on the server \(404\): a deleted table/, true],
    ['A deleted word_types fails, unlike a signed-in-only one', 'gone:word_types', /word_types doesn't exist on the server/],
    ['A table emptied with no error fails', 'emptied:roots', /roots returned 0 rows with no error/],
    ['A refused read is a permission finding, not worked around', 'refused:articles', /PERMISSION FINDING: the public key is refused on articles \(401\)/],
    ['A server error on a page fails', 'server-error:authors', /Fetch failed on authors: 500/],
    ['A dropped column fails', 'dropped-column:roots', /not the expected set/],
    ['A count that moves twice fails', 'moving:categories', /exact count went from \d+ to \d+ during the fetch, twice/],
  ];
  for (const [name, mode, expected, required = false] of failing) stops(name, () => {}, expected, { required, env: { STUB_DB: mode }, inspect: (output) => !/^\[build\]/m.test(output) });
  stops('A service key is refused before any request', () => {}, /its role is "service_role", and only the public anon key/, { env: { OPENARABIC_ANON_KEY: jwt('service_role'), STUB_LOG: REQUEST_LOG }, inspect: () => !fs.existsSync(REQUEST_LOG) });
  stops('A key for another project is refused', () => {}, /it's for another project/, { env: { OPENARABIC_ANON_KEY: `a.${Buffer.from(JSON.stringify({ role: 'anon', ref: 'other' })).toString('base64url')}.b` } });

  const unchanged = (output) => fetchedHash(output) === BASE_HASH && /\[compare\] PASS: identical to baseline/.test(output);
  passes('A count that moves once retries, and gives the same hash', () => {}, { env: { STUB_DB: 'moved-once:categories' }, inspect: unchanged });
  passes('word_types refused outright is handled like word_types empty', () => {}, { env: { STUB_DB: 'refused:word_types' }, inspect: unchanged });

  // Two fetches, real pacing, every request logged.
  fs.rmSync(REQUEST_LOG, { force: true });
  extraEnv = { STUB_REAL_PACING: '1', STUB_LOG: REQUEST_LOG };
  const first = run('ship', '--dry-run');
  const log = fs.readFileSync(REQUEST_LOG, 'utf8').trim().split('\n').map((line) => line.split(' '));
  extraEnv = {};
  const second = run('ship', '--dry-run');
  record('Two fetches of unchanged data give the same hash', first.status === 0 && second.status === 0 && fetchedHash(first.output) === fetchedHash(second.output) && fetchedHash(first.output) === BASE_HASH, fetchedHash(first.output), true);
  const gaps = log.slice(1).map((line, index) => Number(line[0]) - Number(log[index][0]));
  record('Real pacing: at most 2 requests a second, across the whole fetch', gaps.length > 20 && Math.min(...gaps) >= 500, `${log.length} requests, smallest gap ${Math.min(...gaps)} ms`);
  record('Only GET and HEAD reach Supabase, each with the key in a header', log.every(([, method]) => method === 'GET' || method === 'HEAD') && log.filter((line) => line[2].includes('/rest/v1/')).every((line) => line[3] === 'key=sent') && !log.some((line) => line[2].includes('apikey=')), `${log.length} requests`);
  const forSentences = log.filter((line) => line[2].includes('/rest/v1/article_sentences'));
  const pageIds = forSentences.filter((line) => line[1] === 'GET').map((line) => Number(line[2].match(/id=gt\.(\d+)/)[1]));
  record('Keyset order by primary key, with a count read before and after each table', forSentences[0][1] === 'HEAD' && forSentences.at(-1)[1] === 'HEAD' && forSentences.filter((line) => line[1] === 'HEAD').length === 2 && pageIds[0] === 0 && pageIds.every((id, index) => index === 0 || id > pageIds[index - 1]) && forSentences.every((line) => line[1] === 'HEAD' || /order=id\.asc&limit=500/.test(line[2])), `pages after ${pageIds.join(', ')}`);
  const saved = at(`.ship/snapshots/${BASE_HASH}.json`);
  record('The snapshot is named by the hash of its bytes, and holds the rating and no key', hashOf(fs.readFileSync(saved)) === BASE_HASH && !fs.readFileSync(saved, 'utf8').includes(KEY_SIGNATURE) && JSON.parse(fs.readFileSync(saved, 'utf8')).rating.average === 5);
  record('The key appears in no output, snapshot or report', ![first.output, second.output, fs.readFileSync(REQUEST_LOG, 'utf8')].some((text) => text.includes(KEY_SIGNATURE)));
  restore();

  // A new file really is read-only.
  writeDb(doctor.spikeEdit);
  const edited = run('ship', '--dry-run');
  const editedFile = at(`.ship/snapshots/${fetchedHash(edited.output)}.json`);
  record('A newly saved snapshot is read-only', (fs.statSync(editedFile).mode & 0o222) === 0, (fs.statSync(editedFile).mode & 0o777).toString(8));
  restore();

  passes('A failed rating lookup renders nothing, and is reported as a change, not a failure', () => {}, { env: { STUB_RATING: 'fail' }, inspect: (output) => /Rating unavailable/.test(output) && /\| rating \| us \| average \| 5 \| null \|/.test(reportOf(output)) });
  stops('A baseline changed on disk stops the run', () => {
    fs.chmodSync(at(`.ship/snapshots/${BASE_HASH}.json`), 0o644);
    fs.appendFileSync(at(`.ship/snapshots/${BASE_HASH}.json`), ' ');
  }, /doesn't match its name/);
  stops('No baseline at all is held, not published', () => fs.rmSync(at('.ship/baseline')), /HELD for approval[\s\S]*No baseline is recorded/);
  stops('A baseline whose file is gone is held, not published', () => {
    fs.rmSync(at(`.ship/snapshots/${BASE_HASH}.json`), { force: true });
    writeDb(doctor.spikeEdit);
  }, /HELD for approval[\s\S]*isn't on this machine/);
}

/** Plan task 2.2's acceptance line, each through the real command on a doctored local database. */
function guardCases() {
  const held = (name, change, reason, row, required = true) =>
    stops(name, () => writeDb(change), reason, { required, inspect: (output) => /HELD for approval/.test(output) && !/^\[build\]/m.test(output) && row.test(reportOf(output)) });
  const publishes = (name, change, rows, required = true) =>
    passes(name, () => writeDb(change), { required, inspect: (output) => rows.every((row) => row.test(reportOf(output))) });

  stops('A broken foreign key fails', () => writeDb(doctor.brokenForeignKey), /Broken foreign key: sentence_words row \d+ has root_id 99999999/, { required: true });
  let brokenHash;
  writeDb(doctor.brokenForeignKey);
  brokenHash = fetchedHash(run('ship', '--dry-run').output);
  stops('A broken foreign key has no override, even approved by its own hash', () => writeDb(doctor.brokenForeignKey), /can't be published or approved/, { args: ['--dry-run', '--approve', brokenHash] });

  held('500 changed sentences are held', doctor.changedSentences(500), /touches 500 existing sentences or their words, over the limit of 200/, /\| article_sentences \| \d+ \| english \| Sentence \d+\. \| Sentence \d+\. changed \|/);
  held('A changed attribution on an article is held', doctor.attributionOnArticle, /Attribution changed on 1 existing row: articles 10\.author_id/, /\| articles \| 10 \| author_id \| 1 \| 2 \| suspicious \|/);
  held('A changed author name is held', doctor.attributionOnAuthor, /Attribution changed on 1 existing row: authors 1\.name/, /\| authors \| 1 \| name \| Author 1 \| Someone Else \|/);
  held('One changed letter in sentence 7106 is held', doctor.oneLetterIn7106, /Protected content changed: article_sentences 7106\.arabic/, /\| article_sentences \| 7106 \| arabic \| .*كَنْزٍ.* \| .*كَنْسٍ.* \| protected \|/);
  held('A word row of 7106 is protected', (db) => { db.sentence_words.find((w) => w.sentence_id === 7106).english = 'other'; }, /Protected content changed: sentence_words 71060\.english/, /protected/, false);
  held('A sentence added to the story article is protected', (db) => { db.article_sentences.push({ ...db.article_sentences[0], id: 9100, article_id: 559 }); }, /Protected content changed: new article_sentences 9100/, /\(new row\)/, false);
  held('The story author is protected', (db) => { db.authors.find((a) => a.id === 104).name = 'Other'; }, /Protected content changed: authors 104\.name/, /protected/, false);
  held('Unpublishing an article is held', (db) => { db.articles[1].published = false; }, /`published` changed on 1 existing row/, /\| articles \| 20 \| published \| true \| false \|/, false);
  held('A changed media URL is held', (db) => { db.roots[3].audio_url = 'other.mp3'; }, /A media URL changed on 1 existing row: roots \d+\.audio_url/, /audio_url/, false);
  held('A row count falling over 1% is held', (db) => { db.roots.splice(2, 4); }, /roots fell from 300 to 296 rows, over 1%/, /\(removed row\)/, false);
  held('A word type id new since the baseline is held', (db) => { db.sentence_words[0].word_type_id = 77; }, /word_type_id 77, new since the baseline/, /word_type_id/, false);

  publishes('A new article with its words publishes, and is reported', doctor.newArticle, [/Outcome: publish/, /Expected growth: 1 articles, 1 sentences, 2 words, 1 roots/, /\| articles \| 700 \| \(new row\)/, /\| roots \| 20000 \| \(new row\)/]);
  publishes("The spike's edit publishes and appears in the report", doctor.spikeEdit, [/Outcome: publish/, /\| roots \| 14553 \| meaning \| meaning 153 \| Anas Edited \|/, /\| article_sentences \| \d+ \| english \| .* \| .*\[SPIKE-EDIT\] \|/, /\| articles \| 10 \| title \| Title 10 \| Title 10 \[SPIKE-EDIT\] \|/]);

  // Approval.
  writeDb(doctor.oneLetterIn7106);
  const hash = heldHash(run('ship', '--dry-run').output);
  passes('--approve with the held hash lets exactly that snapshot through', () => writeDb(doctor.oneLetterIn7106), { args: ['--approve', hash], required: true, inspect: (output) => /held, and approved by hash/.test(output) && /Outcome: held, approved by hash/.test(reportOf(output)) });
  stops('--approve is held again once the data has moved on', () => writeDb((db) => { doctor.oneLetterIn7106(db); db.articles[0].title = 'Moved'; }), new RegExp(`HELD AGAIN\\. --approve names ${hash}`), { args: ['--dry-run', '--approve', hash], required: true });
  stops('--approve with no hash is refused', () => {}, /--approve needs the full snapshot hash/, { args: ['--dry-run', '--approve'] });
  stops('--approve with a short hash is refused', () => {}, /--approve needs the full snapshot hash/, { args: ['--dry-run', '--approve', 'abc123'] });

  writeDb(doctor.oneLetterIn7106);
  const approvedRun = runReal('ship', {}, ['--approve', hash]);
  const after = publishedNow();
  record('A real approved run records the snapshot, and the next compare starts from it', approvedRun.status === 0 && after?.hash === hash && after?.hashOf === 'snapshot' && after?.approved === true, JSON.stringify(after));
  fs.rmSync(at('.ship/baseline'));
  const next = run('ship', '--dry-run');
  record('After that, the same data is unchanged, with no approval', next.status === 0 && /\[compare\] PASS: identical to baseline/.test(next.output), fetchedHash(next.output));
  restore();
  fs.rmSync(SPY_LOG, { force: true });
}

/** The thresholds and the checks a whole run would be slow to prove one at a time. */
function guardUnits() {
  const base = () => asSnapshot(fixture());
  const edited = (change) => {
    const db = fixture();
    change(db);
    return asSnapshot(db);
  };
  const statusOf = (change) => compareSnapshots(base(), edited(change));
  const at200 = statusOf(doctor.changedSentences(MAX_TOUCHED_SENTENCES));
  const at201 = statusOf(doctor.changedSentences(MAX_TOUCHED_SENTENCES + 1));
  record('Exactly 200 sentences changed publishes, 201 is held', at200.status === 'publish' && at201.status === 'held', `${at200.status}, ${at201.status}`);
  const words = statusOf((db) => { for (const word of db.sentence_words.filter((w) => w.sentence_id < 1300)) word.english += ' x'; });
  record('Changes to words count by their sentence', words.touched === 300 && words.status === 'held', `${words.touched} sentences`);
  const fall = (rows) => statusOf((db) => { db.roots.splice(0, rows); });
  record('A fall of exactly 1% publishes, over it is held', fall(3).status === 'publish' && fall(4).status === 'held', `${fall(3).status}, ${fall(4).status}`);
  record('Mass meaning rewrites are held, one is not', statusOf((db) => { for (const root of db.roots.slice(0, 201)) root.meaning += ' x'; }).status === 'held' && statusOf((db) => { db.roots[0].meaning += ' x'; }).status === 'publish');
  record('Unchanged data is unchanged', compareSnapshots(base(), base()).status === 'unchanged');
  const injected = statusOf((db) => { for (let id = 0; id < 201; id += 1) db.article_sentences.push({ ...db.article_sentences[0], id: 20000 + id, article_id: 10 }); });
  record('Additions to an existing text are not growth, and count against the limit', injected.status === 'held' && injected.growth.sentences === 0, injected.reasons[0]);

  const problemsOf = (change, baseline = null) => validateSnapshot(edited(change), baseline).problems.join(' ');
  const cases = [
    ['HTML in a field', (db) => { db.articles[0].summary = 'A <script>x</script>'; }, /HTML in summary/],
    ['A URL on an unknown host, in text', (db) => { db.articles[0].summary = 'See https://example.com/x'; }, /URL on an unknown host/],
    ['A media URL on an unknown host', (db) => { db.roots[0].audio_url = 'https://example.com/a.mp3'; }, /URL on an unknown host/],
    ['A protocol-relative media URL', (db) => { db.roots[0].audio_url = '//example.com/a.mp3'; }, /isn't a known kind of URL/],
    ['A required field missing', (db) => { db.articles[0].title = ''; }, /required field title is empty/],
    ['A required id missing', (db) => { db.sentence_words[0].word_type_id = null; }, /required field word_type_id is null/],
    ['A key in a field', (db) => { db.articles[0].summary = jwt('anon'); }, /looks like it holds a key/],
    ['An empty sentence', (db) => { db.article_sentences[0].arabic = ' '; }, /required field arabic is empty/],
    ['A published article with no sentences', (db) => { db.articles.push({ ...db.articles[0], id: 800 }); }, /Published article 800 has no sentences/],
    ['A sentence pointing nowhere', (db) => { db.article_sentences[0].article_id = 999; }, /article_sentences row \d+ has article_id 999/],
    ['An article with no author', (db) => { db.articles[0].author_id = 999; }, /articles row 10 has author_id 999/],
    ['An article with no category', (db) => { db.articles[0].category_id = 999; }, /articles row 10 has category_id 999/],
    ['A word with no sentence', (db) => { db.sentence_words[0].sentence_id = 999; }, /has sentence_id 999/],
  ];
  for (const [name, change, expected] of cases) {
    const text = problemsOf(change);
    record(`Validate: ${name}`, expected.test(text), text.slice(0, 120));
  }
  const missing = base();
  delete missing.tables.roots;
  record('Validate: a table missing from a snapshot', /Table roots is missing: a deleted table/.test(validateSnapshot(missing).problems.join(' ')));
  const readable = edited((db) => { db.word_types = [{ id: 1, name: 'noun' }]; });
  readable.restricted = [];
  record('Validate: when word_types is readable, its foreign key is really checked', /has word_type_id \d+, and word_types has no such row/.test(validateSnapshot(readable).problems.join(' ')));
  const quiet = validateSnapshot(base());
  record('Validate: the clean fixture has no problems, and says word_types is not resolved', quiet.problems.length === 0 && /signed-in only/.test(quiet.notes.join(' ')), quiet.problems[0]);
  const strippedText = problemsOf((db) => { db.article_sentences[0].arabic = 'كتاب'; }, base());
  record('Validate: vocalised text losing all its marks fails', /lost all its vowel marks/.test(strippedText), strippedText.slice(0, 100));
  const emptied = problemsOf((db) => { db.sentence_words[0].word_form = ''; }, base());
  record('Validate: a word form emptied since the baseline fails', /word_form was emptied/.test(emptied), emptied.slice(0, 100));
  const storedEmpty = fixture();
  storedEmpty.sentence_words[0].word_form = '';
  const stillEmpty = validateSnapshot(asSnapshot(storedEmpty), asSnapshot(storedEmpty));
  record('Validate: a word form already stored empty is noted, not failed', stillEmpty.problems.length === 0 && /1 sentence_words rows have an empty word_form/.test(stillEmpty.notes.join(' ')));
}

/** Plan task 2.9: what the build reuses is in this repo, and it works from there. */
function repoAloneCases() {
  const dir = fs.mkdtempSync(path.join(COPY, 'alone-'));
  const file = path.join(dir, `${BASE_HASH}.json`);
  fs.writeFileSync(file, BASE_BYTES);
  const loaded = loadSnapshot(file);
  const index = indexSnapshot(loaded);
  const entry = index.wordEntry(index.qualifying[0]);
  record('The loader reads a saved snapshot and indexes it as the spike did', loaded.hash === BASE_HASH && entry.examples.length > 0 && entry.related.every((other) => other.path.startsWith('/word/')) && index.articleText(559).length === 2);
  const tampered = path.join(dir, `${'0'.repeat(64)}.json`);
  fs.writeFileSync(tampered, BASE_BYTES);
  let refused = false;
  try {
    loadSnapshot(tampered);
  } catch {
    refused = true;
  }
  record('The loader refuses a file that does not match its name', refused);
  let noFile = false;
  try {
    loadSnapshot(null);
  } catch {
    noFile = true;
  }
  record('With no file, the loader has no other source to fall back on', noFile);

  const segments = path.join(dir, 'segments.json');
  const classifier = spawnSync(process.execPath, [at('vendor/classifier/analyze.mjs'), file, segments], { cwd: dir, encoding: 'utf8' });
  record('The vendored classifier runs from this repo', classifier.status === 0 && fs.existsSync(segments) && typeof JSON.parse(fs.readFileSync(segments, 'utf8')) === 'object', classifier.stdout.trim() || classifier.stderr.slice(0, 200));

  const LIVE_CODE = ['scripts/ship.mjs', 'scripts/ship-rollback.mjs', 'scripts/ship', 'src', 'astro.config.mjs', 'package.json', 'wrangler.jsonc', 'public'];
  const files = LIVE_CODE.flatMap((entry) => {
    const full = at(entry);
    if (!fs.statSync(full).isDirectory()) return [full];
    return fs.readdirSync(full, { recursive: true, withFileTypes: true }).filter((item) => item.isFile()).map((item) => path.join(item.parentPath, item.name));
  });
  const reaching = files.filter((name) => /\.(mjs|js|ts|astro|json|jsonc)$/.test(name) && fs.readFileSync(name, 'utf8').includes('openarabic-spikes'));
  record('Nothing the ship or build runs refers to the spike folder', reaching.length === 0, reaching.join(', '));
  const secrets = fs.readdirSync(at('vendor'), { recursive: true, withFileTypes: true }).filter((item) => item.isFile() && fs.readFileSync(path.join(item.parentPath, item.name), 'utf8').match(/eyJ[A-Za-z0-9_-]{10,}\.|sb_secret_/));
  record('The copied files hold no key', secrets.length === 0, secrets.map((item) => item.name).join(', '));
  fs.rmSync(dir, { recursive: true, force: true });
}

async function concurrentRuns() {
  const first = spawn('pnpm', ['--silent', 'ship', '--dry-run'], { cwd: COPY, stdio: 'ignore', env: { ...process.env, ...RUN_ENV } });
  const finished = new Promise((resolve) => first.on('exit', resolve));
  const deadline = Date.now() + 20_000;
  while (!fs.existsSync(at('.ship/lock')) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
  const second = run('ship', '--dry-run');
  const code = await finished;
  const ok = second.status === 1 && /another run holds \.ship\/lock: "pnpm ship --dry-run", pid \d+/.test(second.output) && code === 0 && !fs.existsSync(at('.ship/lock'));
  record('Two real runs at once: the second refuses and names the first, the first finishes', ok, second.output.trim().split('\n').pop());
}

async function main() {
  console.log(`Throwaway copy: ${COPY}\n`);
  passes('Clean copy passes, with the wrangler.jsonc comment naming openarabic.io kept');

  // The five the plan and the owner named.
  stops('Wrong Worker name in wrangler.jsonc', () => edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "openarabic-web"'), /names the Worker "openarabic-web"/, { required: true });
  stops('A route in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": true', '"routes": [{ "pattern": "example.com/*", "zone_name": "example.com" }],\n  "workers_dev": true'), /holds a route/, { required: true });
  stops('A hand-edited CSS token', () => edit('src/styles/tokens.generated.css', '--color-primary: oklch(0.7323', '--color-primary: oklch(0.8'), /tokens\.generated\.css has drifted/, { required: true });
  stops('A 2 KB script, inline on a page that isn\'t home', () => write('src/pages/other.astro', OTHER_PAGE('', `<script is:inline>window.x='${seedScript}'</script>`)), /ships [\d.]+ KB of JS gzip, over its 0\.25 KB budget/, { required: true });
  stops('A home page over its 60 KB of JS', () => edit(PAGE, HEADING, `${HEADING}<script is:inline>window.x='${incompressible(90000)}'</script>`), /\/ \(home\) ships [\d.]+ KB of JS gzip, over its 60\.00 KB budget/, { required: true });
  stops('A seeded "native audio"', () => edit(PAGE, HEADING, `${HEADING}<p>Hear native audio.</p>`), /Banned phrases[\s\S]*"native audio"/, { required: true });

  // Guard: other ways round it.
  stops('Wrong name, other than the live one', () => edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "something-else"'), /names the Worker "something-else"/);
  stops('wrangler.jsonc deleted', () => fs.rmSync(at('wrangler.jsonc')), /wrangler\.jsonc is missing/);
  stops('openarabic.io as a value in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": true', '"vars": { "SITE": "https://openarabic.io" },\n  "workers_dev": true'), /mentions openarabic\.io/);
  stops('A custom domain in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": true', '"route": { "pattern": "x.example", "custom_domain": true },\n  "workers_dev": true'), /holds a route/);
  stops('An environment in wrangler.jsonc that could carry another name', () => edit('wrangler.jsonc', '"workers_dev": true', '"env": { "prod": { "name": "openarabic-web" } },\n  "workers_dev": true'), /defines environments/);
  stops('A service binding to the live Worker', () => edit('wrangler.jsonc', '"workers_dev": true', '"services": [{ "binding": "OLD", "service": "openarabic-web" }],\n  "workers_dev": true'), /refers to the live Worker/);
  stops('Wrong name only in the built config, source clean', () => edit('astro.config.mjs', "integrations: [generated()],", BUILD_HOOK("c.name = 'openarabic-web'")), /Built config dist\/server\/wrangler\.json names the Worker "openarabic-web"/);
  stops('A route only in the built config, source clean', () => edit('astro.config.mjs', "integrations: [generated()],", BUILD_HOOK("c.routes = ['x.example/*']")), /Built config dist\/server\/wrangler\.json holds a route/);
  stops('openarabic.io only in the built config, source clean', () => edit('astro.config.mjs', "integrations: [generated()],", BUILD_HOOK("c.vars = { S: 'openarabic.io' }")), /Built config dist\/server\/wrangler\.json mentions openarabic\.io/);
  stops("wrangler's redirect pointing at an unchecked config", () => edit('astro.config.mjs', "integrations: [generated()],", `integrations: [generated(), { name: 'seed', hooks: { 'astro:build:done': async () => { const fs = await import('node:fs'); fs.writeFileSync('.wrangler/deploy/config.json', JSON.stringify({ configPath: '../../elsewhere.json' })); } } }],`), /sends wrangler to .*elsewhere\.json, not a config this guard checked/);
  stops('A flag trying to name a Worker', () => {}, /Unknown argument: --name openarabic-web/, { args: ['--dry-run', '--name', 'openarabic-web'] });
  stops('A skip flag', () => {}, /Unknown argument: --skip-claims/, { args: ['--dry-run', '--skip-claims'] });
  passes('--production can be rehearsed in a dry run, with noindex off', () => {}, { args: ['--production'], inspect: (output) => /Production: noindex off/.test(output) && !/X-Robots-Tag/.test(read('dist/client/_headers')) });
  stops('A noindex header left on a production build', () => edit('astro.config.mjs', "integrations: [generated()],", `integrations: [generated(), { name: 'seed', hooks: { 'astro:build:done': async () => { const fs = await import('node:fs'); fs.appendFileSync(process.cwd() + '/dist/client/_headers', '/word/*\\n  X-Robots-Tag: noindex\\n'); } } }],`), /still has X-Robots-Tag on a production build/, { args: ['--dry-run', '--production'] });
  stops('A noindex meta left on one production page', () => edit('src/pages/privacy.astro', 'canonical="/privacy"', 'canonical="/privacy" neverIndex'), /has a noindex meta on a production build/, { args: ['--dry-run', '--production'] });
  passes('Under --production, the one live route is allowed', () => edit('wrangler.jsonc', '"workers_dev": true', '"routes": [{ "pattern": "openarabic.io", "custom_domain": true }],\n  "workers_dev": true'), { args: ['--production'], inspect: (output) => /Routes: openarabic\.io\./.test(output) });
  stops('Under --production, any other route is still refused', () => edit('wrangler.jsonc', '"workers_dev": true', '"routes": [{ "pattern": "example.com", "custom_domain": true }],\n  "workers_dev": true'), /holds a route/, { args: ['--dry-run', '--production'] });
  stops('Without --production, the live route is refused', () => edit('wrangler.jsonc', '"workers_dev": true', '"routes": [{ "pattern": "openarabic.io", "custom_domain": true }],\n  "workers_dev": true'), /holds a route/);
  stops('The old Worker name is refused under --production too', () => edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "openarabic-web"'), /names the Worker "openarabic-web"/, { args: ['--dry-run', '--production'] });
  stops('Noindex meta removed', () => edit('src/layouts/Base.astro', '{robots && <meta name="robots" content={robots} />}', ''), /has no noindex meta/);
  stops('Noindex header removed', () => write('public/_headers', '# none\n'), /has no "X-Robots-Tag: noindex"/);

  stops('workers_dev switched off', () => edit('wrangler.jsonc', '"workers_dev": true', '"workers_dev": false'), /workers_dev false/);
  stops('--production on a real run', () => {}, /--production is refused/, { args: ['--production'] });
  stops('The off switch refuses a real run at the upload', () => edit('scripts/ship/lib.mjs', 'REAL_DEPLOYS_ALLOWED = true', 'REAL_DEPLOYS_ALLOWED = false'), /switched off/, { args: [] });
  stops('A published record for another Worker stops the ship', seedPublished({ worker: 'openarabic-web' }), /is for "openarabic-web"/);

  // The real dev runtime.
  stops("A compatibility_date workerd can't run: the build passes, dev does not", () => edit('wrangler.jsonc', '"compatibility_date": "2026-10-23"', '"compatibility_date": "2099-01-01"'), /dev runtime/, { required: true });
  stops('A page that throws only under dev', () => edit(PAGE, "import Base from '../layouts/Base.astro';", "import Base from '../layouts/Base.astro';\nif (import.meta.env.DEV) throw new Error('seeded');"), /dev runtime started but `\/` answered 500/);

  // Design.
  stops('DESIGN.md token changed, CSS not regenerated', () => edit('DESIGN.md', 'surface: "oklch(0.145 0.02 160)"', 'surface: "oklch(0.146 0.02 160)"'), /tokens\.generated\.css has drifted/);
  stops('tokens.generated.ts hand-edited', () => edit('src/styles/tokens.generated.ts', "'#", "'#1"), /tokens\.generated\.ts has drifted/);
  stops('Generated CSS deleted', () => fs.rmSync(at('src/styles/tokens.generated.css')), /tokens\.generated\.css is missing/);
  stops('DESIGN.md lint error', () => edit('DESIGN.md', 'primary: "oklch(0.7323 0.085 151.5)"', 'primary: "not-a-colour"'), /DESIGN\.md lint found [1-9]\d* errors/);
  stops('DESIGN.md lint warning', () => edit('DESIGN.md', '  link: {backgroundColor: "{colors.surface}", textColor: "{colors.primary}"}', '  link: {backgroundColor: "oklch(0.2 0 0)", textColor: "oklch(0.25 0 0)"}'), /DESIGN\.md lint found \d+ errors and [1-9]\d* warnings/);
  stops('Hex literal in site CSS', () => edit('src/styles/base.css', 'color: var(--color-on-surface);', 'color: #ffffff;'), /Colour literals[\s\S]*base\.css: #ffffff/);
  stops('oklch() literal in site CSS', () => edit('src/styles/base.css', 'color: var(--color-on-surface);', 'color: oklch(0.9 0 0);'), /Colour literals[\s\S]*base\.css: oklch/);
  stops('Named colour in site CSS', () => edit('src/styles/base.css', 'color: var(--color-on-surface);', 'color: white;'), /Colour literals[\s\S]*base\.css: white/);
  stops('Colour literal in a style attribute', () => edit(PAGE, HEADING, `<h1 style="color: rgb(1 2 3)">OpenArabic: Read the Classics</h1>`), /Colour literals[\s\S]*index\.astro: rgb/);
  stops('Colour literal in DESIGN.md below the front matter', () => edit('DESIGN.md', '## Overview', 'Use #123456 here.\n\n## Overview'), /Colour literals[\s\S]*DESIGN\.md below the front matter: #123456/);

  // Budgets.
  stops('2 KB script in the Astro bundle, on a page that isn\'t home', () => write('src/pages/other.astro', OTHER_PAGE('', `<script>document.title='${seedScript}'</script>`)), /loads the script|KB of JS gzip/);
  stops('2 KB script in public, loaded by no page', () => write('public/stray.js', `window.x='${seedScript}'`), /stray\.js is [\d.]+ KB of JS gzip, over the 1\.5 KB cap/);
  stops('External script on a 0 JS page type', () => edit(PAGE, HEADING, `${HEADING}<script is:inline src="https://example.com/a.js"></script>`), /third-party resource/);
  stops('Third-party request made only at runtime', () => edit(PAGE, HEADING, `${HEADING}<script is:inline>new Image().src='https://example.com/p.gif'</script>`), /third-party request in the browser/);
  stops('CSS over 12 KB gzip, on a page that isn\'t home', () => write('src/pages/other.astro', OTHER_PAGE(`<style is:inline>.x{--y:'${incompressible(20000)}'}</style>`)), /CSS gzip, over the 12\.00 KB budget/);
  stops('A home page over its 24 KB of CSS', () => fs.appendFileSync(at('src/styles/base.css'), `\n.x{--y:'${incompressible(40000)}'}\n`), /CSS gzip, over the 24\.00 KB budget/);
  stops('Fonts over 110 KB', () => {
    fs.copyFileSync(at('src/fonts/amiri-regular.subset.woff2'), at('src/fonts/copy.woff2'));
    fs.appendFileSync(at('src/fonts/copy.woff2'), randomBytes(1000));
    fs.appendFileSync(at('src/styles/fonts.css'), '\n@font-face { font-family: "Extra"; src: url("../fonts/copy.woff2") format("woff2"); }\n');
  }, /fonts, over the 110\.00 KB first-view budget/);
  stops('A 26 MiB asset', () => {
    fs.mkdirSync(at('public/big'), { recursive: true });
    fs.writeFileSync(at('public/big/file.bin'), Buffer.alloc(26 * 1024 * 1024));
  }, /over the 25 MiB limit/);
  stops('Glossary over 25 KB brotli', () => write('public/gl/1.json', JSON.stringify(incompressible(30000))), /glossary brotli, over the 25\.00 KB budget/);
  stops('Reader page over 12 KB brotli', () => write('public/read/x-1.html', `<!doctype html><html><head><meta name="robots" content="noindex"></head><body><p>${incompressible(20000)}</p></body></html>`), /HTML brotli, over the 12\.00 KB reader budget/);

  // Claims.
  stops('"native audio" in an alt attribute', () => edit(PAGE, HEADING, `${HEADING}<img src="data:," alt="native audio" width="1" height="1">`), /Banned phrases[\s\S]*"native audio"/);
  stops('"Native Audio" split across a tag', () => edit(PAGE, HEADING, `${HEADING}<p>Native <b>Audio</b></p>`), /Banned phrases[\s\S]*"native audio"/);
  stops('"native audio" in the meta description', () => edit(PAGE, '<Base>', '<Base description="With native audio">'), /Banned phrases[\s\S]*"native audio"/);
  stops('A banned phrase listed as draft copy stays banned', () => {
    fs.appendFileSync(at('docs/draft-copy.txt'), 'Hear native audio.\n');
    edit(PAGE, HEADING, `${HEADING}<p>Hear native audio.</p>`);
  }, /Banned phrases[\s\S]*"native audio"/);
  stops('"i+1" in copy', () => edit(PAGE, HEADING, `${HEADING}<p>Input at i+1.</p>`), /Banned phrases[\s\S]*"i\+1"/);
  stops('A banned phrase in a public text file', () => write('public/note.txt', 'free forever\n'), /Banned phrases[\s\S]*"free forever"/);
  stops('"side by side" away from the book page', () => edit(PAGE, HEADING, `${HEADING}<p>side by side</p>`), /Banned phrases[\s\S]*"side by side"/);
  stops('A sentence that traces to nothing', () => edit(PAGE, HEADING, `${HEADING}<p>Our app changes lives.</p>`), /traces to nothing[\s\S]*"Our app changes lives\."/);
  stops('A ledger sentence with an added tail', () => edit(PAGE, HEADING, `${HEADING}<p>Free. No ads. No subscription. Today only.</p>`), /traces to nothing[\s\S]*"Today only\."/);
  stops('English inside an Arabic run still has to trace', () => edit(PAGE, HEADING, `${HEADING}<div lang="ar"><p lang="en">Our app changes lives.</p></div>`), /traces to nothing[\s\S]*"Our app changes lives\."/);
  stops('A draft word does not clear part of a longer word', () => edit(PAGE, HEADING, `${HEADING}<p>Contactless</p>`), /traces to nothing[\s\S]*"Contactless"/);
  stops('Untraced aria-label', () => edit(PAGE, '<main>', '<main aria-label="Made up label">'), /traces to nothing[\s\S]*"Made up label"/);
  passes('Sentence listed in docs/draft-copy.txt passes', () => {
    fs.appendFileSync(at('docs/draft-copy.txt'), 'A new line for the owner.\n');
    edit(PAGE, HEADING, `${HEADING}<p>A new line for the owner.</p>`);
  });
  passes('Ledger sentences and a DESIGN.md draft string pass', () => edit(PAGE, HEADING, `${HEADING}<p>Free. No ads. No subscription.</p><p>Tap a word.</p><p lang="ar" dir="rtl">وَإِذَا</p>`));

  // Lock.
  stops('A lock held by a live run', () => write('.ship/lock', JSON.stringify({ command: 'pnpm ship', pid: process.pid, started: 'earlier' })), new RegExp(`another run holds \\.ship/lock: "pnpm ship", pid ${process.pid}`));
  stops('A lock left by a dead run', () => write('.ship/lock', JSON.stringify({ command: 'pnpm ship', pid: 4194304, started: 'earlier' })), /no longer running[\s\S]*delete \.ship\/lock/);
  await concurrentRuns();
  restore();

  // Rollback.
  rollback('Rollback: wrong name refused', () => edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "openarabic-web"'), ['--dry-run'], /names the Worker "openarabic-web"/, 1);
  rollback('Rollback: flag naming a Worker refused', () => {}, ['--dry-run', '--name', 'openarabic-web'], /Unknown argument/, 1);
  rollback('Rollback: nothing recorded, refused', () => {}, ['--dry-run'], /no recorded version/, 1);
  rollback('Rollback: a record for another Worker refused', seedPublished({ worker: 'openarabic-web' }), ['--dry-run'], /is for "openarabic-web"/, 1);
  rollback('Rollback: a version id that is really a flag refused', seedPublished({ previous: { hash: 'a', workerVersion: '--name=openarabic-web' } }), ['--dry-run'], /isn't a Worker version id/, 1);
  rollback('Rollback: a second run refused', () => {
    seedPublished()();
    write('.ship/lock', JSON.stringify({ command: 'pnpm ship', pid: process.pid, started: 'earlier' }));
  }, ['--dry-run'], /another run holds/, 1);
  rollback('Rollback: dry run prints an explicit --name openarabic-site', seedPublished(), ['--dry-run'], new RegExp(`wrangler rollback ${VERSION} --name openarabic-site`), 0);
  rollback('Rollback: the off switch refuses a real run', () => {
    seedPublished()();
    edit('scripts/ship/lib.mjs', 'REAL_DEPLOYS_ALLOWED = true', 'REAL_DEPLOYS_ALLOWED = false');
  }, [], /switched off/, 1);
  if (fs.existsSync(SPY_LOG)) record('wrangler was never called', false, fs.readFileSync(SPY_LOG, 'utf8'));
  else record('wrangler was never called, in any case above', true);

  await smokeUnits();
  realRuns();

  guardUnits();
  repoAloneCases();
  fetchCases();
  guardCases();

  passes('Clean copy still passes after every restore');

  const treeOk = hashTree(REPO, SOURCES) === REAL_TREE_BEFORE;
  record('The real working tree is unchanged', treeOk);

  fs.rmSync(COPY, { recursive: true, force: true });
  const failed = results.filter((result) => !result.ok);
  const required = results.filter((result) => result.required);
  console.log(`\n${results.length - failed.length}/${results.length} passed. Plan's seeded failures stopped: ${required.filter((r) => r.ok).length}/${required.length}.`);
  process.exit(failed.length > 0 ? 1 : 0);
}

await main();
