// Only what a file can't answer: AGENTS.md `Prerender or on-demand`, docs/site-plan.md `URL parity`.
// A prerendered page never reaches this. Everything else is a redirect, a real 404 or the store route.
import data from './generated/worker-data.json';
import { slugifyText } from './lib/words.mjs';

interface Env {
  ASSETS: { fetch: (request: Request | URL | string) => Promise<Response> };
  COUNTS?: { writeDataPoint: (point: { blobs: string[]; indexes?: string[] }) => void };
}

// Removed only by the explicit production flag at the cutover.
const PREVIEW = true;
const APP_STORE = 'https://apps.apple.com/app/openarabic/id1594031029';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.edenmind.OpenArabic';
const SURFACES = new Set(['home', 'word', 'read', 'book', 'qr', 'download']);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse|bingpreview|whatsapp|telegram/i;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const SAFE = /^[\w.~-]{1,100}$/;
const APPLE_TOKEN = 30;

const words = new Map(data.words.map(([id, letters, meaning]) => [id as number, { letters: letters as string, meaning: meaning as string }]));
const articles = data.articles as Record<string, string>;
const authors = data.authors as Record<string, string>;
const categories = data.categories as Record<string, string>;
const emptyAuthors = new Set(data.emptyAuthors);

function finish(response: Response): Response {
  if (!PREVIEW) return response;
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}
const redirect = (status: number, location: string) => finish(new Response(null, { status, headers: { Location: location, 'Cache-Control': 'public, max-age=3600' } }));

async function notFound(request: Request, env: Env): Promise<Response> {
  const page = await env.ASSETS.fetch(new URL('/404', request.url));
  return finish(new Response(request.method === 'HEAD' ? null : page.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
}

/** Strict: the trailing digits, or nothing. "not-a-slug" and "12abc" are real 404s. */
function trailingId(slug: string): number | null {
  const match = slug.match(/(?:^|-)(\d{1,9})$/);
  return match ? Number(match[1]) : null;
}

/** The plan's Apple and Play tokens: surface only, never a word or slug. Marketer links keep their tags. */
function storeUrl(store: 'ios' | 'android', from: string | null, params: URLSearchParams): string {
  const surface = from && SURFACES.has(from) ? from : null;
  if (store === 'android') {
    const url = new URL(PLAY_STORE);
    const tags = new URLSearchParams();
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value && SAFE.test(value)) tags.set(key, value);
    }
    if (surface && !tags.has('utm_source')) {
      tags.set('utm_source', 'web');
      tags.set('utm_campaign', surface);
    }
    if ([...tags].length > 0) url.searchParams.set('referrer', tags.toString());
    return url.toString();
  }
  // Apple ignores `ct` without the provider token, which the owner generates. Until then the link stays plain.
  const token = (globalThis as { APPLE_PROVIDER_TOKEN?: string }).APPLE_PROVIDER_TOKEN;
  const url = new URL(APP_STORE);
  if (token) {
    const campaign = params.get('utm_campaign');
    url.searchParams.set('pt', token);
    url.searchParams.set('ct', (campaign && SAFE.test(campaign) ? campaign : `web-${surface ?? 'site'}`).slice(0, APPLE_TOKEN));
    url.searchParams.set('mt', '8');
  }
  return url.toString();
}

// 1×1 transparent GIF. docs/decisions/2026-11-01-counters.md.
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (char) => char.charCodeAt(0));
const PAGE_TYPES = new Set(['home', 'word', 'read', 'dictionary', 'category', 'author', 'book', 'download', 'legal', 'other']);

/** Stores an event and a page type or store and surface, with Analytics Engine's own timestamp. Never an IP, user agent, word, slug or country. */
function count(request: Request, env: Env, blobs: string[]) {
  if (request.method !== 'GET' || BOT.test(request.headers.get('user-agent') ?? '')) return;
  env.COUNTS?.writeDataPoint({ blobs, indexes: [blobs[0]] });
}

function downloadRoute(request: Request, url: URL, env: Env): Response | null {
  const to = url.searchParams.get('to');
  const from = url.searchParams.get('from');
  if (to === 'ios' || to === 'android') {
    const surface = from && SURFACES.has(from) ? from : 'none';
    count(request, env, ['tap', to, surface]);
    return finish(new Response(null, { status: 302, headers: { Location: storeUrl(to, from, url.searchParams), 'Cache-Control': 'no-store' } }));
  }
  const agent = request.headers.get('user-agent') ?? '';
  if (BOT.test(agent)) return null;
  const store = /iPhone|iPad|iPod/.test(agent) ? 'ios' : /Android/.test(agent) ? 'android' : null;
  return store ? finish(new Response(null, { status: 307, headers: { Location: storeUrl(store, from, url.searchParams), 'Cache-Control': 'no-store', Vary: 'User-Agent' } })) : null;
}

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MAX_RESULTS = 40;

/** docs/decisions/2026-11-01-dictionary-search.md: the bundled index, no Supabase read. Bare letters are for comparing only. */
function search(query: string) {
  const lower = query.toLowerCase();
  const arabic = /[؀-ۿ]/.test(query);
  const bare = query.replace(MARKS, '');
  const hits: { id: number; letters: string; meaning: string; rank: number }[] = [];
  for (const [id, { letters, meaning }] of words) {
    const text = meaning.toLowerCase();
    const found = arabic ? letters.replace(MARKS, '').includes(bare) : text.includes(lower);
    if (found) hits.push({ id, letters, meaning, rank: text === lower ? 0 : text.startsWith(lower) ? 1 : 2 });
  }
  return hits.sort((a, b) => a.rank - b.rank || a.meaning.localeCompare(b.meaning)).slice(0, MAX_RESULTS);
}

async function searchPage(request: Request, url: URL, env: Env): Promise<Response> {
  const page = await env.ASSETS.fetch(new URL('/dictionary/search', request.url));
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
  if (!query) return finish(new Response(page.body, page));
  const hits = search(query);
  const list = hits.map((hit) => `<li><a href="/word/${slugifyText(hit.meaning) || 'word'}-${hit.id}"><span class="entry-ar" lang="ar" dir="rtl">${escapeHtml(hit.letters)}</span> <span>${escapeHtml(hit.meaning)}</span></a></li>`).join('');
  const results = hits.length > 0 ? `<ul class="entries">${list}</ul>` : '<p>No entries match. Try another word, or browse by letter.</p>';
  const html = (await page.text()).replace('value=""', `value="${escapeHtml(query)}"`).replace('<div id="results"></div>', () => `<div id="results">${results}</div>`);
  return finish(new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } }));
}

export default {
  async fetch(request: Request, env: Env, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // `pnpm dev` only: pages aren't files yet. The production bundle drops this branch and the import with it.
    if (import.meta.env.DEV && !/^\/(word|read|author)\/\d+$/.test(pathname) && pathname !== '/download-app' && pathname !== '/v') {
      const { default: astro } = await import('@astrojs/cloudflare/entrypoints/server');
      return astro.fetch(request, env as never, ctx as never);
    }

    if (pathname.length > 1 && pathname.endsWith('/')) return redirect(308, pathname.replace(/\/+$/, '') + url.search);

    if (pathname === '/') {
      const category = url.searchParams.get('category');
      if (category !== null) {
        const name = categories[category];
        url.searchParams.delete('category');
        return redirect(301, (name ? `/category/${name}` : '/') + url.search);
      }
      return finish(await env.ASSETS.fetch(request));
    }

    if (pathname === '/v') {
      const type = url.searchParams.get('p') ?? 'other';
      count(request, env, ['view', PAGE_TYPES.has(type) ? type : 'other']);
      return finish(new Response(PIXEL, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' } }));
    }

    if (pathname === '/download-app') {
      const response = downloadRoute(request, url, env);
      if (response) return response;
      return finish(await env.ASSETS.fetch(new URL('/download-app', request.url)));
    }
    if (pathname === '/dictionary/search') return searchPage(request, url, env);

    const route = pathname.match(/^\/(word|read|author)\/([^/]+)$/);
    if (route) {
      const id = trailingId(route[2]);
      if (id !== null) {
        if (route[1] === 'word') {
          const word = words.get(id);
          if (word) return redirect(308, `/word/${slugifyText(word.meaning) || 'word'}-${id}`);
        } else if (route[1] === 'read') {
          if (articles[id]) return redirect(308, `/read/${articles[id]}`);
        } else {
          if (authors[id]) return redirect(308, `/author/${authors[id]}`);
          if (id === 106 && authors[16]) return redirect(301, `/author/${authors[16]}`);
          if (emptyAuthors.has(id)) return redirect(301, '/');
        }
      }
    }
    return notFound(request, env);
  },
};
