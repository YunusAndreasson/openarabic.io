import fs from 'node:fs';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { parse } from 'parse5';
import { fail, rel, ROOT, walk } from './lib.mjs';

// Bytes, decimal: the plan's "109 KB" of fonts is 109,208 bytes. Limits are docs/site-plan.md `Budgets`.
const D7_CHECK = 250;
const ANY_PAGE_JS = 1500;
const READER_HTML_BROTLI = 12_000;
const GLOSSARY_BROTLI = 25_000;
const CSS_GZIP = 12_000;
// The home page is the app's promo: docs/decisions/2026-10-31-home-rebuild.md. No other page gets these.
const HOME_JS = 60_000;
const HOME_CSS = 24_000;
const FONTS_FIRST_VIEW = 110_000;
const MAX_FILES = 90_000;
const MAX_ASSET = 25 * 1024 * 1024;

/** JS by page type. Every limit is the page's own row plus D7's inline check, under the 1.5 KB cap, except the home page's own. */
export function pageType(route) {
  if (route === '/') return { type: 'home', js: HOME_JS, css: HOME_CSS, external: true };
  if (route.startsWith('/read/')) return { type: 'reader', js: 1000 + D7_CHECK, external: true };
  if (route === '/analytics-choice') return { type: 'analytics choice', js: ANY_PAGE_JS, external: true };
  return { type: '0 JS plus the D7 check', js: D7_CHECK, external: false };
}

export function routeOf(file, clientDir) {
  const route = `/${path.relative(clientDir, file).replace(/\.html$/, '')}`;
  return route === '/index' ? '/' : route;
}

function elements(node, out = []) {
  if (node.tagName) out.push(node);
  for (const child of node.childNodes ?? []) elements(child, out);
  if (node.content) elements(node.content, out);
  return out;
}

const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const textOf = (node) => (node.childNodes ?? []).map((child) => child.value ?? '').join('');
const isExternal = (url) => /^(?:https?:)?\/\//i.test(url ?? '');
const gz = (data) => gzipSync(data, { level: 9 }).length;
const br = (data) => brotliCompressSync(data).length;
const kb = (bytes) => `${(bytes / 1000).toFixed(2)} KB`;

function localFile(clientDir, url, page) {
  const clean = url.split(/[?#]/)[0];
  const file = clean.startsWith('/') ? path.join(clientDir, clean) : path.resolve(path.dirname(page), clean);
  if (!fs.existsSync(file)) fail(`${rel(page)} loads ${url}, which isn't in the build.`);
  return file;
}

const RESOURCE_ATTRS = { script: ['src'], img: ['src', 'srcset'], iframe: ['src'], audio: ['src'], video: ['src', 'poster'], source: ['src', 'srcset'], embed: ['src'], object: ['data'] };
const EXTERNAL_RELS = /stylesheet|preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|manifest/i;

function checkPage(page, clientDir, facts) {
  const route = routeOf(page, clientDir);
  const limits = pageType(route);
  const nodes = elements(parse(fs.readFileSync(page, 'utf8')));
  let js = 0;
  let css = 0;
  const sheets = [];

  for (const node of nodes) {
    for (const name of RESOURCE_ATTRS[node.tagName] ?? []) {
      const value = attr(node, name);
      if (isExternal(value)) fail(`${route} loads a third-party resource: <${node.tagName} ${name}="${value}">. Budget: no third-party request.`);
    }
    if (node.tagName === 'script') {
      const type = attr(node, 'type') ?? '';
      if (type && !/javascript|module/i.test(type)) continue;
      const src = attr(node, 'src');
      if (src) {
        if (!limits.external) fail(`${route} (${limits.type}) loads the script ${src}. This page type allows only the inline D7 check.`);
        js += gz(fs.readFileSync(localFile(clientDir, src, page)));
      } else {
        js += gz(textOf(node));
      }
    }
    if (node.tagName === 'link') {
      const relation = attr(node, 'rel') ?? '';
      const href = attr(node, 'href');
      if (EXTERNAL_RELS.test(relation) && isExternal(href)) fail(`${route} loads a third-party resource: <link rel="${relation}" href="${href}">. Budget: no third-party request.`);
      if (/stylesheet/i.test(relation) && href) sheets.push(fs.readFileSync(localFile(clientDir, href, page), 'utf8'));
    }
    if (node.tagName === 'style') sheets.push(textOf(node));
  }

  if (js > limits.js) fail(`${route} (${limits.type}) ships ${kb(js)} of JS gzip, over its ${kb(limits.js)} budget.`);
  if (route !== '/' && js > ANY_PAGE_JS) fail(`${route} ships ${kb(js)} of JS gzip, over the 1.5 KB cap on any page.`);

  const fonts = new Set();
  for (const sheet of sheets) {
    css += gz(sheet);
    for (const match of sheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      if (isExternal(match[1])) fail(`${route}'s CSS loads a third-party resource: ${match[1]}. Budget: no third-party request.`);
      if (/\.woff2?$/i.test(match[1].split(/[?#]/)[0])) fonts.add(localFile(clientDir, match[1], page));
    }
  }
  const cssLimit = limits.css ?? CSS_GZIP;
  if (css > cssLimit) fail(`${route} ships ${kb(css)} of CSS gzip, over the ${kb(cssLimit)} budget.`);
  const fontBytes = [...fonts].reduce((sum, file) => sum + fs.statSync(file).size, 0);
  if (fontBytes > FONTS_FIRST_VIEW) fail(`${route} declares ${kb(fontBytes)} of fonts, over the ${kb(FONTS_FIRST_VIEW)} first-view budget.`);

  if (route.startsWith('/read/')) {
    const size = br(fs.readFileSync(page));
    if (size > READER_HTML_BROTLI) fail(`${route} is ${kb(size)} of HTML brotli, over the ${kb(READER_HTML_BROTLI)} reader budget.`);
  }

  facts.push({ route, type: limits.type, js, css, fontBytes });
}

export function checkBudgets(root = ROOT) {
  const clientDir = path.join(root, 'dist/client');
  const files = walk(clientDir);
  const pages = files.filter((file) => file.endsWith('.html'));
  if (pages.length === 0) fail('The build holds no HTML pages.');

  // wrangler.json and .assetsignore are never served, so they don't count against the upload.
  if (files.length > MAX_FILES) fail(`The build has ${files.length} files, over the ${MAX_FILES} limit.`);
  // Only what the home page itself loads may use the home page's limits.
  const homePage = pages.find((page) => routeOf(page, clientDir) === '/');
  const homeFiles = new Set();
  if (homePage) {
    for (const node of elements(parse(fs.readFileSync(homePage, 'utf8')))) {
      const url = node.tagName === 'script' ? attr(node, 'src') : node.tagName === 'link' && /stylesheet/i.test(attr(node, 'rel') ?? '') ? attr(node, 'href') : null;
      if (url && !isExternal(url)) homeFiles.add(localFile(clientDir, url, homePage));
    }
  }
  for (const file of files) {
    const size = fs.statSync(file).size;
    if (size > MAX_ASSET) fail(`${rel(file)} is ${(size / 1024 / 1024).toFixed(1)} MiB, over the 25 MiB limit.`);
    if (/\.m?js$/.test(file)) {
      const zipped = gz(fs.readFileSync(file));
      if (!homeFiles.has(file) && zipped > ANY_PAGE_JS) fail(`${rel(file)} is ${kb(zipped)} of JS gzip, over the 1.5 KB cap on any page.`);
    }
    if (file.endsWith('.css')) {
      const zipped = gz(fs.readFileSync(file));
      const limit = homeFiles.has(file) ? HOME_CSS : CSS_GZIP;
      if (zipped > limit) fail(`${rel(file)} is ${kb(zipped)} of CSS gzip, over the ${kb(limit)} budget.`);
    }
    if (rel(file).startsWith(`dist${path.sep}client${path.sep}gl${path.sep}`)) {
      const size2 = br(fs.readFileSync(file));
      if (size2 > GLOSSARY_BROTLI) fail(`${rel(file)} is ${kb(size2)} of glossary brotli, over the ${kb(GLOSSARY_BROTLI)} budget.`);
    }
  }

  const facts = [];
  for (const page of pages) checkPage(page, clientDir, facts);
  return { facts, files: files.length, pages };
}
