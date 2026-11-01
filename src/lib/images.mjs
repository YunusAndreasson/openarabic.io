// Build-time only. The manifest `pnpm ship` writes after copying and resizing the article images (D9). No image means no <img>.
import fs from 'node:fs';
import path from 'node:path';
import { imageSource } from './words.mjs';

let manifest;
function read() {
  if (!manifest) {
    const file = path.join(process.cwd(), 'public/img/manifest.json');
    manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return manifest;
}

export function imageOf(url) {
  const entry = read()[imageSource(url)];
  if (!entry) return null;
  const { base, width, height, widths } = entry;
  const src = (wanted) => `/img/${base}-${widths.find((w) => w >= wanted) ?? widths.at(-1)}.webp`;
  return { width, height, src, srcset: widths.map((w) => `/img/${base}-${w}.webp ${w}w`).join(', '), og: `/img/${base}-og.jpg` };
}
