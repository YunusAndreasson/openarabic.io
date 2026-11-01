// Asserted from data: the parity test checks this count against the snapshot.
import { site } from '../lib/snapshot.mjs';
import { BUCKETS, CATEGORIES } from '../lib/words.mjs';

const SITE = 'https://openarabic.io';
const LEGAL = ['/download-app', '/dictionary', '/books/al-fawaid', '/privacy', '/terms', '/contact', '/account-deletion'];

export function GET() {
  const { words, articles, authors } = site().paths();
  const present = site().buckets();
  const categories = site().categories.filter((category) => CATEGORIES[category.name] && site().articlesIn(category.id).length > 0).map((category) => `/category/${category.name}`);
  const letters = BUCKETS.filter((bucket) => present.has(bucket)).map((bucket) => `/dictionary/${bucket}`);
  const paths = [...LEGAL, ...categories, ...authors, ...letters, ...articles, ...words];
  const body = [`${SITE}`, ...paths.map((path) => `${SITE}${path}`)].map((url) => `<url><loc>${url}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
}
