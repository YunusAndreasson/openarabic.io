// Only what a file can't answer: AGENTS.md `Prerender or on-demand`, docs/site-plan.md `URL parity`.
// A prerendered page never reaches this. Everything else is a redirect, a real 404 or the store route.
import data from './generated/worker-data.json';
import { APP_STORE, PLAY_STORE } from './lib/site.mjs';
import { AUTHOR_MOVED, escapeAttribute, wordPath } from './lib/words.mjs';

interface Env {
  ASSETS: { fetch: (request: Request | URL | string) => Promise<Response> };
  COUNTS?: { writeDataPoint: (point: { blobs: string[]; indexes?: string[] }) => void };
}

// Only `pnpm ship --production` turns this off.
const PREVIEW = !__OA_PRODUCTION__;
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
const movedAuthors = AUTHOR_MOVED as Record<number, number>;

function finish(response: Response): Response {
  if (!PREVIEW) return response;
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}
const redirect = (status: number, location: string, headers: Record<string, string> = { 'Cache-Control': 'public, max-age=3600' }) =>
  finish(new Response(null, { status, headers: { Location: location, ...headers } }));
const html = (body: BodyInit | null, init: { status?: number; headers?: Record<string, string> } = {}) =>
  finish(new Response(body, { status: init.status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...init.headers } }));

async function notFound(request: Request, env: Env): Promise<Response> {
  const page = await env.ASSETS.fetch(new URL('/404', request.url));
  return html(request.method === 'HEAD' ? null : page.body, { status: 404 });
}

/** Strict: the trailing digits, or nothing. "not-a-slug" and "12abc" are real 404s. */
function trailingId(slug: string): number | null {
  const match = slug.match(/(?:^|-)(\d{1,9})$/);
  return match ? Number(match[1]) : null;
}

/** Only a known surface is ever passed on or counted. */
const surfaceOf = (from: string | null) => (from && SURFACES.has(from) ? from : null);

/** The plan's Apple and Play tokens: surface only, never a word or slug. Marketer links keep their tags. */
function storeUrl(store: 'ios' | 'android', from: string | null, params: URLSearchParams): string {
  const surface = surfaceOf(from);
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
    const referrer = tags.toString();
    if (referrer) url.searchParams.set('referrer', referrer);
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
    count(request, env, ['tap', to, surfaceOf(from) ?? 'none']);
    return redirect(302, storeUrl(to, from, url.searchParams), { 'Cache-Control': 'no-store' });
  }
  const agent = request.headers.get('user-agent') ?? '';
  if (BOT.test(agent)) return null;
  const store = /iPhone|iPad|iPod/.test(agent) ? 'ios' : /Android/.test(agent) ? 'android' : null;
  return store ? redirect(307, storeUrl(store, from, url.searchParams), { 'Cache-Control': 'no-store', Vary: 'User-Agent' }) : null;
}

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
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
  const list = hits.map((hit) => `<li><a href="${wordPath(hit)}"><span class="entry-ar" lang="ar" dir="rtl">${escapeAttribute(hit.letters)}</span> <span>${escapeAttribute(hit.meaning)}</span></a></li>`).join('');
  const results = hits.length > 0 ? `<ul class="entries">${list}</ul>` : '<p>No entries match. Try another word, or browse by letter.</p>';
  const filled = (await page.text()).replace('value=""', `value="${escapeAttribute(query)}"`).replace('<div id="results"></div>', () => `<div id="results">${results}</div>`);
  return html(filled, { headers: { 'Cache-Control': 'public, max-age=300' } });
}

/**
 * Static assets ignore Range and answer 200 with the whole file (measured on the preview, 2026-11-01), and iPhone Safari needs byte ranges to play audio.
 * Only for this site's own short tracks, which fit in memory: 2.6 MB at most.
 */
async function audioFile(request: Request, env: Env): Promise<Response> {
  const asset = await env.ASSETS.fetch(request);
  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (asset.status !== 200 || !range) {
    const whole = new Response(asset.body, asset);
    whole.headers.set('Accept-Ranges', 'bytes');
    return finish(whole);
  }
  const bytes = await asset.arrayBuffer();
  const size = bytes.byteLength;
  const start = range[1] === '' ? Math.max(0, size - Number(range[2])) : Number(range[1]);
  const end = range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);
  if (start > end || start >= size) return finish(new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } }));
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return finish(new Response(request.method === 'HEAD' ? null : bytes.slice(start, end + 1), { status: 206, headers }));
}

export default {
  async fetch(request: Request, env: Env, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // `pnpm dev` only: pages aren't files yet. The production bundle drops this branch and the import with it.
    if (import.meta.env.DEV && !/^\/(word|read|author)\/\d+$/.test(pathname) && pathname !== '/download-app' && pathname !== '/v' && !pathname.endsWith('.mp3')) {
      const { default: astro } = await import('@astrojs/cloudflare/entrypoints/server');
      return astro.fetch(request, env as never, ctx as never);
    }

    if (pathname.startsWith('/_astro/') && pathname.endsWith('.mp3')) return audioFile(request, env);

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
          if (word) return redirect(308, wordPath({ id, meaning: word.meaning }));
        } else if (route[1] === 'read') {
          if (articles[id]) return redirect(308, `/read/${articles[id]}`);
        } else {
          if (authors[id]) return redirect(308, `/author/${authors[id]}`);
          const moved = movedAuthors[id];
          if (moved && authors[moved]) return redirect(301, `/author/${authors[moved]}`);
          if (emptyAuthors.has(id)) return redirect(301, '/');
        }
      }
    }
    return notFound(request, env);
  },
};
