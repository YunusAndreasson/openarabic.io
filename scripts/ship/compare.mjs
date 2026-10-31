// Task 2.2: the publish guard's change layers and field-level report. Detects damage and surprise; it is not
// protection against tampering. Thresholds are the plan's untested judgements. docs/site-plan.md `Publish guard`.
import fs from 'node:fs';
import path from 'node:path';
import { fail, ROOT } from './lib.mjs';
import { readSnapshot, TABLES } from './fetch.mjs';
import { MEDIA } from './validate.mjs';

const PROTECTED = JSON.parse(fs.readFileSync(new URL('./protected.json', import.meta.url), 'utf8'));
export const MAX_FALL = 0.01;
export const MAX_TOUCHED_SENTENCES = 200;
// Not in the plan's table: a mass rewrite of meanings touches no sentence row, so it would pass unseen. Same limit, as a judgement.
export const MAX_CHANGED_ROOTS = 200;
const ATTRIBUTION = { articles: ['author_id'], authors: ['name'] };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Field-level differences, plus what the layers need to know about each row. */
function diff(baseline, snapshot) {
  const changes = [];
  const added = {};
  const removed = {};
  const changed = {};
  for (const table of Object.keys(TABLES)) {
    const before = new Map(baseline.tables[table].map((row) => [row.id, row]));
    const after = new Map(snapshot.tables[table].map((row) => [row.id, row]));
    added[table] = [];
    removed[table] = [];
    changed[table] = [];
    for (const [id, row] of after) {
      const old = before.get(id);
      if (!old) {
        added[table].push(row);
        continue;
      }
      let differs = false;
      for (const field of TABLES[table]) {
        if (!same(old[field], row[field])) {
          differs = true;
          changes.push({ table, row: id, field, before: old[field], after: row[field] });
        }
      }
      if (differs) changed[table].push({ old, row });
    }
    for (const [id, row] of before) if (!after.has(id)) removed[table].push(row);
  }
  return { changes, added, removed, changed };
}

/** A text as the guard protects it: its article row, sentences, words and author. Story and starting path alike. */
function protectedRows(snapshots) {
  const articles = new Set([PROTECTED.story.article, ...PROTECTED.startingPathArticles]);
  const rows = { articles, article_sentences: new Set([PROTECTED.story.sentence]), sentence_words: new Set(), authors: new Set() };
  for (const snapshot of snapshots) {
    for (const article of snapshot.tables.articles) if (articles.has(article.id)) rows.authors.add(article.author_id);
    for (const sentence of snapshot.tables.article_sentences) if (articles.has(sentence.article_id)) rows.article_sentences.add(sentence.id);
  }
  for (const snapshot of snapshots) {
    for (const word of snapshot.tables.sentence_words) if (rows.article_sentences.has(word.sentence_id)) rows.sentence_words.add(word.id);
  }
  return rows;
}

/** `baseline` null means nothing to compare with, which is held. */
export function compareSnapshots(baseline, snapshot, { baselineNote = 'No baseline snapshot exists' } = {}) {
  if (!baseline) {
    return { status: 'held', reasons: [`${baselineNote}, so every row is unreviewed.`], changes: [], added: {}, removed: {}, growth: null, flags: new Map() };
  }
  const { changes, added, removed, changed } = diff(baseline, snapshot);
  const reasons = [];
  const flags = new Map();
  const flag = (key, name) => flags.set(key, name);

  // Protected content: any change at all.
  const guarded = protectedRows([baseline, snapshot]);
  const hits = [];
  for (const change of changes) {
    if (guarded[change.table]?.has(change.row)) {
      hits.push(`${change.table} ${change.row}.${change.field}`);
      flag(`${change.table}/${change.row}/${change.field}`, 'protected');
    }
  }
  for (const [kind, rows] of [['new', added], ['removed', removed]]) {
    for (const [table, list] of Object.entries(rows)) {
      for (const row of list) {
        if (guarded[table]?.has(row.id)) {
          hits.push(`${kind} ${table} ${row.id}`);
          flag(`${table}/${row.id}/`, 'protected');
        }
      }
    }
  }
  if (hits.length > 0) reasons.push(`Protected content changed: ${hits.slice(0, 6).join(', ')}${hits.length > 6 ? `, and ${hits.length - 6} more` : ''}.`);

  // Suspicious: counts falling.
  for (const table of Object.keys(TABLES)) {
    const before = baseline.tables[table].length;
    const after = snapshot.tables[table].length;
    if (before > 0 && (before - after) / before > MAX_FALL) reasons.push(`${table} fell from ${before} to ${after} rows, over ${MAX_FALL * 100}%.`);
  }

  // Suspicious: attribution, published and media on an existing row.
  const sensitive = (name, fields, label) => {
    const found = changes.filter((change) => fields[change.table]?.includes(change.field));
    for (const change of found) if (!flags.has(`${change.table}/${change.row}/${change.field}`)) flag(`${change.table}/${change.row}/${change.field}`, 'suspicious');
    if (found.length > 0) reasons.push(`${label} changed on ${found.length} existing row${found.length === 1 ? '' : 's'}: ${found.slice(0, 4).map((c) => `${c.table} ${c.row}.${c.field}`).join(', ')}.`);
  };
  sensitive('attribution', ATTRIBUTION, 'Attribution');
  sensitive('published', { articles: ['published'] }, '`published`');
  sensitive('media', MEDIA, 'A media URL');

  // Expected growth: new articles with their own sentences and words, and the roots those words use.
  const newArticles = new Set(added.articles.map((row) => row.id));
  const growthSentences = new Set(added.article_sentences.filter((row) => newArticles.has(row.article_id)).map((row) => row.id));
  const growthWords = added.sentence_words.filter((row) => growthSentences.has(row.sentence_id));
  const usedByGrowth = new Set(growthWords.map((row) => row.root_id));
  const growthRoots = added.roots.filter((row) => usedByGrowth.has(row.id));

  // Suspicious: more than the limit of existing sentences touched. An addition to an existing text isn't growth, so it counts here.
  const touched = new Set();
  for (const { old, row } of changed.article_sentences) touched.add(old.id), touched.add(row.id);
  for (const { old, row } of changed.sentence_words) touched.add(old.sentence_id), touched.add(row.sentence_id);
  for (const row of removed.article_sentences) touched.add(row.id);
  for (const row of removed.sentence_words) touched.add(row.sentence_id);
  for (const row of added.article_sentences) if (!growthSentences.has(row.id)) touched.add(row.id);
  for (const row of added.sentence_words) if (!growthSentences.has(row.sentence_id)) touched.add(row.sentence_id);
  if (touched.size > MAX_TOUCHED_SENTENCES) reasons.push(`The change touches ${touched.size} existing sentences or their words, over the limit of ${MAX_TOUCHED_SENTENCES}.`);
  if (changed.roots.length > MAX_CHANGED_ROOTS) reasons.push(`${changed.roots.length} existing roots changed, over the limit of ${MAX_CHANGED_ROOTS}.`);

  // word_types can't be read with the public key, so a type id never seen before is the only sign of a bad one.
  if ((snapshot.restricted ?? []).includes('word_types')) {
    const known = new Set(baseline.tables.sentence_words.map((row) => row.word_type_id));
    const unknown = [...new Set(snapshot.tables.sentence_words.map((row) => row.word_type_id))].filter((id) => !known.has(id));
    if (unknown.length > 0) reasons.push(`sentence_words uses word_type_id ${unknown.slice(0, 5).join(', ')}, new since the baseline, and word_types can't be read to resolve it.`);
  }

  if (!same(baseline.rating ?? null, snapshot.rating ?? null)) changes.push({ table: 'rating', row: 'us', field: 'average', before: baseline.rating?.average ?? null, after: snapshot.rating?.average ?? null });

  const growth = { articles: added.articles.length, sentences: growthSentences.size, words: growthWords.length, roots: growthRoots.length };
  const total = changes.length + Object.values(added).flat().length + Object.values(removed).flat().length;
  return { status: reasons.length > 0 ? 'held' : total > 0 ? 'publish' : 'unchanged', reasons, changes, added, removed, growth, touched: touched.size, flags };
}

/** The last published snapshot, or before the first such publish, the hash in .ship/baseline. Plan task 2.2's baseline. */
export function loadBaseline(published, root = ROOT) {
  const file = path.join(root, '.ship/baseline');
  const hash = published?.hashOf === 'snapshot' ? published.hash : fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : null;
  if (!hash) return { hash: null, snapshot: null, note: 'No baseline is recorded' };
  if (!/^[0-9a-f]{64}$/.test(hash)) fail(`The baseline "${hash.slice(0, 80)}" isn't a snapshot hash.`);
  const snapshot = readSnapshot(hash, root);
  return snapshot ? { hash, snapshot } : { hash, snapshot: null, note: `The baseline snapshot ${hash} isn't on this machine` };
}

const cell = (value) => {
  const text = value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '\\n');
};

/** Every run with a change writes one: table, row, field, before and after. Stored text appears exactly as stored. */
export function writeReport(result, { hash, baselineHash, approved = false }, root = ROOT) {
  const lines = [
    `# Snapshot ${hash}`,
    '',
    `- Baseline: ${baselineHash ?? 'none'}`,
    `- Outcome: ${approved ? 'held, approved by hash' : result.status}`,
  ];
  if (result.growth) lines.push(`- Expected growth: ${result.growth.articles} articles, ${result.growth.sentences} sentences, ${result.growth.words} words, ${result.growth.roots} roots`);
  if (result.touched !== undefined) lines.push(`- Existing sentences touched: ${result.touched}`);
  if (result.reasons.length > 0) lines.push('', '## Why it was held', '', ...result.reasons.map((reason) => `- ${reason}`));
  lines.push('', '## Changes', '', '| Table | Row | Field | Before | After | Layer |', '|---|---|---|---|---|---|');
  const flagOf = (table, row, field) => result.flags.get(`${table}/${row}/${field}`) ?? result.flags.get(`${table}/${row}/`) ?? '';
  for (const change of result.changes) lines.push(`| ${change.table} | ${change.row} | ${change.field} | ${cell(change.before)} | ${cell(change.after)} | ${flagOf(change.table, change.row, change.field)} |`);
  for (const [table, rows] of Object.entries(result.added)) for (const row of rows) lines.push(`| ${table} | ${row.id} | (new row) | | ${cell(row)} | ${flagOf(table, row.id, '')} |`);
  for (const [table, rows] of Object.entries(result.removed)) for (const row of rows) lines.push(`| ${table} | ${row.id} | (removed row) | ${cell(row)} | | ${flagOf(table, row.id, '')} |`);
  const dir = path.join(root, '.ship/reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${hash}.md`);
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  return path.relative(root, file);
}
