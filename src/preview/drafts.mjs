// `astro dev` only (src/preview/integration.mjs): translare's draft chapters, read from its project folder, so a
// chapter can be read here before it is released to the app. Nothing here is built, shipped or written anywhere.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/** translare's `books/` folder: TRANSLARE_BOOKS, or the sibling checkout. */
export const draftsRoot = () => process.env.TRANSLARE_BOOKS || path.resolve(process.cwd(), '../openarabic-translare/books');

/** Every draft chapter: { book, chapter, file }, in book and chapter order. */
export function listDrafts() {
  const root = draftsRoot();
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const book of fs.readdirSync(root).sort()) {
    const dir = path.join(root, book, 'drafts');
    if (!/^[a-z0-9-]+$/.test(book) || !fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      const match = /^ch(\d{3})\.json$/.exec(name);
      if (match) out.push({ book, chapter: String(Number(match[1])), file: path.join(dir, name) });
    }
  }
  return out;
}

export function loadDraft(book, chapter) {
  const hit = listDrafts().find((draft) => draft.book === book && draft.chapter === chapter);
  return hit ? JSON.parse(fs.readFileSync(hit.file, 'utf8')) : null;
}

/**
 * The draft's sentences in the shape the reader renders (snapshot.mjs `articleText`): words carry an id for the
 * classifier, the stored audio file if a clip already exists, and the live entry their word page belongs to.
 * Words made by an applied source fix are marked `fixed`.
 */
export function readerText(draft) {
  let n = 0;
  return draft.sentences.map((sentence) => ({
    arabic: sentence.arabic,
    english: sentence.english,
    words: sentence.words.map((word) => ({
      id: `d${n++}`,
      word_form: word.form,
      english: word.english,
      grammar_note: lexiconText(word.lexicon),
      audio_url: typeof word.audio === 'string' ? word.audio : null,
      root: word.entry?.decision === 'reuse' && word.entry.root_id ? { id: word.entry.root_id, meaning: word.entry.meaning ?? '' } : null,
      fixed: word.span_id.includes('+'),
      entry: word.entry ?? {},
    })),
  }));
}

const ORIGIN = { live: 'In the app now.', copy: 'Copied from its root’s entry in the app.', make: 'To be written.' };

/**
 * The lexicon entry the app's word card shows (its root explanation), as plain lines for the reader's card, which
 * this preview fills where the site shows a grammar note. Translare writes no grammar notes (decision 27).
 */
export function lexiconText(lex) {
  if (!lex || lex.origin === 'none') return '';
  if (lex.origin === 'make') return `Root ${lex.radicals}: its entry is to be written.`;
  if (!lex.root_meaning) return ORIGIN[lex.origin] ?? '';
  const family = (lex.word_family ?? []).map((m) => `${m.letters} ${m.transliteration}: ${m.meaning}`);
  return [
    `Root ${lex.triliteral_root} (${lex.root_transliteration}): ${lex.root_meaning}`,
    lex.usage_note,
    ...family,
    lex.written === 'translare' ? 'New: written by translare from Lane’s Lexicon, not in the app yet.' : ORIGIN[lex.origin],
  ].filter(Boolean).join('\n');
}

/** The classifier's cache key for a draft's words (src/lib/segments.mjs keeps one entry per key). */
export function wordsHash(sentences) {
  const rows = sentences.flatMap((sentence) => sentence.words.map((word) => [word.id, word.word_form, word.english]));
  return `draft-${crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 32)}`;
}

/** The books that have drafts: { book, name, authorId, chapters: [{ chapter, draft }] }, chapters in order. */
export function listBooks() {
  const books = new Map();
  for (const { book, chapter } of listDrafts()) {
    const draft = loadDraft(book, chapter);
    if (!books.has(book)) books.set(book, { book, name: draft.article.book ?? book, authorId: draft.article.author_id, chapters: [] });
    books.get(book).chapters.push({ chapter, draft });
  }
  for (const entry of books.values()) entry.chapters.sort((a, b) => Number(a.chapter) - Number(b.chapter));
  return [...books.values()];
}
