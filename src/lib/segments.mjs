// Build-time only. Colour parts come from the app's own classifier, never by hand, cached per snapshot.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import classes from '../../vendor/grammar-classes.json' with { type: 'json' };
import { escapeHtml } from './words.mjs';

const MARK = /^[ؐ-ًؚ-ٰٟۖ-ۭ]+$/u;

// One entry per word list: the site's snapshot, and in `astro dev` each translare draft (src/preview).
const cached = new Map();
function all(hash, words, root = process.cwd()) {
  if (cached.has(hash)) return cached.get(hash);
  const file = path.join(root, `.ship/segments/${hash}.json`);
  if (!fs.existsSync(file)) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-segments-'));
    const input = path.join(dir, 'in.json');
    fs.writeFileSync(input, JSON.stringify({ tables: { sentence_words: words } }));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const run = spawnSync(process.execPath, [path.join(root, 'vendor/classifier/analyze.mjs'), input, `${file}.tmp`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    if (run.status !== 0) throw new Error(`The classifier failed:\n${run.stderr}`);
    fs.renameSync(`${file}.tmp`, file);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  cached.set(hash, JSON.parse(fs.readFileSync(file, 'utf8')));
  return cached.get(hash);
}

/** The word-tap spike's two shaping rules. They only move marks between colour spans: text order and code points don't change. */
function shaped(raw) {
  const out = [];
  for (const segment of raw) {
    if (MARK.test(segment.t) && out.length > 0) {
      const previous = out.at(-1);
      const chars = [...previous.t];
      let index = chars.length - 1;
      while (index > 0 && MARK.test(chars[index])) index -= 1;
      const moved = chars.splice(index).join('');
      previous.t = chars.join('');
      if (!previous.t) out.pop();
      out.push({ t: moved + segment.t, c: segment.c });
    } else out.push({ ...segment });
  }
  for (let index = 0; index < out.length - 1; index += 1) {
    if (/^[يى]/u.test(out[index + 1].t)) {
      const marks = out[index].t.match(/[ِّ]+$/u);
      if (marks && marks[0].length < out[index].t.length) {
        out[index].t = out[index].t.slice(0, -marks[0].length);
        out[index + 1].t = marks[0] + out[index + 1].t;
      }
    }
  }
  return out;
}

/** A word's inner HTML: short class names, because the longest article has to fit 12 KB brotli. */
export function wordHtml(hash, words, word) {
  const raw = all(hash, words)[word.id];
  if (!raw) return escapeHtml(word.word_form);
  return shaped(raw)
    .map((segment) => {
      const name = classes[segment.c];
      return name ? `<span class=${name}>${escapeHtml(segment.t)}</span>` : escapeHtml(segment.t);
    })
    .join('');
}
