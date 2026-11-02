#!/usr/bin/env node
// Plan task 4.2: store slides and the Play feature graphic, for the owner to submit. Text is ledger wording; screens are real, unedited captures.
// usage: node scripts/store-assets.mjs. Writes docs/store-assets/. Captures are read from the app repo and never changed.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const OUT = 'docs/store-assets';
const CAPTURES = '/home/yunus/Work/open-arabic/store-listing/captures/ios';
const SLIDES = [
  ['01-read.png', 'English above every\nArabic line.'],
  ['02-tap-word.png', 'One tap gives you the\nmeaning, a grammar\nnote and audio.'],
  ['03-library.png', 'Excerpts from\nclassical works.'],
  ['04-listen.png', 'Arabic audio on every\nword and every line.'],
  ['05-speak.png', 'You answer out loud\nbefore the app shows\nthe meaning.'],
  ['06-remember.png', 'Words return when your\npredicted recall falls\nto 90%.'],
];
const TARGETS = { 'app-store': { w: 1320, h: 2868, size: 104, top: 170, phone: 900, phoneTop: 620 }, play: { w: 1080, h: 1920, size: 72, top: 96, phone: 600, phoneTop: 400 } };
const b64 = (file) => fs.readFileSync(file).toString('base64');
const font = `@font-face{font-family:Inter Site;src:url(data:font/woff2;base64,${b64('src/fonts/inter-variable.subset.woff2')});font-weight:250 600}`;
const SURFACE = '#040d07';

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
async function render(w, h, html, file) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  await page.screenshot({ path: file, type: 'png' });
  await page.close();
  // Both stores reject an alpha channel.
  execFileSync('magick', [file, '-background', SURFACE, '-alpha', 'remove', '-alpha', 'off', '-depth', '8', file]);
}
for (const [name, t] of Object.entries(TARGETS)) {
  fs.mkdirSync(path.join(OUT, name), { recursive: true });
  for (const [capture, caption] of SLIDES) {
    const radius = Math.round(t.phone * 0.1);
    const html = `<!doctype html><meta charset=utf-8><style>${font}*{margin:0}body{width:${t.w}px;height:${t.h}px;overflow:hidden;background:${SURFACE};color:#f4f8f5;font-family:"Inter Site"}
    h1{position:absolute;left:${Math.round(t.w * 0.08)}px;right:${Math.round(t.w * 0.08)}px;top:${t.top}px;font-size:${t.size}px;font-weight:300;line-height:1.08;letter-spacing:-.025em;white-space:pre-line}
    .p{position:absolute;left:50%;top:${t.phoneTop}px;width:${t.phone}px;margin-left:${-t.phone / 2}px;padding:${Math.round(t.phone * 0.022)}px;box-sizing:border-box;background:#000;border-radius:${radius + 12}px;box-shadow:0 0 0 2px #2a3a30}
    img{display:block;width:100%;border-radius:${radius}px}</style><h1>${caption}</h1><div class=p><img src="data:image/png;base64,${b64(path.join(CAPTURES, capture))}"></div>`;
    await render(t.w, t.h, html, path.join(OUT, name, capture));
  }
}
const feature = `<!doctype html><meta charset=utf-8><style>${font}*{margin:0}body{width:1024px;height:500px;position:relative;overflow:hidden;background:${SURFACE};color:#f4f8f5;font-family:"Inter Site"}
img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%}.s{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,13,7,.85),rgba(4,13,7,.25) 62%,rgba(4,13,7,0))}
.n{position:absolute;left:52px;top:40px;font-size:26px;font-weight:500}h1{position:absolute;left:52px;bottom:44px;font-size:70px;line-height:1;font-weight:400;letter-spacing:-.025em}</style>
<img src="data:image/webp;base64,${b64('public/hero-wide.webp')}"><div class=s></div><div class=n>OpenArabic</div><h1>Read<br>the classics<br>in Arabic.</h1>`;
await render(1024, 500, feature, path.join(OUT, 'feature-graphic.png'));
await browser.close();
const sizes = {};
for (const file of [path.join(OUT, 'feature-graphic.png'), ...Object.keys(TARGETS).flatMap((n) => SLIDES.map(([c]) => path.join(OUT, n, c)))]) {
  sizes[file] = execFileSync('magick', ['identify', '-format', '%wx%h %[channels] %z', file]).toString();
}
console.log(sizes);
