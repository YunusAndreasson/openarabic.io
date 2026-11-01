// Task 2.7, docs/site-plan.md `URL parity`. The frozen sitemap and every odd case, offline on the build and again on the preview.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fail, ROOT, walk } from './lib.mjs';
import { NOINDEX_META } from './smoke.mjs';
import { routeOf } from './budgets.mjs';
import { slugifyText } from '../../src/lib/words.mjs';

const LIST = 'docs/research/parity/sitemap-2026-11-01.txt';
const OUTSIDE = 'docs/research/parity/outside-sitemap-2026-11-01.txt';
const SITE = 'https://openarabic.io';
const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf' };

const read = (file, root) => fs.readFileSync(path.join(root, file), 'utf8');
const lines = (text) => text.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
const trailing = (route) => Number(route.match(/-(\d+)$/)?.[1]);
const wordPath = ([id, , meaning]) => `/word/${slugifyText(meaning) || 'word'}-${id}`;

/** Every row of the plan's table, as [route, status, location]. Ids in the odd cases come from the data, so a test fixture runs the same table. */
export function expectations(root = ROOT) {
  const data = JSON.parse(read('src/generated/worker-data.json', root));
  const cases = [];
  const expect = (route, status, location = null) => cases.push({ route, status, location });
  const categoryIds = Object.keys(data.categories);

  // The frozen list writes the home page as an empty line.
  expect('/', 200);
  // Frozen against the data of its day, so content can move on: a renamed word or article answers with its new URL, and a removed text with a 404. New pages come from the data below.
  const words = new Map(data.words.map((row) => [row[0], row]));
  const byId = (route, current) => {
    if (!current) return expect(route, 404);
    return current === route ? expect(route, 200) : expect(route, 308, current);
  };
  for (const route of lines(read(LIST, root))) {
    if (route === '/') continue;
    if (route.startsWith('/?category=')) {
      const name = data.categories[route.split('=')[1]];
      expect(route, 301, name ? `/category/${name}` : '/');
    } else if (route.startsWith('/read/')) {
      const slug = data.articles[trailing(route)];
      byId(route, slug && `/read/${slug}`);
    } else if (route.startsWith('/word/')) {
      const row = words.get(trailing(route));
      byId(route, row && wordPath(row));
    } else if (route.startsWith('/author/')) {
      const id = trailing(route);
      if (data.authors[id]) byId(route, `/author/${data.authors[id]}`);
      else if (id === 106) expect(route, 301, `/author/${data.authors[16]}`);
      else expect(route, 301, '/');
    } else if (route.startsWith('/dictionary/') && !fs.existsSync(path.join(root, 'dist/client', `${route}.html`))) expect(route, 404);
    else expect(route, 200);
  }
  for (const row of data.words) expect(wordPath(row), 200);
  for (const slug of Object.values(data.articles)) expect(`/read/${slug}`, 200);
  for (const slug of Object.values(data.authors)) expect(`/author/${slug}`, 200);
  // Stale slugs with an id that still exists go to the current URL. The PDF stays. Everything else, junk included, is a real 404.
  for (const route of lines(fs.existsSync(path.join(root, OUTSIDE)) ? read(OUTSIDE, root) : '')) {
    if (route === '/books/al-fawaid.pdf') continue;
    const match = route.match(/^\/(word|read)\/.*?(?:^|[/-])(\d+)$/);
    const id = match && Number(match[2]);
    if (match?.[1] === 'word' && words.has(id)) expect(route, 308, wordPath(words.get(id)));
    else if (match?.[1] === 'read' && data.articles[id]) expect(route, 308, `/read/${data.articles[id]}`);
    else expect(route, 404);
  }

  const word = data.words[0];
  const articleId = Object.keys(data.articles)[0];
  const authorId = Object.keys(data.authors)[0];
  if (categoryIds[0]) {
    expect(`/?category=${categoryIds[0]}&utm_source=x`, 301, `/category/${data.categories[categoryIds[0]]}?utm_source=x`);
    for (const bad of ['99', 'abc', '']) expect(`/?category=${bad}`, 301, '/');
  }
  expect('/?utm_source=x', 200);
  expect('/?code=x', 200);
  if (word) {
    expect(`/word/${word[0]}`, 308, wordPath(word));
    expect(`/word/old-${word[0]}`, 308, wordPath(word));
    expect(`${wordPath(word)}/`, 308, wordPath(word));
    expect(`/word/${slugifyText(word[2]) || 'word'}-99999999`, 404);
  }
  if (articleId) {
    expect(`/read/${articleId}`, 308, `/read/${data.articles[articleId]}`);
    expect(`/read/old-title-${articleId}`, 308, `/read/${data.articles[articleId]}`);
  }
  if (authorId) expect(`/author/old-${authorId}`, 308, `/author/${data.authors[authorId]}`);
  for (const route of ['/read/1', '/read/not-a-slug', '/word/not-a-slug', '/hadith/abu-dawud', '/login', '/admin', '/admin/articles', '/articles', '/articles/1', '/images', '/ai-test', '/api/ai/generate', '/.well-known/apple-app-site-association', '/.well-known/assetlinks.json']) expect(route, 404);
  expect('/books/al-fawaid.pdf', 200);
  expect('/robots.txt', 200);
  expect('/sitemap.xml', 200);
  expect('/manifest.webmanifest', 200);
  expect('/dictionary/search', 200);
  expect('/dictionary/search?q=a', 200);
  expect('/download-app', 200);
  expect('/v?p=word', 200);
  const PLAY = 'https://play.google.com/store/apps/details?id=com.edenmind.OpenArabic';
  const APPLE = 'https://apps.apple.com/app/openarabic/id1594031029';
  const phone = (agent) => ({ agent });
  cases.push({ route: '/download-app', status: 307, location: APPLE, ...phone('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)') });
  cases.push({ route: '/download-app', status: 307, location: PLAY, ...phone('Mozilla/5.0 (Linux; Android 14; Pixel 8)') });
  cases.push({ route: '/download-app', status: 200, location: null, ...phone('Mozilla/5.0 (X11; Linux x86_64)') });
  cases.push({ route: '/download-app', status: 200, location: null, ...phone('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) Chrome/120 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)') });
  expect('/download-app?to=ios&from=word', 302, APPLE);
  expect('/download-app?to=android&from=read', 302, `${PLAY}&referrer=utm_source%3Dweb%26utm_campaign%3Dread`);
  expect('/download-app?to=android&utm_source=instagram&utm_campaign=bio', 302, `${PLAY}&referrer=utm_source%3Dinstagram%26utm_campaign%3Dbio`);
  // One row per URL and asker: a page both frozen and in today's data is asked once.
  const seen = new Set();
  return cases.filter((item) => {
    const key = `${item.route} ${item.agent ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Runs the table against anything that answers fetch. A preview also has to say noindex and set no cookie on every answer. */
export async function runParity(origin, fetchImpl, { root = ROOT, concurrency = 12, headers = false } = {}) {
  const cases = expectations(root);
  const failures = [];
  let next = 0;
  const one = async (item) => {
    let response;
    for (let attempt = 1; ; attempt += 1) {
      try {
        response = await fetchImpl(`${origin}${item.route}`, { redirect: 'manual', signal: AbortSignal.timeout(30_000), ...(item.agent && { headers: { 'user-agent': item.agent } }) });
        if (response.status < 500 || attempt >= 3) break;
        await response.body?.cancel();
      } catch (error) {
        if (attempt >= 3) return `${item.route}: no answer, ${error.cause?.code ?? error.name}`;
      }
    }
    await response.body?.cancel();
    if (response.status !== item.status) return `${item.route}: answered ${response.status}, wanted ${item.status}`;
    if (item.location !== null) {
      const location = response.headers.get('location') ?? '';
      const got = location.startsWith(origin) ? location.slice(origin.length) : location;
      if (got !== item.location) return `${item.route}: went to "${got}", wanted "${item.location}"`;
    }
    if (headers && item.route === '/v?p=word' && !/no-store/.test(response.headers.get('cache-control') ?? '')) return `${item.route}: not no-store`;
    if (headers && !/\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? '')) return `${item.route}: no "X-Robots-Tag: noindex"`;
    if (headers && response.headers.has('set-cookie')) return `${item.route}: sets a cookie`;
    return null;
  };
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < cases.length) {
        const problem = await one(cases[next++]);
        if (problem) failures.push(problem);
      }
    }),
  );
  return { checked: cases.length, failures };
}

/**
 * The real Worker bundle over the real built files, in this process, with wrangler's rule for which answers first.
 * The preview run is what proves the platform. This one stops a bad build before any upload.
 */
export async function localWorker(root = ROOT) {
  const client = path.join(root, 'dist/client');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'dist/server/wrangler.json'), 'utf8'));
  const first = (config.assets?.run_worker_first ?? []).map((pattern) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`));
  const fileFor = (pathname) => {
    const base = path.join(client, decodeURIComponent(pathname));
    if (!base.startsWith(client)) return null;
    if (pathname === '/') return path.join(client, 'index.html');
    return [base, `${base}.html`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
  };
  const asset = (pathname) => {
    const file = fileFor(pathname);
    if (!file) return new Response(null, { status: 404 });
    return new Response(fs.readFileSync(file), { headers: { 'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' } });
  };
  const env = { ASSETS: { fetch: async (input) => asset(new URL(input.url ?? input).pathname) } };
  // The bundle's one platform import is for side effects Node has no use for. Anything else it imported would fail here, loudly.
  const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-parity-')), 'entry.mjs');
  fs.writeFileSync(copy, fs.readFileSync(path.join(root, 'dist/server', config.main), 'utf8').replace(/^import "cloudflare:[^"]+";?$/m, ''));
  const worker = (await import(pathToFileURL(copy).href)).default;
  fs.rmSync(path.dirname(copy), { recursive: true, force: true });
  return async (input, init) => {
    const request = new Request(input, init);
    const { pathname } = new URL(request.url);
    if (!first.some((pattern) => pattern.test(pathname)) && fileFor(pathname) && !pathname.endsWith('/')) return asset(pathname);
    return worker.fetch(request, env, {});
  };
}

const COUNT = (html, pattern) => (html.match(pattern) ?? []).length;
const GLOBAL_TYPES = ['Organization', 'WebSite', 'MobileApplication', 'Offer', 'ImageObject', 'Person'];
const ROUTE_TYPES = [
  [/^\/word\//, ['DefinedTerm', 'DefinedTermSet', 'BreadcrumbList']],
  [/^\/read\//, ['Article', 'BreadcrumbList']],
  [/^\/author\//, ['ProfilePage', 'ItemList', 'ListItem']],
  [/^\/category\//, ['CollectionPage', 'ItemList', 'ListItem']],
  [/^\/dictionary(\/(?!search).*)?$/, ['CollectionPage', 'BreadcrumbList']],
  [/^\/books\/al-fawaid$/, ['Book']],
];

/** The plan's "passes when": title, canonical and JSON-LD on every page in the build, in full. */
export function checkBuiltPages(root = ROOT) {
  const client = path.join(root, 'dist/client');
  const pages = walk(client).filter((file) => file.endsWith('.html'));
  const problems = [];
  for (const file of pages) {
    const route = routeOf(file, client);
    const html = fs.readFileSync(file, 'utf8');
    const end = html.indexOf('</head>');
    const head = html.slice(0, end);
    const body = html.slice(end);
    if (COUNT(head, /<title>/g) !== 1 || COUNT(body, /<title>/g) !== 0) problems.push(`${route}: not one <title> in <head>`);
    if (!NOINDEX_META.test(head)) problems.push(`${route}: no noindex meta on the preview`);
    if (/aggregateRating/.test(html)) problems.push(`${route}: aggregateRating`);
    if (route === '/404') continue;
    const canonical = head.match(/<link rel="canonical" href="([^"]+)"/g) ?? [];
    const wanted = route === '/' ? SITE : `${SITE}${route}`;
    if (canonical.length !== 1 || !canonical[0].includes(`"${wanted}"`)) problems.push(`${route}: canonical ${canonical.join(' ') || 'missing'}, wanted ${wanted}`);
    if (/rel="canonical"/.test(body)) problems.push(`${route}: a canonical in <body>`);
    const ld = head.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (!ld) {
      problems.push(`${route}: no JSON-LD in <head>`);
      continue;
    }
    const types = new Set([...ld[1].matchAll(/"@type":"(\w+)"/g)].map((match) => match[1]));
    const wantedTypes = [...GLOBAL_TYPES, ...(ROUTE_TYPES.find(([pattern]) => pattern.test(route))?.[1] ?? [])];
    for (const type of wantedTypes) if (!types.has(type)) problems.push(`${route}: JSON-LD has no ${type}`);
  }
  const expected = expectations(root).filter((item) => item.status === 200 && !item.agent && !/[?]|\.(pdf|txt|xml|webmanifest)$|^\/dictionary\/search$/.test(item.route));
  const sitemap = [...read('dist/client/sitemap.xml', root).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(SITE, '') || '/');
  const inSitemap = new Set(sitemap);
  if (inSitemap.size !== sitemap.length) problems.push('sitemap.xml holds duplicates');
  for (const item of expected) if (!inSitemap.has(item.route)) problems.push(`sitemap.xml has no ${item.route}`);
  // Every URL in the sitemap has to be a real page, and only the data can add one.
  for (const route of sitemap) if (!fs.existsSync(path.join(root, 'dist/client', route === '/' ? 'index.html' : `${route}.html`))) problems.push(`sitemap.xml has ${route}, with no page behind it`);
  return { pages: pages.length, sitemap: sitemap.length, problems };
}

export function requireParity({ checked, failures }, built = null) {
  const all = [...failures, ...(built?.problems ?? [])];
  if (all.length > 0) fail(`URL parity failed on ${all.length} of ${checked}:\n  ${all.slice(0, 25).join('\n  ')}`);
}
