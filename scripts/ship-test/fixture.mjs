// Local data for `pnpm ship:test`, in the shape of the real tables. Synthetic apart from sentence 7106's text. No network.
const FATHA = 'كِتَابٌ';
const row = (id, over) => ({ id, ...over });

export function fixture() {
  const categories = ['aqeedah', 'fiqh', 'hadith', 'quran', 'seerah', 'ihsan', 'tafsir'].map((name, index) => row(index + 1, { name }));
  const authors = [1, 2, 3, 104].map((id) => row(id, { name: `Author ${id}` }));
  const article = (id, category, published = true) => ({
    id, title: `Title ${id}`, summary: `Summary ${id}`, author_id: id === 559 ? 104 : 1, category_id: category, book: `Book ${id}`, content_hash: `h${id}`, created_at: '2026-03-10T00:00:00+00:00',
    difficulty_level: 3, image_url: `image-${id}.webp`, audio_url: `a${id}.mp3`, audio_url_bilingual: `b${id}.mp3`, published,
  });
  const articles = [article(10, 2), article(20, 3), article(30, 3), article(372, 1), article(559, 6), article(600, 4, false)];
  const owners = [10, 20, 30, 372];
  const article_sentences = [];
  const sentence_words = [];
  const roots = [];
  for (let id = 1; id <= 300; id += 1) roots.push(row(id + 14400, { letters: `جذر${id}`, meaning: `meaning ${id}`, audio_url: `r${id}.mp3`, audio_url_en: `re${id}.mp3` }));
  const sentence = (id, articleId, position, arabic = `${FATHA} ${id}`) => {
    article_sentences.push({ id, arabic, english: `Sentence ${id}.`, article_id: articleId, position, audio_url: `s${id}.mp3`, audio_url_bilingual: `sb${id}.mp3`, audio_url_english: `se${id}.mp3`, arabic_repeat: null, english_repeat: null });
    for (let n = 0; n < 2; n += 1) {
      const wordId = id * 10 + n;
      sentence_words.push({ id: wordId, word_form: FATHA, english: `word ${wordId}`, grammar_note: 'note', sentence_id: id, root_id: 14401 + (wordId % 300), word_type_id: 1 + (n % 3), position: n + 1, difficulty_level: 2, audio_url: n === 0 ? `w${wordId}.mp3` : null });
    }
  };
  for (let index = 0; index < 1200; index += 1) sentence(1000 + index, owners[index % owners.length], index + 1);
  sentence(7105, 559, 1);
  sentence(7106, 559, 2, 'وَإِذَا رَأَيْتُ كِتَابًا لَمْ أَرَهُ فَكَأَنِّي وَقَعْتُ عَلَى كَنْزٍ،');
  sentence(8000, 600, 1);
  article_sentences.sort((a, b) => a.id - b.id);
  sentence_words.sort((a, b) => a.id - b.id);
  return { categories, authors, word_types: [], articles, article_sentences, sentence_words, roots };
}

/** Each named doctoring from the plan's acceptance line, applied to a copy of the data. */
export const doctor = {
  brokenForeignKey: (db) => { db.sentence_words[5].root_id = 99999999; },
  changedSentences: (count) => (db) => {
    for (const row of db.article_sentences.filter((s) => s.article_id !== 559).slice(0, count)) row.english += ' changed';
  },
  attributionOnArticle: (db) => { db.articles[0].author_id = 2; },
  attributionOnAuthor: (db) => { db.authors[0].name = 'Someone Else'; },
  oneLetterIn7106: (db) => {
    const line = db.article_sentences.find((s) => s.id === 7106);
    line.arabic = line.arabic.replace('كَنْزٍ', 'كَنْسٍ');
  },
  newArticle: (db) => {
    db.articles.push({ ...db.articles[0], id: 700, title: 'A new text', content_hash: 'new', image_url: 'new.webp' });
    db.roots.push({ id: 20000, letters: 'جذر جديد', meaning: 'new meaning', audio_url: 'n.mp3', audio_url_en: 'ne.mp3' });
    db.article_sentences.push({ ...db.article_sentences[0], id: 9000, article_id: 700, position: 1, english: 'A new sentence.' });
    db.sentence_words.push({ ...db.sentence_words[0], id: 90000, sentence_id: 9000, root_id: 20000, position: 1 }, { ...db.sentence_words[1], id: 90001, sentence_id: 9000, root_id: 14500, position: 2 });
  },
  // scripts/q3-edit.mjs in the spike: a word meaning, a sentence's English and an article title.
  spikeEdit: (db) => {
    db.roots.find((r) => r.id === 14553).meaning = 'Anas Edited';
    db.article_sentences.find((s) => s.article_id === 372).english += ' [SPIKE-EDIT]';
    db.articles.find((a) => a.category_id === 2 && a.published).title += ' [SPIKE-EDIT]';
  },
};

/** The frozen sitemap list as it would read for this data, in the same form as docs/research/parity/. */
export function fixtureSitemap(db) {
  const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const used = new Set(db.sentence_words.map((word) => word.root_id));
  const words = db.roots.filter((root) => used.has(root.id)).map((root) => `/word/${slug(root.meaning)}-${root.id}`);
  const articles = db.articles.map((article) => `/read/${slug(article.title)}-${article.id}`);
  const authors = db.authors.map((author) => `/author/${slug(author.name)}-${author.id}`);
  const present = new Set(db.roots.filter((root) => used.has(root.id)).map((root) => root.meaning[0]));
  return [...db.categories.map((category) => `/?category=${category.id}`), ...words, ...articles, ...authors, '/dictionary', ...[...present].map((letter) => `/dictionary/${letter}`), '/download-app', '/books/al-fawaid', '/privacy', '/terms', '/contact', '/account-deletion'].join('\n');
}
