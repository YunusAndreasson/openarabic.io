// Build-time only. The build reads the one snapshot file `pnpm ship` passes it, proved against its name, and never Supabase.
// Ported from the spike's src/lib/data.ts, for the page tasks to use.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { wordSlug } from './words.mjs';

export function loadSnapshot(file = process.env.OPENARABIC_SNAPSHOT) {
  if (!file) throw new Error('OPENARABIC_SNAPSHOT is not set. Pages are built through `pnpm ship`, from a saved snapshot.');
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

export function indexSnapshot(snapshot) {
  const { categories, authors, articles, article_sentences: sentences, sentence_words: words, roots } = snapshot.tables;
  const sentenceById = new Map(sentences.map((row) => [row.id, row]));
  const articleById = new Map(articles.map((row) => [row.id, row]));
  const rootById = new Map(roots.map((row) => [row.id, row]));
  const wordsByRoot = groupBy(words, 'root_id');
  const wordsBySentence = groupBy(words, 'sentence_id');
  for (const list of wordsBySentence.values()) list.sort((a, b) => a.position - b.position);

  const wordEntry = (root) => {
    const uses = wordsByRoot.get(root.id) ?? [];
    const rows = uses.slice(0, 24);
    const examples = rows.flatMap((word) => {
      const sentence = sentenceById.get(word.sentence_id);
      const article = sentence && articleById.get(sentence.article_id);
      return article ? [{ wordForm: word.word_form, english: word.english, grammarNote: word.grammar_note, sentenceArabic: sentence.arabic, sentenceEnglish: sentence.english, articleTitle: article.title, articleId: article.id }] : [];
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
    return { root, usageCount: uses.length, examples, related };
  };

  return {
    categories,
    authors,
    articles,
    roots,
    qualifying: roots.filter((root) => wordsByRoot.has(root.id) && root.meaning?.trim() && root.letters?.trim()),
    wordEntry,
    articleWords: (id) =>
      sentences
        .filter((sentence) => sentence.article_id === id)
        .sort((a, b) => a.position - b.position)
        .map((sentence) => ({ ...sentence, words: (wordsBySentence.get(sentence.id) ?? []).map((word) => ({ ...word, root: rootById.get(word.root_id) })) })),
    articleById: (id) => articleById.get(id),
    articlesInCategory: (id) => articles.filter((article) => article.category_id === id && article.published),
  };
}
