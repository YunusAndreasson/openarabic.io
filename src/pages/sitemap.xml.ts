// Asserted from data: the parity test checks this count against the snapshot.
import type { APIRoute } from 'astro';
import { site } from '../lib/snapshot.mjs';
import { SITE } from '../lib/site.mjs';
import { categoryPath, CATEGORIES } from '../lib/words.mjs';

const LEGAL = ['/download-app', '/dictionary', '/books/al-fawaid', '/privacy', '/terms', '/contact', '/account-deletion'];

export const GET = (() => {
  const { words, articles, authors } = site().paths();
  const categories = site()
    .categoriesWithTexts()
    .filter((category) => CATEGORIES[category.name])
    .map((category) => categoryPath(category.name));
  const letters = site().letters().map((letter) => `/dictionary/${letter}`);
  const paths = [...LEGAL, ...categories, ...authors, ...letters, ...articles, ...words];
  const body = [SITE, ...paths.map((path) => `${SITE}${path}`)].map((url) => `<url><loc>${url}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
}) satisfies APIRoute;
