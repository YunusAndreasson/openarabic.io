#!/usr/bin/env node
// `pnpm ship:test`: seeds each failure in docs/site-plan.md Phase 1 and proves `pnpm ship --dry-run`
// stops on it, before any upload. Everything runs in a throwaway copy of the repo, so a seed can't be
// left behind or collide with other work here. The copy's wrangler is a spy, which also proves nothing
// reached it. Real wrangler is never called.
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
  fs.writeFileSync(path.join(modules, '.bin/wrangler'), `#!/bin/sh\necho "$@" >> "${SPY_LOG}"\n`, { mode: 0o755 });
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
const seedPublished = (over = {}) => () =>
  write('.ship/published', JSON.stringify({ worker: 'openarabic-site', hash: 'bbb', workerVersion: '99999999-2222-4333-8444-555555555555', previous: { hash: 'aaa', workerVersion: VERSION }, ...over }));

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
  stops('A route in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": false', '"routes": [{ "pattern": "example.com/*", "zone_name": "example.com" }],\n  "workers_dev": false'), /holds a route/, { required: true });
  stops('A hand-edited CSS token', () => edit('src/styles/tokens.generated.css', '--color-primary: oklch(0.7323', '--color-primary: oklch(0.8'), /tokens\.generated\.css has drifted/, { required: true });
  stops('A 2 KB script, inline on the page', () => edit(PAGE, HEADING, `${HEADING}<script is:inline>window.x='${seedScript}'</script>`), /ships [\d.]+ KB of JS gzip, over its 0\.50 KB budget/, { required: true });
  stops('A seeded "native audio"', () => edit(PAGE, HEADING, `${HEADING}<p>Hear native audio.</p>`), /Banned phrases[\s\S]*"native audio"/, { required: true });

  // Guard: other ways round it.
  stops('Wrong name, other than the live one', () => edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "something-else"'), /names the Worker "something-else"/);
  stops('wrangler.jsonc deleted', () => fs.rmSync(at('wrangler.jsonc')), /wrangler\.jsonc is missing/);
  stops('openarabic.io as a value in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": false', '"vars": { "SITE": "https://openarabic.io" },\n  "workers_dev": false'), /mentions openarabic\.io/);
  stops('A custom domain in wrangler.jsonc', () => edit('wrangler.jsonc', '"workers_dev": false', '"route": { "pattern": "x.example", "custom_domain": true },\n  "workers_dev": false'), /holds a route/);
  stops('An environment in wrangler.jsonc that could carry another name', () => edit('wrangler.jsonc', '"workers_dev": false', '"env": { "prod": { "name": "openarabic-web" } },\n  "workers_dev": false'), /defines environments/);
  stops('A service binding to the live Worker', () => edit('wrangler.jsonc', '"workers_dev": false', '"services": [{ "binding": "OLD", "service": "openarabic-web" }],\n  "workers_dev": false'), /refers to the live Worker/);
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

  // Plain `pnpm ship`, no dry run: goes through the checks, then refuses the upload.
  stops('A real run is refused at the upload until task 1.3', () => {}, /Real deploys are off until task 1\.3/, { args: [] });

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
  rollback('Rollback: a real run is refused until task 1.3', seedPublished(), [], /Real deploys are off until task 1\.3/, 1);
  if (fs.existsSync(SPY_LOG)) record('wrangler was never called', false, fs.readFileSync(SPY_LOG, 'utf8'));
  else record('wrangler was never called, in any case above', true);

  // Rollback's real path, switched on in the copy only, against the spy. Refuses to run unless the spy is what would be called.
  seedPublished()();
  edit('scripts/ship/lib.mjs', 'REAL_DEPLOYS_ALLOWED = false', 'REAL_DEPLOYS_ALLOWED = true');
  if (!read('node_modules/.bin/wrangler').startsWith('#!/bin/sh\necho')) throw new Error('The spy is not installed. Stopping before any wrangler call.');
  const enabled = run('ship:rollback');
  const called = fs.existsSync(SPY_LOG) ? fs.readFileSync(SPY_LOG, 'utf8') : '';
  const after = JSON.parse(read('.ship/published'));
  record('Rollback, real path against the spy: calls only --name openarabic-site and restores version and hash', enabled.status === 0 && called.startsWith(`rollback ${VERSION} --name openarabic-site `) && after.workerVersion === VERSION && after.hash === 'aaa', called.trim());
  fs.rmSync(SPY_LOG, { force: true });
  restore();

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
