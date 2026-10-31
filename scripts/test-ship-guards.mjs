#!/usr/bin/env node
// `pnpm ship:test`: seeds each failure in docs/site-plan.md Phase 1 and proves `pnpm ship --dry-run`
// stops on it, before any upload. Everything runs in a throwaway copy of the repo, so a seed can't be
// left behind or collide with other work here. The copy's wrangler is a spy, which also proves nothing
// reached it, and real runs meet a stubbed edge loaded with --import. Real wrangler is never called, and no real preview is requested.
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COPY = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-ship-test-'));
const SOURCES = ['astro.config.mjs', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'wrangler.jsonc', 'DESIGN.md', 'PRODUCT.md', 'docs/draft-copy.txt', 'public', 'scripts', 'src'];
const GENERATED = new Set(['node_modules', 'dist', '.astro', '.wrangler', '.ship']);
const SPY_LOG = path.join(COPY, 'wrangler-spy.log');
const EDGE_STUB = path.join(COPY, 'edge-stub.mjs');
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
  // Only ever in the copy's runs, through NODE_OPTIONS: the ship has no switch of its own to point its smoke elsewhere.
  fs.writeFileSync(EDGE_STUB, `import fs from 'node:fs';
const real = globalThis.fetch;
const previous = process.env.STUB_PREVIOUS_BODY ?? '';
globalThis.fetch = async (input, init) => {
  const href = String(input?.url ?? input);
  if (!/^https:\\/\\/[^/]*\\.workers\\.dev/.test(href)) return real(input, init);
  const route = new URL(href).pathname;
  let mode = process.env.STUB_EDGE ?? 'ok';
  const rolled = fs.existsSync('wrangler-spy.log') && fs.readFileSync('wrangler-spy.log', 'utf8').includes('rollback ');
  if (mode === 'bad-until-rollback') mode = rolled ? 'previous' : 'no-header';
  if (mode === 'previous' && route === '/') return new Response(previous, { headers: { 'x-robots-tag': 'noindex' } });
  const body = route === '/' ? fs.readFileSync('dist/client/index.html') : 'file';
  return new Response(body, { headers: mode === 'no-header' ? {} : { 'x-robots-tag': 'noindex' } });
};
`);
}

const REAL_TREE_BEFORE = hashTree(REPO, SOURCES);
prepare();
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
  if (hashTree(COPY, SOURCES) !== PRISTINE) throw new Error('Restore failed: the copy differs from the pristine source.');
}

const run = (script, ...args) => {
  const result = spawnSync('pnpm', ['--silent', script, ...args], { cwd: COPY, encoding: 'utf8', timeout: 180_000 });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};

/** A real run: the checks are real, and the upload and the edge are the stubs. */
const runReal = (script, env = {}) => {
  if (!read('node_modules/.bin/wrangler').startsWith('#!/bin/sh\necho')) throw new Error('The spy is not installed. Stopping before any wrangler call.');
  const result = spawnSync('pnpm', ['--silent', script], {
    cwd: COPY,
    encoding: 'utf8',
    timeout: 240_000,
    env: { ...process.env, NODE_OPTIONS: `--import=${EDGE_STUB}`, ...env },
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};
const spyCalls = () => (fs.existsSync(SPY_LOG) ? fs.readFileSync(SPY_LOG, 'utf8').trim().split('\n') : []);
const publishedNow = () => (fs.existsSync(at('.ship/published')) ? JSON.parse(read('.ship/published')) : null);
const sha = (text) => createHash('sha256').update(text).digest('hex');

const incompressible = (bytes) => randomBytes(bytes).toString('base64');
const seedScript = incompressible(2200);
const PAGE = 'src/pages/index.astro';
const HEADING = '<h1>OpenArabic: Read the Classics</h1>';
const BUILD_HOOK = (change) =>
  `integrations: [{ name: 'seed', hooks: { 'astro:build:done': async () => { const fs = await import('node:fs'); const f = process.cwd() + '/dist/client/wrangler.json'; const c = JSON.parse(fs.readFileSync(f, 'utf8')); ${change}; fs.writeFileSync(f, JSON.stringify(c)); } } }],\n  trailingSlash: 'never',`;

const results = [];

function record(name, ok, detail, required = false) {
  results.push({ name, ok, detail, required });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${required ? '[plan] ' : ''}${name}${detail ? `\n       ${detail}` : ''}`);
}

/** The seed must stop the dry run, with this message, before the deploy step, with wrangler untouched. */
function stops(name, seed, expected, { required = false, args = ['--dry-run'] } = {}) {
  seed();
  const { status, output } = run('ship', ...args);
  const reachedDeploy = /^\[deploy\]/m.test(output);
  const spy = fs.existsSync(SPY_LOG);
  const message = output.split('Nothing was uploaded.\n')[1]?.trim().split('\n').slice(0, 2).join(' ') ?? output.trim().slice(-300);
  const ok = status === 1 && expected.test(output) && /SHIP STOPPED\. Nothing was uploaded\./.test(output) && !reachedDeploy && !spy;
  record(name, ok, message, required);
  restore();
}

function passes(name, seed = () => {}) {
  seed();
  const { status, output } = run('ship', '--dry-run');
  const ok = status === 0 && /DRY RUN COMPLETE\. Worker: openarabic-site\. Routes: none\. Nothing was uploaded\./.test(output) && !fs.existsSync(SPY_LOG);
  record(name, ok, ok ? '' : output.slice(-1500));
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
  record('Real run, first ever: uploads from the built config, with no --name, then records', result.status === 0 && calls.length === 1 && calls[0] === 'deploy --config dist/client/wrangler.json' && /\[worker\] dist\/client\/wrangler\.json names: openarabic-site/.test(result.output), calls.join(' | ') + (result.status === 0 ? '' : result.output.slice(-800)));
  record('Real run: published holds hash, version and time, and no URL', after?.workerVersion === NEW_VERSION && /^[0-9a-f]{64}$/.test(after?.hash ?? '') && Boolean(after?.publishedAt) && !JSON.stringify(after).includes('workers.dev') && read('.ship/preview-url').trim() === PREVIEW, JSON.stringify(after));
  record('Real run: the unbuilt steps still print NOT BUILT', /NOT BUILT, so not passed: fetch, validate, compare, parity\./.test(result.output));
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

async function concurrentRuns() {
  const first = spawn('pnpm', ['--silent', 'ship', '--dry-run'], { cwd: COPY, stdio: 'ignore' });
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
  stops('A 2 KB script, inline on the page', () => edit(PAGE, HEADING, `${HEADING}<script is:inline>window.x='${seedScript}'</script>`), /ships [\d.]+ KB of JS gzip, over its 0\.50 KB budget/, { required: true });
  stops('A seeded "native audio"', () => edit(PAGE, HEADING, `${HEADING}<p>Hear native audio.</p>`), /Banned phrases[\s\S]*"native audio"/, { required: true });

  // Guard: other ways round it.
  stops('Wrong name, other than the live one', () => edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "something-else"'), /names the Worker "something-else"/);
  stops('wrangler.jsonc deleted', () => fs.rmSync(at('wrangler.jsonc')), /wrangler\.jsonc is missing/);
  stops('openarabic.io as a value in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": true', '"vars": { "SITE": "https://openarabic.io" },\n  "workers_dev": true'), /mentions openarabic\.io/);
  stops('A custom domain in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": true', '"route": { "pattern": "x.example", "custom_domain": true },\n  "workers_dev": true'), /holds a route/);
  stops('An environment in wrangler.jsonc that could carry another name', () => edit('wrangler.jsonc', '"workers_dev": true', '"env": { "prod": { "name": "openarabic-web" } },\n  "workers_dev": true'), /defines environments/);
  stops('A service binding to the live Worker', () => edit('wrangler.jsonc', '"workers_dev": true', '"services": [{ "binding": "OLD", "service": "openarabic-web" }],\n  "workers_dev": true'), /refers to the live Worker/);
  stops('Wrong name only in the built config, source clean', () => edit('astro.config.mjs', "trailingSlash: 'never',", BUILD_HOOK("c.name = 'openarabic-web'")), /Built config dist\/client\/wrangler\.json names the Worker "openarabic-web"/);
  stops('A route only in the built config, source clean', () => edit('astro.config.mjs', "trailingSlash: 'never',", BUILD_HOOK("c.routes = ['x.example/*']")), /Built config dist\/client\/wrangler\.json holds a route/);
  stops('openarabic.io only in the built config, source clean', () => edit('astro.config.mjs', "trailingSlash: 'never',", BUILD_HOOK("c.vars = { S: 'openarabic.io' }")), /Built config dist\/client\/wrangler\.json mentions openarabic\.io/);
  stops("wrangler's redirect pointing at an unchecked config", () => edit('astro.config.mjs', "trailingSlash: 'never',", `integrations: [{ name: 'seed', hooks: { 'astro:build:done': async () => { const fs = await import('node:fs'); fs.writeFileSync('.wrangler/deploy/config.json', JSON.stringify({ configPath: '../../elsewhere.json' })); } } }],\n  trailingSlash: 'never',`), /sends wrangler to .*elsewhere\.json, not a config this guard checked/);
  stops('A flag trying to name a Worker', () => {}, /Unknown argument: --name openarabic-web/, { args: ['--dry-run', '--name', 'openarabic-web'] });
  stops('A skip flag', () => {}, /Unknown argument: --skip-claims/, { args: ['--dry-run', '--skip-claims'] });
  stops('--production before the cutover', () => {}, /--production is refused/, { args: ['--dry-run', '--production'] });
  stops('Noindex meta removed', () => edit('src/layouts/Base.astro', '<meta name="robots" content="noindex, nofollow" />', ''), /has no noindex meta/);
  stops('Noindex header removed', () => write('public/_headers', '# none\n'), /has no "X-Robots-Tag: noindex"/);
  stops('A second page while Phase 2 steps are unbuilt', () => write('src/pages/extra.astro', '---\nimport Base from "../layouts/Base.astro";\n---\n<Base><main></main></Base>\n'), /pages beyond the placeholder/);

  stops('workers_dev switched off', () => edit('wrangler.jsonc', '"workers_dev": true', '"workers_dev": false'), /workers_dev false/);
  stops('An on-demand page, with no HTML file to see', () => write('src/pages/live.astro', '---\nexport const prerender = false;\n---\n<p></p>\n'), /pages beyond the placeholder/);
  stops('An endpoint, with no HTML file to see', () => write('src/pages/data.json.ts', 'export const GET = () => new Response("{}");\n'), /pages beyond the placeholder/);
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
  stops('2 KB script in the Astro bundle', () => edit(PAGE, HEADING, `${HEADING}<script>document.title='${seedScript}'</script>`), /loads the script|KB of JS gzip/);
  stops('2 KB script in public, loaded by no page', () => write('public/stray.js', `window.x='${seedScript}'`), /stray\.js is [\d.]+ KB of JS gzip, over the 1\.5 KB cap/);
  stops('External script on a 0 JS page type', () => edit(PAGE, HEADING, `${HEADING}<script is:inline src="https://example.com/a.js"></script>`), /third-party resource/);
  stops('Third-party request made only at runtime', () => edit(PAGE, HEADING, `${HEADING}<script is:inline>new Image().src='https://example.com/p.gif'</script>`), /third-party request in the browser/);
  stops('CSS over 12 KB gzip', () => fs.appendFileSync(at('src/styles/base.css'), `\n/*${incompressible(14000)}*/\n.x{--y:'${incompressible(14000)}'}\n`), /CSS gzip, over the 12\.00 KB budget/);
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
