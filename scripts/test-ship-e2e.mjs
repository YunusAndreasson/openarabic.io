#!/usr/bin/env node
// Proves the guards are wired into a real `pnpm ship --production`, in a throwaway copy on fixture data.
// The copy's wrangler is a spy and every network host is faked, so nothing leaves this machine and nothing can deploy.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, hashOf, TABLES } from './ship/fetch.mjs';
import { fixture, fixtureSitemap } from './ship-test/fixture.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COPY = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-e2e-'));
const SOURCES = ['astro.config.mjs', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'wrangler.jsonc', 'DESIGN.md', 'PRODUCT.md', 'docs/draft-copy.txt', 'docs/research/parity', 'public', 'scripts', 'src', 'vendor'];
const SPY = path.join(COPY, 'wrangler-spy.log');
const PREVIEW = 'https://openarabic-site.stub.workers.dev';
const VERSION = 'aaaaaaaa-2222-4333-8444-555555555555';
const at = (file) => path.join(COPY, file);

for (const entry of SOURCES) fs.cpSync(path.join(REPO, entry), at(entry), { recursive: true });
fs.rmSync(at('public/img'), { recursive: true, force: true });
fs.mkdirSync(at('node_modules/.bin'), { recursive: true });
for (const name of fs.readdirSync(path.join(REPO, 'node_modules'))) if (name !== '.bin') fs.symlinkSync(path.join(REPO, 'node_modules', name), at(`node_modules/${name}`));
for (const name of fs.readdirSync(path.join(REPO, 'node_modules/.bin'))) if (name !== 'wrangler') fs.copyFileSync(path.join(REPO, 'node_modules/.bin', name), at(`node_modules/.bin/${name}`));
fs.writeFileSync(at('node_modules/.bin/wrangler'), `#!/bin/sh
echo "$@" >> "${SPY}"
[ "$1" = deploy ] && printf '{"type":"deploy","version":1,"worker_name":"openarabic-site","version_id":"${VERSION}","targets":["${PREVIEW}","openarabic.io (custom domain)"]}\\n' > "$WRANGLER_OUTPUT_FILE_PATH"
exit 0
`, { mode: 0o755 });

const db = fixture();
const columns = Object.fromEntries(Object.keys(TABLES).map((table) => [table, db[table].map((row) => Object.fromEntries(TABLES[table].map((column) => [column, row[column]])))]));
const bytes = canonical({ format: 1, tables: columns, restricted: ['word_types'], rating: { store: 'us', average: 5 } });
const hash = hashOf(bytes);
fs.writeFileSync(at('fake-db.json'), JSON.stringify(db));
fs.mkdirSync(at('.ship/snapshots'), { recursive: true });
fs.writeFileSync(at(`.ship/snapshots/${hash}.json`), bytes);
fs.writeFileSync(at('.ship/baseline'), `${hash}\n`);
fs.writeFileSync(at('docs/research/parity/sitemap-2026-11-01.txt'), `${fixtureSitemap(db)}\n`);

const key = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'anon', ref: 'kkmnzbeugdoajtzfjkxg' })).toString('base64url')}.NOTREAL`;
const ship = (...args) => {
  const started = Date.now();
  const result = spawnSync('node', ['scripts/ship.mjs', ...args], { cwd: COPY, encoding: 'utf8', timeout: 240_000, env: { ...process.env, NODE_OPTIONS: `--import=${path.join(REPO, 'scripts/ship-test/fake-network.mjs')}`, OPENARABIC_ANON_KEY: key } });
  console.log(`  ship ${args.join(' ')}: exit ${result.status} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};
const spyCalls = () => (fs.existsSync(SPY) ? fs.readFileSync(SPY, 'utf8').trim().split('\n') : []);
const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failures.push(`${name}\n${detail.slice(-1500)}`);
};
const edit = (file, from, to) => {
  const text = fs.readFileSync(at(file), 'utf8');
  if (!text.includes(from)) throw new Error(`Seed target not found in ${file}: ${from}`);
  fs.writeFileSync(at(file), text.replace(from, to));
  return () => fs.writeFileSync(at(file), text);
};

// These stop before the build, so they take seconds.
let undo = edit('wrangler.jsonc', '"name": "openarabic-site"', '"name": "openarabic-web"');
let run = ship('--production', '--dry-run');
check('A wrong Worker name stops the run, before any upload', run.status === 1 && /names the Worker "openarabic-web"/.test(run.output) && spyCalls().length === 0, run.output);
undo();
run = ship('--dry-run');
check('A plain ship is refused while the live domain is in the config', run.status === 1 && /holds a route/.test(run.output) && spyCalls().length === 0, run.output);
undo = edit('src/styles/tokens.generated.css', '--color-primary: oklch(0.7323', '--color-primary: oklch(0.8');
run = ship('--production', '--dry-run');
check('A hand-edited token stops the run', run.status === 1 && /tokens\.generated\.css has drifted/.test(run.output), run.output);
undo();
run = ship('--name', 'openarabic-web');
check('A flag naming a Worker is refused', run.status === 1 && /Unknown argument/.test(run.output) && spyCalls().length === 0, run.output);
fs.writeFileSync(at('.ship/lock'), JSON.stringify({ command: 'pnpm ship', pid: process.pid, started: 'earlier' }));
run = ship('--production', '--dry-run');
check('A second run refuses to start', run.status === 1 && /another run holds \.ship\/lock/.test(run.output), run.output);
fs.rmSync(at('.ship/lock'));

// The whole thing, once, on fixture data.
run = ship('--production');
const published = fs.existsSync(at('.ship/published')) ? JSON.parse(fs.readFileSync(at('.ship/published'), 'utf8')) : null;
check('A full production run passes every step', run.status === 0 && /SHIPPED PRODUCTION/.test(run.output), run.output);
check('It uploads the built config, with no --name, once', spyCalls().length === 1 && spyCalls()[0] === 'deploy --config dist/server/wrangler.json', spyCalls().join(' | '));
check('It records the version, the snapshot and that it was production', published?.workerVersion === VERSION && published?.hashOf === 'snapshot' && published?.production === true, JSON.stringify(published));
check('The build has noindex off', !/X-Robots-Tag/.test(fs.readFileSync(at('dist/client/_headers'), 'utf8')));
check('Parity ran on the build and on the edge', /\[parity\] PASS/.test(run.output) && /\[parity, preview\] PASS/.test(run.output), run.output);

// Rollback, the thing that protects the live site. `published` now holds the good version from the run above.
const before = fs.readFileSync(at('.ship/published'), 'utf8');
const NODE_ENV_FOR_SHIP = { NODE_OPTIONS: `--import=${path.join(REPO, 'scripts/ship-test/fake-network.mjs')}`, OPENARABIC_ANON_KEY: key };
fs.rmSync(SPY, { force: true });
const broken = spawnSync('node', ['scripts/ship.mjs', '--production'], { cwd: COPY, encoding: 'utf8', timeout: 240_000, env: { ...process.env, ...NODE_ENV_FOR_SHIP, STUB_EDGE: 'broken' } });
const brokenOutput = `${broken.stdout}${broken.stderr}`;
check('A failed smoke check rolls back to the recorded version, by explicit name', broken.status === 1 && spyCalls()[0]?.startsWith('deploy ') && spyCalls()[1]?.startsWith(`rollback ${VERSION} --name openarabic-site --yes`), brokenOutput);
check('And leaves the record alone', fs.readFileSync(at('.ship/published'), 'utf8') === before);

const rollback = (env = {}) => {
  const result = spawnSync('node', ['scripts/ship-rollback.mjs', '--dry-run'], { cwd: COPY, encoding: 'utf8', timeout: 60_000, env: { ...process.env, ...NODE_ENV_FOR_SHIP, ...env } });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};
const seedRecord = (record) => fs.writeFileSync(at('.ship/published'), JSON.stringify(record));
const good = { worker: 'openarabic-site', hash: 'bbb', hashOf: 'snapshot', workerVersion: VERSION, previous: { production: true, hash: 'aaa', workerVersion: '11111111-2222-4333-8444-555555555555' } };
seedRecord(good);
run = rollback();
check('A rollback names openarabic-site explicitly', run.status === 0 && /wrangler rollback 11111111-2222-4333-8444-555555555555 --name openarabic-site/.test(run.output), run.output);
seedRecord({ ...good, previous: { hash: 'aaa', workerVersion: '11111111-2222-4333-8444-555555555555' } });
run = rollback();
check('A rollback refuses a noindexed preview version while the domain is attached', run.status === 1 && /would take the site out of Google/.test(run.output), run.output);
seedRecord({ ...good, worker: 'openarabic-web' });
run = rollback();
check('A rollback refuses a record for the old Worker', run.status === 1 && /is for "openarabic-web"/.test(run.output), run.output);
seedRecord({ ...good, previous: { production: true, hash: 'a', workerVersion: '--name=openarabic-web' } });
run = rollback();
check('A rollback refuses a version that is really a flag', run.status === 1 && /isn't a Worker version id/.test(run.output), run.output);

fs.rmSync(COPY, { recursive: true, force: true });
console.log(failures.length === 0 ? '\nEnd to end: all passed.' : `\n${failures.join('\n\n')}`);
process.exit(failures.length === 0 ? 0 : 1);
