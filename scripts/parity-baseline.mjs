#!/usr/bin/env node
// Plan task 2.7: what the live site says, saved before it can't be read. GET only, one at a time, about 1 request per 1.3 s, 30 per route type.
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const ORIGIN = 'https://openarabic.io';
const list = fs.readFileSync('docs/research/parity/sitemap-2026-11-01.txt', 'utf8').split('\n').map((line) => line.trim()).filter(Boolean);
const TYPES = { word: /^\/word\//, read: /^\/read\//, author: /^\/author\//, letter: /^\/dictionary\/./, category: /^\/\?category=/ };
const seeded = (items, count) => {
  let seed = 20261101;
  const pool = [...items];
  const out = [];
  while (out.length < count && pool.length > 0) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    out.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return out;
};
const single = ['/', '/dictionary', '/books/al-fawaid', '/download-app', '/privacy', '/terms', '/contact', '/account-deletion', '/dictionary/search'];
const routes = [...single, ...Object.values(TYPES).flatMap((pattern) => seeded(list.filter((route) => pattern.test(route)), 30))];
const pages = [];
for (const route of routes) {
  const started = Date.now();
  const response = await fetch(ORIGIN + route, { redirect: 'manual', headers: { 'user-agent': 'openarabic-parity-baseline (read only)' } });
  const html = await response.text();
  pages.push({
    route,
    status: response.status,
    title: html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null,
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? null,
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null,
    jsonLdTypes: [...new Set([...html.matchAll(/"@type":"(\w+)"/g)].map((match) => match[1]))].sort(),
  });
  await sleep(Math.max(0, 1300 - (Date.now() - started)));
}
fs.writeFileSync('docs/research/parity/live-baseline-2026-11-01.json', JSON.stringify({ origin: ORIGIN, savedAt: new Date().toISOString(), pages }, null, 1));
console.log(`${pages.length} pages saved. Statuses: ${[...new Set(pages.map((page) => page.status))].join(', ')}`);
