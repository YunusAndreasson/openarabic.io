import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { fail, rel, ROOT, walk } from './lib.mjs';
import { routeOf } from './budgets.mjs';

const TEXT_FILE = /\.(html|css|js|mjs|json|xml|txt|svg|webmanifest|map)$/;
const NOT_SERVED = new Set(['wrangler.json', '.assetsignore']);
// Only the book's page may say this: PRODUCT.md `Banned`, DESIGN.md `Content surfaces`.
const EXEMPT = { 'side by side': /^\/books\/al-fawaid(\.|$)/ };

const unquoteAll = (text) => [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
const squash = (text) =>
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[\s ]+/g, ' ')
    .trim();

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  if (from === -1 || to === -1) fail(`Can't find "${start}" up to "${end}", so the claims check has no list to read.`);
  return text.slice(from, to);
}

const tableRows = (text) =>
  text
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|[-:| ]+\|$/.test(line))
    .slice(1)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

/** PRODUCT.md `Banned`. Unquoted rows are comma lists, except the one that describes a kind of claim. */
export function readBanned(product) {
  const phrases = [];
  const forPerson = [];
  for (const [cell] of tableRows(section(product, '### Banned', '## Open'))) {
    const quoted = unquoteAll(cell);
    if (quoted.length > 0) phrases.push(...quoted);
    else if (/^Invented\b/.test(cell)) forPerson.push(cell);
    else phrases.push(...cell.split(',').map((part) => part.trim()));
  }
  if (!phrases.includes('native audio') || phrases.length < 15) {
    fail(`PRODUCT.md \`Banned\` parsed to ${phrases.length} phrases and is missing expected ones, so its format changed. Fix the check before shipping.`);
  }
  return { phrases, forPerson };
}

/** Ledger: PRODUCT.md names, allowed wording, and the sentences it tells us to use. */
export function readAllowed(product, design, draftText) {
  const ledger = new Set();
  for (const [, use] of tableRows(section(product, '## Names', '## Audience'))) ledger.add(use);
  for (const row of tableRows(section(product, '### Allowed', '### Conditional'))) {
    for (const quote of unquoteAll(row[1])) ledger.add(quote);
  }
  for (const quote of [...product.matchAll(/(?:Say so in these words:|Use) "([^"]+)"/g)]) ledger.add(quote[1]);

  const flat = design.replace(/\s*\n\s*/g, ' ');
  const designed = new Set([
    ...unquoteAll(section(design, '## Story', '## Motion')),
    ...unquoteAll(section(flat, '**Footer.**', '**Page frame.**')),
    ...unquoteAll(section(flat, '**Attribution.**', '**Footer.**')).slice(0, 1),
  ]);
  const draft = new Set(
    draftText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
  );
  if (ledger.size < 20 || designed.size < 15) {
    fail(`The allowed lists parsed to ${ledger.size} ledger and ${designed.size} design strings, so their format changed. Fix the check before shipping.`);
  }
  return { ledger, designed, draft };
}

const BLOCK_BREAK = new Set(['address', 'article', 'aside', 'blockquote', 'body', 'br', 'button', 'caption', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'label', 'legend', 'li', 'main', 'nav', 'noscript', 'ol', 'option', 'p', 'pre', 'section', 'select', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul']);
const SKIP = new Set(['script', 'style', 'template']);
const COPY_ATTRS = new Set(['alt', 'title', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-placeholder', 'placeholder', 'summary']);
const COPY_META = /^(description|og:.+|twitter:.+|application-name|apple-mobile-web-app-title)$/i;
const attrOf = (node, name) => node.attrs?.find((a) => a.name === name)?.value;

/** What a reader or a screen reader meets: text by block, title and copy-bearing attributes. Arabic runs are data, not claims. */
export function publicStrings(html) {
  const strings = [];
  let buffer = '';
  const flush = () => {
    const text = squash(buffer);
    if (text) strings.push(text);
    buffer = '';
  };
  const visitNested = (parent) => {
    for (const child of parent.childNodes ?? []) {
      if (!child.tagName) continue;
      const lang = attrOf(child, 'lang');
      if (lang && !lang.startsWith('ar')) visit(child);
      else visitNested(child);
    }
  };
  const visit = (node) => {
    if (node.nodeName === '#text') {
      buffer += node.value;
      return;
    }
    if (node.nodeName === '#comment' || node.nodeName === '#documentType') return;
    const tag = node.tagName;
    if (tag) {
      for (const { name, value } of node.attrs) {
        if (COPY_ATTRS.has(name) && squash(value)) {
          flush();
          strings.push(squash(value));
        }
      }
      if (tag === 'meta') {
        const key = attrOf(node, 'name') ?? attrOf(node, 'property') ?? '';
        if (COPY_META.test(key) && squash(attrOf(node, 'content') ?? '')) strings.push(squash(attrOf(node, 'content')));
        return;
      }
      if (SKIP.has(tag)) return;
      if (attrOf(node, 'lang')?.startsWith('ar')) {
        buffer += ' ';
        // A word card sits inside its Arabic line with lang="en", and it is copy like any other.
        visitNested(node);
        return;
      }
    }
    const isBlock = tag && (BLOCK_BREAK.has(tag) || tag === 'title' || tag === 'head');
    if (isBlock) flush();
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
    if (isBlock) flush();
  };
  visit(parse(html));
  flush();
  return strings;
}

function phraseRegex(phrase) {
  const body = phrase.split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\u00A0]+');
  return new RegExp(`(?<![\\w-])${body}(?![\\w-])`, 'i');
}

/** Removes known strings, longest first. Anything left over traces to nothing. */
function traceString(text, lists) {
  let rest = text;
  const used = { ledger: 0, designed: 0, draft: 0 };
  const all = [
    ...[...lists.ledger].map((value) => [value, 'ledger']),
    ...[...lists.designed].map((value) => [value, 'designed']),
    ...[...lists.draft].map((value) => [value, 'draft']),
  ].sort((a, b) => b[0].length - a[0].length);
  for (const [value, kind] of all) {
    // Whole words only, so a short entry like "on" can't eat part of a longer word.
    const known = squash(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    rest = rest.replace(new RegExp(`(?<![\\p{L}\\p{N}])${known}(?![\\p{L}\\p{N}])`, 'gu'), () => {
      used[kind] += 1;
      return ' ';
    });
  }
  return { rest: squash(rest), used };
}

export function checkClaims(root = ROOT) {
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const product = read('PRODUCT.md');
  const { phrases, forPerson } = readBanned(product);
  const lists = readAllowed(product, read('DESIGN.md'), read('docs/draft-copy.txt'));
  const dist = path.join(root, 'dist');
  const clientDir = path.join(dist, 'client');
  const files = walk(dist).filter((file) => TEXT_FILE.test(file) && !NOT_SERVED.has(path.basename(file)));

  const hits = [];
  const untraced = [];
  const counts = { strings: 0, ledger: 0, designed: 0, draft: 0 };

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const route = file.startsWith(clientDir) ? routeOf(file, clientDir) : rel(file);
    const isHtml = file.endsWith('.html');
    const strings = isHtml ? publicStrings(raw) : [];
    const visible = strings.join(' ');
    for (const phrase of phrases) {
      if (EXEMPT[phrase]?.test(route)) continue;
      const pattern = phraseRegex(phrase);
      // "i+1" is copy in a sentence and everyday code in a script, so it's judged only on text a reader sees.
      const isCodeLike = /[+]/.test(phrase);
      const target = isCodeLike ? (isHtml ? [visible] : []) : [visible, raw];
      if (target.some((text) => pattern.test(text))) hits.push(`${route}: "${phrase}"`);
    }
    for (const text of strings) {
      counts.strings += 1;
      const { rest, used } = traceString(text, lists);
      counts.ledger += used.ledger;
      counts.designed += used.designed;
      counts.draft += used.draft;
      if (rest) untraced.push(`${route}: "${rest}"`);
    }
  }

  if (hits.length > 0) fail(`Banned phrases from PRODUCT.md in the built output:\n  ${hits.join('\n  ')}`);
  if (untraced.length > 0) {
    fail(`Public text that traces to nothing. Use ledger wording, or add it to docs/draft-copy.txt for the owner:\n  ${untraced.join('\n  ')}`);
  }
  return { ...counts, files: files.length, phrases: phrases.length, forPerson };
}
