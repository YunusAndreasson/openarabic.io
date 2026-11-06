// Docs/site-plan.md `URL parity`: the old admin lines are gone, so Google can see the 404 for /login.
import type { APIRoute } from 'astro';
import { SITE } from '../lib/site.mjs';

export const GET = (() => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })) satisfies APIRoute;
