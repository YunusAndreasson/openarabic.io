#!/usr/bin/env node
// Makes the home page's app screens from the raw captures, so every screen is cut and encoded the same way.
// usage: node scripts/captures.mjs [--hash]   (--hash prints each source's sha256, to record after a recapture)
// Reads src/lib/captures.mjs and writes src/assets/story/screens/<key>.{avif,webp} and <key>-small.{avif,webp}.
// A source whose hash, size or cropped shape no longer matches is refused: its regions were measured on the old file.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { CAPTURES, ENCODE, RATIO, SMALL_WIDTH, croppedSize } from '../src/lib/captures.mjs';

const OUT = 'src/assets/story/screens';
const printHash = process.argv.includes('--hash');
fs.mkdirSync(OUT, { recursive: true });

let failed = false;
for (const [key, capture] of Object.entries(CAPTURES)) {
  const bytes = fs.readFileSync(capture.source);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (printHash) {
    console.log(`${key}: ${hash}`);
    continue;
  }
  if (hash !== capture.sha256) {
    console.error(`${key}: ${capture.source} has sha256 ${hash}, not the recorded one. Re-measure its regions, then record the hash.`);
    failed = true;
    continue;
  }
  const meta = await sharp(bytes).metadata();
  if (meta.width !== capture.size[0] || meta.height !== capture.size[1]) {
    console.error(`${key}: ${meta.width}×${meta.height}, not the recorded ${capture.size.join('×')}.`);
    failed = true;
    continue;
  }
  const [width, height] = croppedSize(capture);
  if (Math.abs(width / height - RATIO) > 0.0002) {
    console.error(`${key}: cropped to ${width}×${height}, whose shape ${(width / height).toFixed(5)} isn't the shared ${RATIO.toFixed(5)}.`);
    failed = true;
    continue;
  }
  const cut = () => sharp(bytes).extract({ left: 0, top: capture.crop.top, width, height });
  const written = [];
  for (const [suffix, resize] of [['', null], ['-small', SMALL_WIDTH]]) {
    for (const format of ['avif', 'webp']) {
      const file = path.join(OUT, `${key}${suffix}.${format}`);
      let image = cut();
      if (resize) image = image.resize({ width: resize });
      await image[format](ENCODE[format]).toFile(file);
      written.push(`${path.basename(file)} ${fs.statSync(file).size} B`);
    }
  }
  console.log(`${key}: ${width}×${height}; ${written.join(', ')}`);
}
if (failed) process.exit(1);
