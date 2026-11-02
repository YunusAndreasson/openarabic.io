// Build-time only. The build reads one saved snapshot file, proved against its name, and never Supabase.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { articleSlug, authorSlug, bucketOf, wordSlug } from './words.mjs';
import flaggedTexts from '../data/flagged-texts.json' with { type: 'json' };

const flagged = new Set(flaggedTexts.articles);

/** `pnpm ship` names the file. `pnpm dev` takes the newest one saved here. Null if this folder has none. */
export function snapshotFile(root = process.cwd()) {
  if (process.env.OPENARABIC_SNAPSHOT) return process.env.OPENARABIC_SNAPSHOT;
  const dir = path.join(root, '.ship/snapshots');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((name) => /^[0-9a-f]{64}\.json$/.test(name)).map((name) => path.join(dir, name));
  return files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] ?? null;
}

export function loadSnapshot(file = snapshotFile()) {
  if (!file) throw new Error('No snapshot: `pnpm ship --dry-run` saves one in .ship/snapshots.');
  const bytes = fs.readFileSync(file);
  const name = path.basename(file, '.json');
  if (createHash('sha256').update(bytes).digest('hex') !== name) throw new Error(`${file} doesn't match its name, so it was changed after it was saved.`);
  return { hash: name, ...JSON.parse(bytes.toString('utf8')) };
}

const groupBy = (rows, key) => {
  const groups = new Map();
  for (const row of rows) {
    const list = groups.get(row[key]);
    if (list) list.push(row);
    else groups.set(row[key], [row]);
  }
  return groups;
};

// The throwaway copy AGENTS.md allows: for comparing letters only, never shown. Base Arabic letters, with alef forms and alef maqsura folded.
const lettersOf = (text) =>
  text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[^\u0621-\u064A]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي');

/** D6: `word_form` where its letters match the stored sentence. On 2026-11-01 this leaves 350 that don't (the plan measured 352 with a rule that wasn't kept), and 3 with no words. */
export const lettersMatch = (arabic, words) => {
  const shown = words.filter((word) => word.word_form);
  return shown.length > 0 && lettersOf(arabic) === lettersOf(shown.map((word) => word.word_form).join(''));
};

export function indexSnapshot(snapshot) {
  const { categories, authors, articles, article_sentences: sentences, sentence_words: words, roots } = snapshot.tables;
  const published = articles.filter((article) => article.published);
  const publishedIds = new Set(published.map((article) => article.id));
  const articleById = new Map(articles.map((row) => [row.id, row]));
  const authorById = new Map(authors.map((row) => [row.id, row]));
  const categoryById = new Map(categories.map((row) => [row.id, row]));
  const sentenceById = new Map(sentences.map((row) => [row.id, row]));
  const rootById = new Map(roots.map((row) => [row.id, row]));
  const wordsByRoot = groupBy(words, 'root_id');
  const wordsBySentence = groupBy(words, 'sentence_id');
  const sentencesByArticle = groupBy(sentences, 'article_id');
  for (const list of wordsBySentence.values()) list.sort((a, b) => a.position - b.position);
  for (const list of sentencesByArticle.values()) list.sort((a, b) => a.position - b.position);
  const qualifying = roots.filter((root) => wordsByRoot.has(root.id) && root.meaning?.trim() && root.letters?.trim());
  const usage = (root) => wordsByRoot.get(root.id)?.length ?? 0;

  const inPublished = (word) => publishedIds.has(sentenceById.get(word.sentence_id)?.article_id);

  return {
    hash: snapshot.hash,
    words,
    categories,
    authors,
    published,
    qualifying,
    wordPaths: new Set(qualifying.map((root) => `/word/${wordSlug(root)}`)),
    usage,
    /** Words with examples only in unpublished texts keep their URL, with no example or source link: the plan's page map. */
    wordEntry(root) {
      const rows = (wordsByRoot.get(root.id) ?? []).filter(inPublished).slice(0, 24);
      const examples = rows.map((word) => {
        const sentence = sentenceById.get(word.sentence_id);
        const article = articleById.get(sentence.article_id);
        return { wordForm: word.word_form, english: word.english, grammarNote: word.grammar_note, sentenceArabic: sentence.arabic, sentenceEnglish: sentence.english, articleTitle: article.title, articlePath: `/read/${articleSlug(article)}` };
      });
      const counts = new Map();
      for (const id of new Set(rows.map((word) => word.sentence_id))) {
        for (const other of wordsBySentence.get(id) ?? []) if (other.root_id !== root.id) counts.set(other.root_id, (counts.get(other.root_id) ?? 0) + 1);
      }
      const related = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([id]) => rootById.get(id))
        .filter((other) => other?.meaning?.trim() && other?.letters?.trim())
        .map((other) => ({ letters: other.letters, meaning: other.meaning, path: `/word/${wordSlug(other)}` }));
      return { root, examples, related };
    },
    /** Sentences in order, each with its words if it can be tapped under D6. */
    articleText(id) {
      return (sentencesByArticle.get(id) ?? []).map((sentence) => {
        const all = wordsBySentence.get(sentence.id) ?? [];
        return { ...sentence, words: lettersMatch(sentence.arabic, all) ? all.filter((word) => word.word_form).map((word) => ({ ...word, root: rootById.get(word.root_id) })) : null };
      });
    },
    author: (id) => authorById.get(id),
    category: (id) => categoryById.get(id),
    /** Hardest last: "sorted by difficulty" is the ledger's promise. Flagged texts follow everything, so none leads a page (D13's default). */
    byDifficulty: (list) => [...list].sort((a, b) => flagged.has(a.id) - flagged.has(b.id) || a.difficulty_level - b.difficulty_level || a.title.localeCompare(b.title, 'en')),
    articlesBy: (authorId) => published.filter((article) => article.author_id === authorId),
    articlesIn: (categoryId) => published.filter((article) => article.category_id === categoryId),
    authorsWithTexts: () => authors.filter((author) => published.some((article) => article.author_id === author.id)),
    entriesIn: (bucket) =>
      qualifying
        .filter((root) => bucketOf(root.meaning) === bucket)
        .sort((a, b) => a.meaning.localeCompare(b.meaning, 'en') || a.id - b.id),
    buckets: () => new Set(qualifying.map((root) => bucketOf(root.meaning))),
    mostUsed: (limit) => [...qualifying].sort((a, b) => usage(b) - usage(a) || a.id - b.id).slice(0, limit),
    paths() {
      return {
        words: qualifying.map((root) => `/word/${wordSlug(root)}`),
        articles: published.map((article) => `/read/${articleSlug(article)}`),
        authors: authors.filter((author) => published.some((article) => article.author_id === author.id)).map((author) => `/author/${authorSlug(author)}`),
      };
    },
  };
}

let cached;
/** One parse per build. Every page shares it. */
export function site() {
  if (!cached) cached = indexSnapshot(loadSnapshot());
  return cached;
}
