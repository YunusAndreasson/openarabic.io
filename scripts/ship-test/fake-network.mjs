// Loaded only into `pnpm ship:test` runs, with --import: the ship has no switch of its own for any of this.
// Answers for the preview, Supabase and the App Store from local files, and refuses every other remote host, so no test can reach the network.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import timers from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const real = globalThis.fetch;
const previous = process.env.STUB_PREVIOUS_BODY ?? '';
const [dbMode, dbTable] = (process.env.STUB_DB ?? '').split(':');
const hits = new Map();
const log = (method, url, headers) => {
  if (process.env.STUB_LOG) fs.appendFileSync(process.env.STUB_LOG, `${Date.now()} ${method} ${url} key=${headers?.apikey ? 'sent' : 'none'}\n`);
};

// Real pacing is proved once, on its own. Every other run in the suite would otherwise wait out its 150 requests.
if (!process.env.STUB_REAL_PACING && process.argv[1]?.endsWith('ship.mjs')) {
  const wait = timers.setTimeout;
  timers.setTimeout = (ms, value) => wait(Math.min(ms, 5), value);
  syncBuiltinESMExports();
}

function supabase(url, init) {
  const method = init?.method ?? 'GET';
  // Article images: none in the fixture, and an image that can't be read only costs its picture.
  if (url.pathname.startsWith('/storage/')) return new Response(null, { status: 404 });
  log(method, url.pathname + url.search, init?.headers);
  if (method !== 'GET' && method !== 'HEAD') throw new Error(`A write reached the fake Supabase: ${method}`);
  const table = url.pathname.split('/').pop();
  const db = JSON.parse(fs.readFileSync('fake-db.json', 'utf8'));
  const targeted = dbTable === table;
  if (targeted && dbMode === 'gone') return new Response(method === 'HEAD' ? null : JSON.stringify({ code: 'PGRST205', message: 'not found' }), { status: 404 });
  if (targeted && dbMode === 'refused') return new Response(method === 'HEAD' ? null : JSON.stringify({ code: '42501', message: 'permission denied' }), { status: 401 });
  if (targeted && dbMode === 'server-error' && method === 'GET') return new Response('{}', { status: 500 });
  const rows = !db[table] || (targeted && dbMode === 'emptied') ? [] : db[table];
  if (method === 'HEAD') {
    const seen = (hits.get(table) ?? 0) + 1;
    hits.set(table, seen);
    let total = rows.length;
    if (targeted && dbMode === 'moving') total += seen;
    if (targeted && dbMode === 'moved-once' && seen === 1) total += 1;
    return new Response(null, { status: 200, headers: { 'content-range': `*/${total}` } });
  }
  const after = Number(url.searchParams.get('id').slice(3));
  const limit = Number(url.searchParams.get('limit'));
  const columns = url.searchParams.get('select').split(',');
  let page = rows.filter((row) => row.id > after).slice(0, limit);
  if (targeted && dbMode === 'truncated' && after > 0 && page.length === limit) page = page.slice(0, limit - 100);
  if (targeted && dbMode === 'repeated' && after > 0) page = rows.slice(0, limit);
  if (targeted && dbMode === 'dropped-column') page = page.map(({ [columns.at(-1)]: _gone, ...rest }) => rest);
  return new Response(JSON.stringify(page.map((row) => (targeted && dbMode === 'dropped-column' ? row : Object.fromEntries(columns.map((column) => [column, row[column]]))))), { status: 200 });
}

let local;
async function edge(route, url, init) {
  let mode = process.env.STUB_EDGE ?? 'ok';
  const rolled = fs.existsSync('wrangler-spy.log') && fs.readFileSync('wrangler-spy.log', 'utf8').includes('rollback ');
  if (mode === 'bad-until-rollback') mode = rolled ? 'previous' : 'no-header';
  if (mode === 'previous' && route === '/') return new Response(previous, { headers: { 'x-robots-tag': 'noindex' } });
  if (route === '/' && !url.search) return new Response(fs.readFileSync('dist/client/index.html'), { headers: mode === 'no-header' ? {} : { 'x-robots-tag': 'noindex' } });
  // The real Worker over the built files, so the preview's parity run means something here too.
  if (!local) local = await (await import(pathToFileURL(`${process.cwd()}/scripts/ship/parity.mjs`).href)).localWorker(process.cwd());
  const answer = await local(url.href, { redirect: 'manual', headers: init?.headers });
  const headers = new Headers(answer.headers);
  if (mode === 'no-header') headers.delete('x-robots-tag');
  else headers.set('x-robots-tag', 'noindex');
  return new Response(answer.body, { status: answer.status, headers });
}

globalThis.fetch = async (input, init) => {
  const url = new URL(String(input?.url ?? input));
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return real(input, init);
  if (url.hostname.endsWith('.workers.dev')) return edge(url.pathname, url, init);
  if (url.hostname.endsWith('.supabase.co')) return supabase(url, init);
  if (url.hostname === 'itunes.apple.com') {
    log('GET', url.pathname, init?.headers);
    if (process.env.STUB_RATING === 'fail') throw new TypeError('fetch failed');
    return new Response(JSON.stringify({ results: [{ averageUserRating: 4.96, userRatingCount: 12 }] }));
  }
  throw new Error(`pnpm ship:test reached for the network: ${url.host}`);
};
