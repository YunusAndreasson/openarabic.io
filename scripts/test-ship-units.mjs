#!/usr/bin/env node
// Every guard in `pnpm ship`, called directly on small fake builds: seconds, no site build and no network.
// scripts/test-ship-e2e.mjs proves the same guards are wired into a real run.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ShipFailure, ROOT, PRODUCTION_ALLOWED, LIVE_WORKER } from './ship/lib.mjs';
import { checkBuiltConfig, checkIndexable, checkNoindex, checkSourceConfig } from './ship/guard.mjs';
import { checkBudgets } from './ship/budgets.mjs';
import { checkClaims } from './ship/claims.mjs';
import { previewTarget, readPublished, uploadCommand } from './ship/deploy.mjs';
import { look, smoke } from './ship/smoke.mjs';
import { canonical, fetchSnapshot, hashOf, readAnonKey, TABLES } from './ship/fetch.mjs';
import { compareSnapshots, MAX_TOUCHED_SENTENCES, writeReport } from './ship/compare.mjs';
import { validateSnapshot } from './ship/validate.mjs';
import { doctor, fixture } from './ship-test/fixture.mjs';
import { bucketOf, wordSlug } from '../src/lib/words.mjs';
import { lettersMatch } from '../src/lib/snapshot.mjs';

let passed = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? `: ${detail}` : ''}`);
};
const refuses = (name, fn, pattern) => {
  try {
    fn();
    check(name, false, 'nothing stopped it');
  } catch (error) {
    if (!(error instanceof ShipFailure)) check(name, false, error.stack);
    else check(name, pattern.test(error.message), error.message.slice(0, 200));
  }
};
const allows = (name, fn) => {
  try {
    fn();
    check(name, true);
  } catch (error) {
    check(name, false, error.message.slice(0, 300));
  }
};

// A fake project: just what the guards read.
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-units-'));
let serial = 0;
const put = (root, file, text) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};
const HEAD = '<title>OpenArabic: Read the Classics</title>';
const page = (body = '', head = '') => `<!doctype html><html lang="en"><head>${HEAD}${head}</head><body>${body}</body></html>`;
function project(files = {}) {
  const root = path.join(TEMP, String((serial += 1)));
  for (const name of ['PRODUCT.md', 'DESIGN.md', 'docs/draft-copy.txt']) put(root, name, fs.readFileSync(path.join(ROOT, name), 'utf8'));
  put(root, 'dist/client/index.html', page());
  for (const [file, text] of Object.entries(files)) put(root, file, text);
  return root;
}

// ---- The Worker's name and routes
const BASE = { name: 'openarabic-site', workers_dev: true };
const LIVE = [{ pattern: 'openarabic.io', custom_domain: true }];
const source = (config) => project({ 'wrangler.jsonc': `// openarabic.io is named in this comment, on purpose.\n${JSON.stringify(config)}` });
allows('The clean config passes, its comment naming the live domain', () => checkSourceConfig(source(BASE)));
refuses('The live Worker name', () => checkSourceConfig(source({ ...BASE, name: LIVE_WORKER })), /names the Worker "openarabic-web"/);
refuses('Any other name', () => checkSourceConfig(source({ ...BASE, name: 'other' })), /names the Worker "other"/);
refuses('wrangler.jsonc missing', () => checkSourceConfig(project()), /wrangler\.jsonc is missing/);
refuses('Broken JSON', () => checkSourceConfig(project({ 'wrangler.jsonc': '{ "name": ' })), /doesn't parse/);
refuses('workers_dev off on a preview', () => checkSourceConfig(source({ ...BASE, workers_dev: false })), /workers_dev false/);
refuses('workers_dev off with no live domain, under --production', () => checkSourceConfig(source({ ...BASE, workers_dev: false }), true), /workers_dev false/);
allows('workers_dev off with the live domain, under --production', () => checkSourceConfig(source({ ...BASE, workers_dev: false, routes: LIVE }), true));
refuses('An environment that could carry another name', () => checkSourceConfig(source({ ...BASE, env: { prod: { name: LIVE_WORKER } } })), /defines environments/);
refuses('A service binding to the live Worker', () => checkSourceConfig(source({ ...BASE, services: [{ binding: 'OLD', service: LIVE_WORKER }] })), /refers to the live Worker/);
refuses('The live domain as a value', () => checkSourceConfig(source({ ...BASE, vars: { SITE: 'https://openarabic.io' } })), /mentions openarabic\.io/);
refuses('A route, on a preview', () => checkSourceConfig(source({ ...BASE, routes: ['example.com/*'] })), /holds a route/);
refuses('The live route, without --production', () => checkSourceConfig(source({ ...BASE, routes: LIVE })), /holds a route/);
allows('The live route, with --production', () => checkSourceConfig(source({ ...BASE, routes: LIVE }), true));
refuses('Any other route, even with --production', () => checkSourceConfig(source({ ...BASE, routes: [{ pattern: 'example.com', custom_domain: true }] }), true), /holds a route/);
refuses('The live route beside another, with --production', () => checkSourceConfig(source({ ...BASE, routes: [...LIVE, { pattern: 'example.com', custom_domain: true }] }), true), /holds a route/);
refuses('The old Worker name, with --production', () => checkSourceConfig(source({ ...BASE, name: LIVE_WORKER, routes: LIVE }), true), /names the Worker "openarabic-web"/);

const built = (config, redirect = '../../dist/server/wrangler.json') => project({ 'dist/server/wrangler.json': JSON.stringify(config), '.wrangler/deploy/config.json': JSON.stringify({ configPath: redirect }) });
allows('A clean built config passes', () => checkBuiltConfig(built(BASE)));
refuses('A wrong name only in the built config', () => checkBuiltConfig(built({ ...BASE, name: LIVE_WORKER })), /Built config dist\/server\/wrangler\.json names the Worker "openarabic-web"/);
refuses('A route only in the built config', () => checkBuiltConfig(built({ ...BASE, routes: ['x.example/*'] })), /Built config .* holds a route/);
refuses('The live domain only in the built config', () => checkBuiltConfig(built({ ...BASE, vars: { S: 'openarabic.io' } })), /mentions openarabic\.io/);
refuses("wrangler's redirect pointing at an unchecked config", () => checkBuiltConfig(built(BASE, '../../elsewhere.json')), /not a config this guard checked/);
refuses('No built config at all', () => checkBuiltConfig(project()), /No generated wrangler\.json/);
refuses('Upload refuses another name at the last step', () => uploadCommand({ file: 'x', name: LIVE_WORKER }), /Only "openarabic-site" may ship/);
check('The upload command takes no --name', !uploadCommand({ file: 'dist/server/wrangler.json', name: 'openarabic-site' }).includes('--name'));

// ---- Noindex, both ways
const META = '<meta name="robots" content="noindex, nofollow" />';
const HEADERS = '/*\n  X-Robots-Tag: noindex\n';
const pages = (root) => [path.join(root, 'dist/client/index.html')];
const preview = (headers, head) => project({ 'dist/client/_headers': headers, 'dist/client/index.html': page('', head) });
const previewOk = preview(HEADERS, META);
allows('A preview with the header and the meta passes', () => checkNoindex(pages(previewOk), previewOk));
const noHeader = preview('# none\n', META);
refuses('A preview with no header', () => checkNoindex(pages(noHeader), noHeader), /no "X-Robots-Tag: noindex"/);
const noMeta = preview(HEADERS, '');
refuses('A preview with no meta', () => checkNoindex(pages(noMeta), noMeta), /no noindex meta/);
const liveOk = preview('/word/*\n  Cache-Control: public\n', '');
allows('Production with neither passes', () => checkIndexable(pages(liveOk), liveOk));
const liveHeader = preview(HEADERS, '');
refuses('Production with the header left on', () => checkIndexable(pages(liveHeader), liveHeader), /would take the site out of Google/);
const liveMeta = preview('', META);
refuses('Production with the meta left on one page', () => checkIndexable(pages(liveMeta), liveMeta), /has a noindex meta on a production build/);

// ---- Budgets
const big = (bytes) => Array.from({ length: bytes }, (_, index) => ((index * 2654435761) % 4294967296).toString(36)).join('').slice(0, bytes);
const budget = (files) => checkBudgets(project(files));
allows('A plain page passes', () => budget({ 'dist/client/privacy.html': page() }));
refuses('A 2 KB script on a word page', () => budget({ 'dist/client/word/x-1.html': page(`<script>window.x='${big(4000)}'</script>`) }), /over its 0\.25 KB budget/);
refuses('An external script on a 0 JS page', () => budget({ 'dist/client/word/x-1.html': page('<script src="/a.js"></script>'), 'dist/client/a.js': '1' }), /allows only the inline D7 check/);
refuses('A third-party script', () => budget({ 'dist/client/read/x-1.html': page('<script src="https://example.com/a.js"></script>') }), /third-party resource/);
refuses('A third-party image', () => budget({ 'dist/client/privacy.html': page('<img src="https://example.com/a.png">') }), /third-party resource/);
refuses('Audio from another host', () => budget({ 'dist/client/privacy.html': page('<audio preload="none" src="https://example.com/a.mp3"></audio>') }), /third-party resource/);
refuses("Audio from the app's bucket that loads at once", () => budget({ 'dist/client/privacy.html': page('<audio preload="metadata" src="https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/audio/a.mp3"></audio>') }), /third-party resource/);
allows("Audio from the app's bucket, loading only on a press", () => budget({ 'dist/client/privacy.html': page('<audio preload="none" src="https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/audio/a.mp3"></audio>') }));
refuses('A script over the 1 KB reader budget', () => budget({ 'dist/client/read/x-1.html': page('<script src="/r.js"></script>'), 'dist/client/r.js': big(4000) }), /over the 1\.5 KB cap|over its 1\.25 KB budget/);
refuses('A home page over 60 KB of JS', () => budget({ 'dist/client/index.html': page(`<script>window.x='${big(120000)}'</script>`) }), /\/ \(home\) ships [\d.]+ KB of JS gzip, over its 60\.00 KB/);
refuses('CSS over 12 KB on another page', () => budget({ 'dist/client/privacy.html': page(`<style>${big(30000)}</style>`) }), /over the 12\.00 KB budget/);
refuses('Fonts over the first-view budget', () => budget({ 'dist/client/privacy.html': page('<style>@font-face{src:url(/f.woff2)}</style>'), 'dist/client/f.woff2': Buffer.alloc(120000) }), /over the 110\.00 KB first-view budget/);
refuses('A glossary over 25 KB', () => budget({ 'dist/client/gl/1.json': big(40000) }), /glossary brotli/);
refuses('A reader page over 12 KB', () => budget({ 'dist/client/read/x-1.html': page(big(20000)) }), /over the 12\.00 KB reader budget/);
refuses('A 26 MiB asset', () => budget({ 'dist/client/big.bin': Buffer.alloc(26 * 1024 * 1024) }), /over the 25 MiB limit/);

// ---- Claims
const claims = (body, head = '', extra = {}) => checkClaims(project({ 'dist/client/index.html': page(body, head), ...extra }));
allows('Ledger sentences pass', () => claims('<p>Free. No ads. No subscription.</p><p lang="ar" dir="rtl">وَإِذَا</p>'));
allows('Stored text needs no tracing', () => claims('<p data-stored>Any stored sentence.</p>'));
refuses('A sentence that traces to nothing', () => claims('<p>Our app changes lives.</p>'), /traces to nothing[\s\S]*"Our app changes lives\."/);
refuses('A ledger sentence with an added tail', () => claims('<p>Free. No ads. No subscription. Today only.</p>'), /traces to nothing[\s\S]*"Today only\."/);
refuses('English inside an Arabic run', () => claims('<div lang="ar"><p lang="en">Our app changes lives.</p></div>'), /traces to nothing/);
refuses('A draft word does not clear part of a longer word', () => claims('<p>Contactless</p>'), /traces to nothing[\s\S]*"Contactless"/);
refuses('An untraced aria-label', () => claims('<main aria-label="Made up label"></main>'), /traces to nothing[\s\S]*"Made up label"/);
refuses('"native audio"', () => claims('<p>Hear native audio.</p>'), /Banned phrases[\s\S]*"native audio"/);
refuses('"native audio" in an alt', () => claims('<img src="data:," alt="native audio">'), /Banned phrases/);
refuses('"Native Audio" split across a tag', () => claims('<p>Native <b>Audio</b></p>'), /Banned phrases/);
refuses('A banned phrase in the description', () => claims('', '<meta name="description" content="With native audio">'), /Banned phrases/);
refuses('A banned phrase in stored text', () => claims('<p data-stored>Hear native audio.</p>'), /Banned phrases/);
refuses('A banned phrase in a stored description', () => claims('', '<meta name="description" data-stored content="With native audio">'), /Banned phrases/);
refuses('A banned phrase listed as draft stays banned', () => claims('<p>Hear native audio.</p>', '', { 'docs/draft-copy.txt': 'Hear native audio.\n' }), /Banned phrases/);
refuses('"i+1" in copy', () => claims('<p>Input at i+1.</p>'), /Banned phrases[\s\S]*"i\+1"/);
refuses('A banned phrase in a text file', () => claims('', '', { 'dist/client/note.txt': 'free forever\n' }), /"free forever"/);
refuses('"side by side" in our own copy', () => claims('<p>side by side</p>'), /Banned phrases[\s\S]*"side by side"/);
allows('"side by side" in a stored grammar note', () => claims('<p data-stored>Two nouns side by side.</p>'));
allows('"side by side" on the book page', () => checkClaims(project({ 'dist/client/books/al-fawaid.html': page('<p>The Arabic and English sit side by side, with the English following the Arabic word order, so you can follow the original phrase by phrase. The PDF is free to share.</p>') })));
allows('A template around stored text', () => claims('<p>Texts by Someone - OpenArabic</p>'));
refuses('A template must match the whole string', () => claims('<p>Texts by Someone - OpenArabic, the best app</p>'), /traces to nothing/);

// ---- Deploy records and targets
const PREVIEW = 'https://openarabic-site.acc.workers.dev';
check('One preview URL is the target', previewTarget([PREVIEW]) === PREVIEW);
check('A preview refuses any other target', previewTarget([PREVIEW, 'openarabic.io (custom domain)']) === null);
check("Production checks the live domain, by wrangler's label", previewTarget([PREVIEW, 'openarabic.io (custom domain)'], true) === 'https://openarabic.io');
check('Production with workers.dev off still has somewhere to check', previewTarget(['openarabic.io (custom domain)'], true) === 'https://openarabic.io');
check('Production before the domain is attached checks workers.dev', previewTarget([PREVIEW], true) === PREVIEW);
check('Production refuses another domain', previewTarget([PREVIEW, 'example.com (custom domain)'], true) === null);
check('Two workers.dev URLs are refused', previewTarget([PREVIEW, 'https://openarabic-site.other.workers.dev']) === null);
check('Another Worker on workers.dev is refused', previewTarget(['https://openarabic-web.acc.workers.dev'], true) === null);
check("The real record's version is well formed", readPublished() !== undefined);
check('The production switch is unlocked, on the record', PRODUCTION_ALLOWED === true);

// ---- Smoke
const answer = (status, headers, body = '') => async () => new Response(body, { status, headers });
const noindexBody = '<meta name="robots" content="noindex"><p>x</p>';
check('Smoke: a good preview', (await look('https://x', { fetchImpl: answer(200, { 'x-robots-tag': 'noindex' }, noindexBody) })).length === 0);
check('Smoke: a preview with no header', (await look('https://x', { fetchImpl: answer(200, {}, noindexBody) })).some((p) => /no "X-Robots-Tag/.test(p)));
check('Smoke: a preview with no meta', (await look('https://x', { fetchImpl: answer(200, { 'x-robots-tag': 'noindex' }, '<p></p>') })).some((p) => /no noindex meta/.test(p)));
check('Smoke: a cookie', (await look('https://x', { fetchImpl: answer(200, { 'x-robots-tag': 'noindex', 'set-cookie': 'a=b' }, noindexBody) })).some((p) => /sets a cookie/.test(p)));
check('Smoke: a good production', (await look('https://x', { production: true, fetchImpl: answer(200, {}, '<p></p>') })).length === 0);
check('Smoke: production still with the header', (await look('https://x', { production: true, fetchImpl: answer(200, { 'x-robots-tag': 'noindex' }, '<p></p>') })).some((p) => /still says/.test(p)));
check('Smoke: production still with the meta', (await look('https://x', { production: true, fetchImpl: answer(200, {}, noindexBody) })).some((p) => /still has a noindex meta/.test(p)));
check('Smoke: another build', (await look('https://x', { expectedSha: 'a'.repeat(64), fetchImpl: answer(200, { 'x-robots-tag': 'noindex' }, noindexBody) })).some((p) => /expected build/.test(p)));
check('Smoke: gives up after its attempts', (await smoke('https://x', { attempts: 2, waitMs: 1, fetchImpl: answer(500, {}) })).ok === false);

// ---- Compare and validate
const inColumns = (db) => Object.fromEntries(Object.keys(TABLES).map((table) => [table, db[table].map((row) => Object.fromEntries(TABLES[table].map((column) => [column, row[column]])))]));
const snap = (db) => ({ format: 1, tables: inColumns(db), restricted: ['word_types'], rating: { store: 'us', average: 5 } });
const base = snap(fixture());
const edited = (change) => {
  const db = fixture();
  change(db);
  return snap(db);
};
const compared = (change) => compareSnapshots(base, edited(change));
check('Unchanged data', compareSnapshots(base, snap(fixture())).status === 'unchanged');
check('No baseline is held', compareSnapshots(null, base).status === 'held');
for (const [name, change, pattern] of [
  ['Changed sentences over the limit', doctor.changedSentences(MAX_TOUCHED_SENTENCES + 1), /touches \d+ existing sentences/],
  ['A changed attribution', doctor.attributionOnArticle, /Attribution changed/],
  ['A changed work name', (db) => { db.articles[0].book = 'Another Work'; }, /Attribution changed/],
  ['A changed author name', doctor.attributionOnAuthor, /Attribution changed/],
  ['One letter in the story line', doctor.oneLetterIn7106, /Protected content changed/],
  ['A word row of the story line', (db) => { db.sentence_words.find((w) => w.sentence_id === 7106).english = 'other'; }, /Protected content changed/],
  ['Unpublishing', (db) => { db.articles[1].published = false; }, /`published` changed/],
  ['A changed media URL', (db) => { db.roots[3].audio_url = 'other.mp3'; }, /A media URL changed/],
  ['A row count falling over 1%', (db) => { db.roots.splice(2, 4); }, /fell from 300 to 296/],
  ['A new word type id', (db) => { db.sentence_words[0].word_type_id = 77; }, /new since the baseline/],
]) {
  const result = compared(change);
  check(`Held: ${name}`, result.status === 'held' && result.reasons.some((reason) => pattern.test(reason)), result.reasons.join(' | '));
}
check('Changed sentences at the limit publish', compared(doctor.changedSentences(MAX_TOUCHED_SENTENCES)).status === 'publish');
check('A new article publishes, as growth', compared(doctor.newArticle).status === 'publish' && compared(doctor.newArticle).growth.articles === 1);
check("The spike's edit publishes", compared(doctor.spikeEdit).status === 'publish');
const noBook = fixture();
const withoutBook = snap(noBook);
for (const row of withoutBook.tables.articles) delete row.book;
const newColumn = compareSnapshots(withoutBook, base);
check('A column the baseline never had holds nothing, and is named', newColumn.status === 'publish' && newColumn.changes.length === 0 && newColumn.newColumns.includes('articles.book'));
const reportRoot = project();
const reportFile = writeReport(compared(doctor.spikeEdit), { hash: 'h', baselineHash: 'b' }, reportRoot);
check('The report lists field changes', /\| roots \| 14553 \| meaning \|/.test(fs.readFileSync(path.join(reportRoot, reportFile), 'utf8')));
check('Validate: clean', validateSnapshot(base).problems.length === 0);
check('Validate: a broken foreign key', validateSnapshot(edited(doctor.brokenForeignKey)).problems.length > 0);
const missing = snap(fixture());
delete missing.tables.roots;
check('Validate: a missing table', /Table roots is missing/.test(validateSnapshot(missing).problems.join(' ')));
check('Validate: a word form emptied since the baseline', /word_form was emptied/.test(validateSnapshot(edited((db) => { db.sentence_words[0].word_form = ''; }), base).problems.join(' ')));

// ---- Fetch, against a fake Supabase
process.env.OPENARABIC_ANON_KEY = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'anon', ref: 'kkmnzbeugdoajtzfjkxg' })).toString('base64url')}.NOTREAL`;
const small = () => {
  const db = fixture();
  return { ...db, roots: db.roots.slice(0, 3), article_sentences: db.article_sentences.slice(0, 3), sentence_words: db.sentence_words.slice(0, 3), articles: db.articles.slice(0, 3) };
};
function fakeSupabase(mode = {}) {
  const db = small();
  const methods = new Set();
  const counts = {};
  const impl = async (input, init = {}) => {
    const url = new URL(input);
    methods.add(init.method ?? 'GET');
    if (url.hostname === 'itunes.apple.com') return new Response(JSON.stringify({ results: [{ averageUserRating: 4.96 }] }));
    const table = url.pathname.split('/').pop();
    const rows = db[table] ?? [];
    if (mode.gone === table) return new Response('{}', { status: 404 });
    if (mode.refused === table) return new Response('{}', { status: 401 });
    if (init.method === 'HEAD') {
      counts[table] = (counts[table] ?? 0) + 1;
      return new Response(null, { headers: { 'content-range': `*/${rows.length + (mode.moving === table ? counts[table] : 0)}` } });
    }
    const after = Number(url.searchParams.get('id').slice(3));
    const columns = url.searchParams.get('select').split(',');
    let page = rows.filter((row) => row.id > after);
    if (mode.truncated === table) page = page.slice(0, -1);
    if (mode.emptied === table) page = [];
    if (mode.repeated === table) page = [...page, ...page];
    return new Response(JSON.stringify(page.map((row) => Object.fromEntries(columns.filter((c) => c !== mode.dropped).map((column) => [column, row[column]])))));
  };
  return { impl, methods };
}
const fetchRoot = project();
const fetchNow = (mode) => fetchSnapshot({ fetchImpl: fakeSupabase(mode).impl, root: fetchRoot, gapMs: 0 });
const first = await fetchNow();
const second = await fetchNow();
check('Two fetches of unchanged data give the same hash', first.hash === second.hash);
check('The snapshot is named by the hash of its bytes', hashOf(canonical(first.snapshot)) === first.hash);
check('The key is in no saved file', !fs.readFileSync(first.file, 'utf8').includes('NOTREAL'));
const reader = fakeSupabase();
await fetchSnapshot({ fetchImpl: reader.impl, root: fetchRoot, gapMs: 0 });
check('Only GET and HEAD are ever sent', [...reader.methods].every((method) => method === 'GET' || method === 'HEAD'));
for (const [name, mode, pattern] of [
  ['A truncated page', { truncated: 'roots' }, /truncated page/],
  ['A repeated page', { repeated: 'roots' }, /repeated or out-of-order/],
  ['A dropped column', { dropped: 'book' }, /not the expected set/],
  ['A count moving during the read', { moving: 'roots' }, /during the fetch, twice/],
  ['A deleted table', { gone: 'roots' }, /deleted table/],
  ['A refused key', { refused: 'roots' }, /PERMISSION FINDING/],
  ['A table emptied', { emptied: 'roots' }, /a truncated page|returned 0 rows/],
]) {
  const failed = await fetchNow(mode).then(() => null, (error) => error);
  check(`Fetch fails: ${name}`, failed instanceof ShipFailure && pattern.test(failed.message), failed?.message?.slice(0, 160));
}
process.env.OPENARABIC_ANON_KEY = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'service_role', ref: 'kkmnzbeugdoajtzfjkxg' })).toString('base64url')}.NOTREAL`;
refuses('A service key is refused, without saying what it was', () => readAnonKey(), /its role is "service_role"/);

// ---- Rules URLs and the reader depend on
check('A word slug keeps its shape', wordSlug({ id: 14553, meaning: 'Anas' }) === 'anas-14553');
check('A slug falls back when the meaning has no ASCII', wordSlug({ id: 7, meaning: 'كتاب' }) === 'word-7');
check('"to bring" files under B', bucketOf('to bring') === 'b');
check('Matching letters with different marks match', lettersMatch('كتاب', [{ word_form: 'كِتَابٌ' }]));
check('Different letters do not match', !lettersMatch('كتاب', [{ word_form: 'كنز' }]));
check('Empty word rows do not match', !lettersMatch('كتاب', [{ word_form: '' }]));

fs.rmSync(TEMP, { recursive: true, force: true });
for (const failure of failures) console.log(`FAIL ${failure}`);
console.log(`${passed}/${passed + failures.length} unit checks passed.`);
process.exit(failures.length > 0 ? 1 : 0);
