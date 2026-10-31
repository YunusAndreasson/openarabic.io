// Task 2.2, first layer of the publish guard: structural validation. A failure here has no override, because the data is broken.
import { SUPABASE_HOST, TABLES } from './fetch.mjs';

const REQUIRED_TEXT = {
  categories: ['name'],
  authors: ['name'],
  word_types: ['name'],
  articles: ['title'],
  article_sentences: ['arabic', 'english'],
  sentence_words: ['english'],
  roots: ['letters', 'meaning'],
};
const REQUIRED_ID = {
  articles: ['author_id', 'category_id'],
  article_sentences: ['article_id', 'position'],
  sentence_words: ['sentence_id', 'root_id', 'word_type_id', 'position'],
};
export const MEDIA = {
  articles: ['image_url', 'audio_url', 'audio_url_bilingual'],
  article_sentences: ['audio_url', 'audio_url_bilingual', 'audio_url_english'],
  sentence_words: ['audio_url'],
  roots: ['audio_url', 'audio_url_en'],
};
const KNOWN_HOSTS = new Set([SUPABASE_HOST]);

const HTML = /<\/?[a-zA-Z!][^>]*>/;
const URL_IN_TEXT = /[a-z][a-z0-9+.-]*:\/\/[^\s"'<>)]+/gi;
const SECRET = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sb_secret_|service_role/;
// The harakat, shadda, sukun and dagger alef: what "vocalised" means here. Read only, and no text is changed.
const VOCALISED = /[ً-ْٰ]/;

const blank = (value) => typeof value !== 'string' || value.trim() === '';
const LIMIT = 8;

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** Every problem at once, so one run shows the whole damage. `baseline` is the last good snapshot, or null before the first. */
export function validateSnapshot(snapshot, baseline = null) {
  const problems = [];
  const notes = [];
  const add = (message) => problems.push(message);
  const tables = snapshot?.tables;
  if (snapshot?.format !== 1 || !tables) return { problems: ['The snapshot has no tables, or an unknown format.'], notes };

  const restricted = new Set(snapshot.restricted ?? []);
  for (const table of Object.keys(tables)) if (!(table in TABLES)) add(`Unknown table ${table}.`);
  for (const table of Object.keys(TABLES)) {
    if (!Array.isArray(tables[table])) {
      add(`Table ${table} is missing: a deleted table.`);
    } else if (tables[table].length === 0 && !restricted.has(table)) {
      add(`Table ${table} has no rows.`);
    }
  }
  if (problems.length > 0) return { problems, notes };

  const ids = {};
  for (const [table, rows] of Object.entries(tables)) {
    ids[table] = new Set();
    let last = 0;
    for (const row of rows) {
      if (!Number.isInteger(row.id) || row.id <= last) add(`${table} row ${row.id} is out of primary key order, or repeated.`);
      last = row.id;
      ids[table].add(row.id);
      for (const field of REQUIRED_TEXT[table] ?? []) if (blank(row[field])) add(`${table} row ${row.id}: required field ${field} is empty.`);
      for (const field of REQUIRED_ID[table] ?? []) if (!Number.isInteger(row[field])) add(`${table} row ${row.id}: required field ${field} is ${JSON.stringify(row[field])}.`);
      for (const [field, value] of Object.entries(row)) {
        if (typeof value !== 'string') continue;
        if (HTML.test(value)) add(`${table} row ${row.id}: HTML in ${field}.`);
        if (SECRET.test(value)) add(`${table} row ${row.id}: ${field} looks like it holds a key.`);
        for (const [url] of value.matchAll(URL_IN_TEXT)) {
          if (!url.startsWith('https://') || !KNOWN_HOSTS.has(hostOf(url))) add(`${table} row ${row.id}: ${field} has a URL on an unknown host: ${url.slice(0, 80)}.`);
        }
      }
      for (const field of MEDIA[table] ?? []) {
        const value = row[field];
        if (typeof value === 'string' && (value.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(value)) && !value.startsWith('https://')) add(`${table} row ${row.id}: ${field} isn't a known kind of URL: ${value.slice(0, 80)}.`);
      }
    }
  }
  if (typeof snapshot.rating !== 'object' || (snapshot.rating !== null && !(snapshot.rating.average >= 0 && snapshot.rating.average <= 5))) add(`The rating is malformed: ${JSON.stringify(snapshot.rating)}.`);

  const resolves = (table, field, target) => {
    for (const row of tables[table]) if (!ids[target].has(row[field])) add(`Broken foreign key: ${table} row ${row.id} has ${field} ${row[field]}, and ${target} has no such row.`);
  };
  resolves('articles', 'author_id', 'authors');
  resolves('articles', 'category_id', 'categories');
  resolves('article_sentences', 'article_id', 'articles');
  resolves('sentence_words', 'sentence_id', 'article_sentences');
  resolves('sentence_words', 'root_id', 'roots');
  if (restricted.has('word_types')) {
    const seen = new Set(tables.sentence_words.map((row) => row.word_type_id));
    notes.push(`word_types is signed-in only, so sentence_words.word_type_id can't be resolved with the public key: ${seen.size} distinct ids, checked as present integers, and a new id is held by compare`);
  } else {
    resolves('sentence_words', 'word_type_id', 'word_types');
  }
  const withSentences = new Set(tables.article_sentences.map((row) => row.article_id));
  for (const article of tables.articles) if (article.published && !withSentences.has(article.id)) add(`Published article ${article.id} has no sentences.`);

  // Vocalised text not emptied. Some rows are stored empty or unmarked today, so the test is what a row lost, and any new row must have text.
  const earlier = (table) => new Map((baseline?.tables?.[table] ?? []).map((row) => [row.id, row]));
  const check = (table, field) => {
    const before = earlier(table);
    let storedEmpty = 0;
    for (const row of tables[table]) {
      const old = before.get(row.id);
      if (blank(row[field])) {
        if (baseline && (!old || !blank(old[field]))) add(`${table} row ${row.id}: ${field} was emptied.`);
        else storedEmpty += 1;
      } else if (old && VOCALISED.test(old[field] ?? '') && !VOCALISED.test(row[field])) {
        add(`${table} row ${row.id}: ${field} lost all its vowel marks.`);
      }
    }
    if (storedEmpty > 0) notes.push(`${storedEmpty} ${table} rows have an empty ${field}, as stored`);
  };
  check('article_sentences', 'arabic');
  check('sentence_words', 'word_form');

  return { problems, notes };
}

export function describeProblems(problems) {
  const shown = problems.slice(0, LIMIT).map((problem) => `  ${problem}`);
  if (problems.length > LIMIT) shown.push(`  ... and ${problems.length - LIMIT} more.`);
  return shown.join('\n');
}
