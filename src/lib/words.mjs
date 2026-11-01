// Ported from the old site: the slug is part of every URL, so its rule can't drift. No Node imports: the Worker uses this too.
export const slugifyText = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const wordSlug = (root) => `${slugifyText(root.meaning) || 'word'}-${root.id}`;
export const articleSlug = (article) => `${slugifyText(article.title)}-${article.id}`;
export const authorSlug = (author) => `${slugifyText(author.name) || 'author'}-${author.id}`;
export const AUDIO = 'https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/audio/';
export const audioUrl = (file) => (!file ? null : file.startsWith('http') ? file : AUDIO + file);
export const IMAGE_BASE = 'https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/images/';
export const imageSource = (url) => (!url ? null : /^https?:/.test(url) ? url : IMAGE_BASE + url);

export const CATEGORIES = { aqeedah: 'Creed', fiqh: 'Fiqh', hadith: 'Ḥadīth', quran: 'Qurʾān', seerah: 'Sīrah', ihsan: 'Iḥsān', tafsir: 'Tafsīr' };
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

/** Levels 1 to 3 are the ledger's "easier", 4 and 5 are Advanced and Expert. */
export const levelName = (level) => (level <= 3 ? 'Easier' : level === 4 ? 'Advanced' : 'Expert');
