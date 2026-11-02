// Task 2.1: reads the content tables into one immutable snapshot file, named by its hash. READ ONLY: GET and
// HEAD, one at a time, at most 2 a second, with the public anon key. Rules: docs/site-plan.md `Ship`.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fail, ROOT } from './lib.mjs';

const PROJECT = 'kkmnzbeugdoajtzfjkxg';
export const SUPABASE_HOST = `${PROJECT}.supabase.co`;
const REST = `https://${SUPABASE_HOST}/rest/v1/`;
// Where the app's committed source holds the public key. Read only, and never printed or copied.
const KEY_SOURCE = '/home/yunus/Work/open-arabic/admin-dashboard/lib/supabase.ts';
const RATING_URL = 'https://itunes.apple.com/lookup?id=1594031029&country=us';

export const PAGE = 500;
// 500 ms is exactly the limit, so a little over: timers and clocks round.
export const MIN_GAP_MS = 510;

/** Explicit columns, in the order they are stored: a dropped column fails the read, and a new one can't move the hash. */
export const TABLES = {
  categories: ['id', 'name'],
  authors: ['id', 'name'],
  word_types: ['id', 'name'],
  articles: ['id', 'title', 'summary', 'author_id', 'category_id', 'book', 'content_hash', 'created_at', 'difficulty_level', 'image_url', 'audio_url', 'audio_url_bilingual', 'published'],
  article_sentences: ['id', 'arabic', 'english', 'article_id', 'position', 'audio_url', 'audio_url_bilingual', 'audio_url_english', 'arabic_repeat', 'english_repeat'],
  sentence_words: ['id', 'word_form', 'english', 'grammar_note', 'sentence_id', 'root_id', 'word_type_id', 'position', 'difficulty_level', 'audio_url'],
  roots: ['id', 'letters', 'meaning', 'audio_url', 'audio_url_en'],
};

/**
 * Stays signed-in only after the content write migration, so the anon key gets 200 with no rows and no error.
 * Only this table may come back empty, and its foreign key is then checked as far as the public key allows (validate.mjs).
 */
const SIGNED_IN_ONLY = new Set(['word_types']);

function claimsOf(key) {
  try {
    return JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  } catch {
    return null;
  }
}

/** The public key or nothing. A key with any other role stops the run, without saying what it was. */
export function readAnonKey() {
  let key = process.env.OPENARABIC_ANON_KEY;
  if (!key) {
    if (!fs.existsSync(KEY_SOURCE)) fail(`No public key: ${KEY_SOURCE} isn't on this machine and OPENARABIC_ANON_KEY isn't set. The app's committed source holds it.`);
    key = fs.readFileSync(KEY_SOURCE, 'utf8').match(/supabaseAnonKey =\s*'([^']+)'/)?.[1];
    if (!key) fail(`No public key found in ${KEY_SOURCE}. Its form changed, so nothing was fetched.`);
  }
  const claims = claimsOf(key);
  if (claims?.role !== 'anon') fail(`Refusing the Supabase key: its role is "${claims?.role ?? 'unreadable'}", and only the public anon key may be used.`);
  if (claims.ref !== PROJECT) fail(`Refusing the Supabase key: it's for another project.`);
  return key;
}

/** Sequential by construction, with starts at least MIN_GAP_MS apart, and only ever GET or HEAD. */
function client(key, fetchImpl, gapMs = MIN_GAP_MS) {
  let last = 0;
  const stats = { requests: 0, supabaseRequests: 0, bytes: 0 };
  const paced = async (url, init, what) => {
    const wait = last + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    stats.requests += 1;
    try {
      return await fetchImpl(url, init);
    } catch (error) {
      // The message is the cause alone. The key travels in a header, so it can't be in the URL or here.
      fail(`Fetch failed on ${what}: ${error.cause?.code ?? error.message}. A failed run publishes nothing.`);
    }
  };
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const refused = (status, what, detail = '') =>
    status === 401 || status === 403
      ? `PERMISSION FINDING: the public key is refused on ${what} (${status}${detail}). Nothing was worked around, and nothing is published. Report it to the owner.`
      : status === 404
        ? `${what} doesn't exist on the server (404${detail}): a deleted table. Nothing is published.`
        : `Fetch failed on ${what}: ${status}${detail}. A failed run publishes nothing.`;
  return {
    stats,
    paced,
    async count(table) {
      stats.supabaseRequests += 1;
      const response = await paced(`${REST}${table}?select=id`, { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } }, table);
      if (!response.ok) return { status: response.status, message: refused(response.status, table) };
      const total = response.headers.get('content-range')?.match(/\/(\d+)$/)?.[1];
      if (total === undefined) fail(`${table}: no exact count in the answer, so a short fetch couldn't be seen. Nothing is published.`);
      return { count: Number(total) };
    },
    async page(table, after) {
      stats.supabaseRequests += 1;
      const query = `select=${TABLES[table].join(',')}&id=gt.${after}&order=id.asc&limit=${PAGE}`;
      const response = await paced(`${REST}${table}?${query}`, { method: 'GET', headers }, table);
      const text = await response.text();
      if (!response.ok) {
        let code = '';
        try {
          const body = JSON.parse(text);
          code = body.code ? `, ${body.code}: ${String(body.message).slice(0, 120)}` : '';
        } catch {
          // No detail to add.
        }
        fail(refused(response.status, table, code));
      }
      stats.bytes += text.length;
      try {
        return JSON.parse(text);
      } catch {
        fail(`${table}: a page after id ${after} isn't valid JSON, so it's a partial page. Nothing is published.`);
      }
    },
  };
}

/** Rows rebuilt in the declared column order, so the bytes don't depend on how the server orders keys. */
function ordered(table, row) {
  const columns = TABLES[table];
  const keys = Object.keys(row);
  const missing = columns.filter((column) => !(column in row));
  if (missing.length > 0 || keys.length !== columns.length) fail(`${table}: row ${row.id} has columns ${keys.join(', ')}, not the expected set. Nothing is published.`);
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

async function readOnce(api, table) {
  const before = await api.count(table);
  if (before.message) {
    if (SIGNED_IN_ONLY.has(table) && (before.status === 401 || before.status === 403)) return { rows: [], restricted: true };
    fail(before.message);
  }
  const rows = [];
  let after = 0;
  const maxPages = Math.ceil(before.count / PAGE) + 2;
  for (let page = 0; ; page += 1) {
    if (page >= maxPages) fail(`${table}: still reading after ${page} pages for ${before.count} rows. Nothing is published.`);
    const got = await api.page(table, after);
    if (!Array.isArray(got)) fail(`${table}: a page after id ${after} isn't a list of rows. Nothing is published.`);
    if (got.length > PAGE) fail(`${table}: a page after id ${after} has ${got.length} rows, over the ${PAGE} asked for. Nothing is published.`);
    for (const row of got) {
      if (!Number.isInteger(row.id) || row.id <= after) fail(`${table}: row ${row.id} came back after ${after}: a repeated or out-of-order page. Nothing is published.`);
      after = row.id;
      rows.push(ordered(table, row));
    }
    if (got.length < PAGE) break;
  }
  const end = await api.count(table);
  if (end.message) fail(end.message);
  return { rows, before: before.count, after: end.count };
}

async function readTable(api, table) {
  let read = await readOnce(api, table);
  if (read.restricted) return read;
  // Differing counts mean content moved during the read: one retry, per the plan. A short page is not that, and fails below.
  if (read.before !== read.after) read = await readOnce(api, table);
  if (read.before !== read.after) fail(`${table}: exact count went from ${read.before} to ${read.after} during the fetch, twice. Nothing is published.`);
  if (read.rows.length !== read.after) fail(`${table}: read ${read.rows.length} rows against an exact count of ${read.after}: a truncated page. Nothing is published.`);
  if (read.rows.length === 0 && SIGNED_IN_ONLY.has(table)) return { rows: [], restricted: true };
  if (read.rows.length === 0) fail(`${table} returned 0 rows with no error. Either the table was emptied or the public key lost its read: PERMISSION FINDING until shown otherwise. Nothing is published.`);
  return read;
}

/** Rounded to what the page would show, and with no count: a new review shouldn't look like a content change. A failed lookup is null, and the page renders nothing. */
async function readRating(api) {
  try {
    const response = await api.paced(RATING_URL, { method: 'GET' }, 'the App Store rating');
    if (!response.ok) return null;
    const average = (await response.json())?.results?.[0]?.averageUserRating;
    return typeof average === 'number' ? { store: 'us', average: Math.round(average * 10) / 10 } : null;
  } catch {
    return null;
  }
}

export const canonical = ({ tables, restricted, rating }) =>
  JSON.stringify({ format: 1, tables: Object.fromEntries(Object.keys(TABLES).map((table) => [table, tables[table]])), restricted, rating });

export const hashOf = (bytes) => createHash('sha256').update(bytes).digest('hex');

export const snapshotDir = (root = ROOT) => path.join(root, '.ship/snapshots');

/** Written once and read-only after. The same hash means the same bytes, so an existing file is checked, never replaced. */
export function saveSnapshot(bytes, hash, root = ROOT) {
  const dir = snapshotDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${hash}.json`);
  if (fs.existsSync(file)) {
    if (hashOf(fs.readFileSync(file)) !== hash) fail(`${path.relative(root, file)} doesn't match its name. A snapshot was changed on disk, so stop and look.`);
    return file;
  }
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, bytes, { mode: 0o444 });
  fs.renameSync(temporary, file);
  return file;
}

/** The saved file, proved against its name before anything trusts it. */
export function readSnapshot(hash, root = ROOT) {
  const file = path.join(snapshotDir(root), `${hash}.json`);
  if (!fs.existsSync(file)) return null;
  const bytes = fs.readFileSync(file);
  if (hashOf(bytes) !== hash) fail(`${path.relative(root, file)} doesn't match its name. A snapshot was changed on disk, so stop and look.`);
  return JSON.parse(bytes.toString('utf8'));
}

export async function fetchSnapshot({ fetchImpl = globalThis.fetch, root = ROOT, gapMs = MIN_GAP_MS } = {}) {
  const started = Date.now();
  const key = readAnonKey();
  const api = client(key, fetchImpl, gapMs);
  const tables = {};
  const restricted = [];
  for (const table of Object.keys(TABLES)) {
    const read = await readTable(api, table);
    tables[table] = read.rows;
    if (read.restricted) restricted.push(table);
  }
  const rating = await readRating(api);
  const snapshot = { format: 1, tables, restricted, rating };
  const bytes = canonical(snapshot);
  if (bytes.includes(key)) fail('The snapshot holds the public key. Nothing was saved.');
  const hash = hashOf(bytes);
  const file = saveSnapshot(bytes, hash, root);
  const meta = {
    hash,
    fetchedAt: new Date().toISOString(),
    ms: Date.now() - started,
    requests: api.stats.requests,
    supabaseRequests: api.stats.supabaseRequests,
    bytes: Buffer.byteLength(bytes),
    rows: Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length])),
    restricted,
    rating,
  };
  // Beside the snapshot and not in it: a time inside would give unchanged data a new hash.
  fs.writeFileSync(path.join(snapshotDir(root), `${hash}.meta.json`), `${JSON.stringify(meta, null, 2)}\n`);
  return { snapshot, hash, file, meta };
}
