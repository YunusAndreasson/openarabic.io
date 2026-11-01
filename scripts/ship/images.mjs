// D9: every published article's image, copied once and resized into the build, so no visitor request goes to Supabase.
// Sources stay in .ship/images. Read only, one at a time, at most 2 a second. Output in public/img, generated, not committed.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import sharp from 'sharp';
import { fail, ROOT } from './lib.mjs';
import { MIN_GAP_MS } from './fetch.mjs';
import { imageSource } from '../../src/lib/words.mjs';

export const WIDTHS = [320, 640, 960, 1280];
const OG = { width: 1200, height: 630 };

export async function prepareImages(snapshot, root = ROOT) {
  const sources = path.join(root, '.ship/images');
  const out = path.join(root, 'public/img');
  fs.mkdirSync(sources, { recursive: true });
  fs.mkdirSync(out, { recursive: true });
  const urls = [...new Set(snapshot.tables.articles.filter((article) => article.published).map((article) => imageSource(article.image_url)).filter(Boolean))].sort();
  const manifest = {};
  const missing = [];
  let fetched = 0;
  let last = 0;
  for (const url of urls) {
    const base = createHash('sha256').update(url).digest('hex').slice(0, 16);
    const source = path.join(sources, base);
    if (!fs.existsSync(source)) {
      const wait = last + MIN_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      fetched += 1;
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) }).catch(() => null);
      if (!response?.ok) {
        missing.push(url);
        continue;
      }
      fs.writeFileSync(`${source}.tmp`, Buffer.from(await response.arrayBuffer()));
      fs.renameSync(`${source}.tmp`, source);
    }
    const bytes = fs.readFileSync(source);
    const { width, height } = await sharp(bytes).metadata();
    const widths = WIDTHS.filter((wanted) => wanted <= width);
    if (widths.length === 0) widths.push(width);
    for (const wanted of widths) {
      const file = path.join(out, `${base}-${wanted}.webp`);
      if (!fs.existsSync(file)) await sharp(bytes).resize({ width: wanted }).webp({ quality: 60, effort: 6 }).toFile(file);
    }
    const og = path.join(out, `${base}-og.jpg`);
    if (!fs.existsSync(og)) await sharp(bytes).resize({ ...OG, fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toFile(og);
    manifest[url] = { base, width, height, widths };
  }
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));
  // A row can point at a file nobody uploaded. The page then shows no image, and the run says so: nothing about the text depends on it.
  return { images: urls.length, fetched, missing };
}

if (process.argv[1]?.endsWith('images.mjs')) {
  const file = process.argv[2];
  if (!file) fail('Usage: node scripts/ship/images.mjs <snapshot file>');
  console.log(await prepareImages(JSON.parse(fs.readFileSync(file, 'utf8'))));
}
