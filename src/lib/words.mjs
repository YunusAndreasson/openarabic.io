// Ported from the old site: the slug is part of every URL, so its rule can't drift. No Node imports: the Worker uses this too.
export const slugifyText = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const wordSlug = (root) => `${slugifyText(root.meaning) || 'word'}-${root.id}`;
export const articleSlug = (article) => `${slugifyText(article.title)}-${article.id}`;
export const wordPath = (root) => `/word/${wordSlug(root)}`;
export const articlePath = (article) => `/read/${articleSlug(article)}`;
/**
 * Author names as shown: the stored name with its long vowels and emphatic letters marked, in the same
 * system as the stored work titles (Ṣayd al-Khāṭir). Slugs, page titles and JSON-LD keep the stored name.
 * Still text from the database, so wherever it shows it keeps `data-stored`.
 * docs/decisions/2026-11-03-transliteration.md.
 */
const SHOWN = {
  'Ibn al-Jawzi': 'Ibn al-Jawzī',
  'an-Nawawi': 'an-Nawawī',
  'al-Imam al-Bukhari': 'al-Imām al-Bukhārī',
  'al-Bukhari': 'al-Bukhārī',
  'adh-Dhahabi': 'adh-Dhahabī',
  'Ibn Kathir': 'Ibn Kathīr',
  'Ibn Hajar': 'Ibn Ḥajar',
  Malik: 'Mālik',
  'ash-Shafii': 'ash-Shāfiʿī',
  'Ahmad ibn Hanbal': 'Aḥmad ibn Ḥanbal',
  'at-Tirmidhi': 'at-Tirmidhī',
  'as-Suyuti': 'as-Suyūṭī',
  'at-Tabari': 'aṭ-Ṭabarī',
};
export const shownName = (name) => SHOWN[name] ?? name;
export const authorSlug = (author) => `${slugifyText(author.name) || 'author'}-${author.id}`;
export const authorPath = (author) => `/author/${authorSlug(author)}`;
const STORAGE = 'https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/';
export const AUDIO = `${STORAGE}audio/`;
export const audioUrl = (file) => (!file ? null : file.startsWith('http') ? file : AUDIO + file);
export const IMAGE_BASE = `${STORAGE}images/`;
export const imageSource = (url) => (!url ? null : /^https?:/.test(url) ? url : IMAGE_BASE + url);

export const CATEGORIES = { aqeedah: 'Creed', fiqh: 'Fiqh', hadith: 'Ḥadīth', quran: 'Qurʾān', seerah: 'Sīrah', ihsan: 'Iḥsān', tafsir: 'Tafsīr' };
export const categoryLabel = (name) => CATEGORIES[name] ?? name;
export const categoryPath = (name) => `/category/${name}`;
// The plan's URL parity: the duplicate author row goes to the real one, other empty authors go home.
export const AUTHOR_MOVED = { 106: 16 };
export const BUCKETS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0-9', 'other'];
const STOP = ['to ', 'the ', 'a ', 'an '];

/** The old site's A to Z rule: "to bring" files under B. Only the bucket is affected, never the slug. */
export function bucketOf(meaning) {
  let text = meaning.trim().toLowerCase();
  for (const prefix of STOP) {
    if (text.startsWith(prefix) && text.length > prefix.length) {
      text = text.slice(prefix.length).trimStart();
      break;
    }
  }
  const first = text[0] ?? '';
  if (first >= 'a' && first <= 'z') return first;
  if (first >= '0' && first <= '9') return '0-9';
  return 'other';
}
export const bucketLabel = (bucket) => (bucket === '0-9' ? '0–9' : bucket === 'other' ? 'Other' : bucket.toUpperCase());

/** The sentence above a list of texts, true for that list. Levels 1 to 3 are "easier". */
export function difficultyLine(articles) {
  const easier = articles.filter((article) => article.difficulty_level <= 3).length;
  const total = articles.length;
  if (easier === 0) return `Sorted by difficulty. All ${total} are advanced.`;
  if (easier === total) return `Sorted by difficulty. All ${total} are easier.`;
  return `Sorted by difficulty. ${easier} of ${total} ${easier === 1 ? 'is' : 'are'} easier.`;
}
/** Levels 1 to 3 are the ledger's "easier", 4 and 5 are Advanced and Expert. */
export const levelName = (level) => (level <= 3 ? 'Easier' : level === 4 ? 'Advanced' : 'Expert');

/** For text content, so stored text can't open an element. `escapeAttribute` is also safe inside a double-quoted attribute. */
export const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const escapeAttribute = (text) => escapeHtml(text).replaceAll('"', '&quot;');
