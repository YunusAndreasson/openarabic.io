// Ported from the spike's src/lib/words.ts: the slug is part of every word URL, so its rule can't drift.
export const slugifyText = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const wordSlug = (root) => `${slugifyText(root.meaning) || 'word'}-${root.id}`;
export const AUDIO = 'https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/audio/';
export const audioUrl = (file) => (!file ? null : file.startsWith('http') ? file : AUDIO + file);
