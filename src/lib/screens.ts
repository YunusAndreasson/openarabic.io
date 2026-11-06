// The app's screens as the site shows them: the encoded files from `node scripts/captures.mjs`, with each capture's
// size and named regions from src/lib/captures.mjs, and the alt text it carries wherever it is the screen being described.
import { CAPTURES, RATIO, SMALL_WIDTH, croppedSize } from './captures.mjs';

const files = import.meta.glob<string>('../assets/story/screens/*.{avif,webp}', { query: '?url', import: 'default', eager: true });

const ALT = {
  read: 'The app’s reader: an English line above each classical Arabic line, with parts of the words in colour.',
  tap: 'The app’s sheet for the word كِتَاب: book, an audio button, and the root it comes from.',
  speak: 'The app’s voice review: one Arabic word, and the buttons Show answer and Speak to answer.',
} as const;

export type ScreenKey = keyof typeof CAPTURES & keyof typeof ALT;
export type Box = [number, number, number, number];

function file(key: string, suffix: string, format: 'avif' | 'webp'): string {
  const url = files[`../assets/story/screens/${key}${suffix}.${format}`];
  if (!url) throw new Error(`screens: ${key}${suffix}.${format} is missing. Run node scripts/captures.mjs.`);
  return url;
}

export const screens = Object.fromEntries(
  (Object.keys(ALT) as ScreenKey[]).map((key) => {
    const capture = CAPTURES[key] as unknown as { size: [number, number]; crop: { top: number; bottom: number }; regions: Record<string, Box>; sheetTop?: number };
    const [width, height] = croppedSize(capture);
    return [
      key,
      {
        key,
        avif: file(key, '', 'avif'),
        webp: file(key, '', 'webp'),
        small: { avif: file(key, '-small', 'avif'), webp: file(key, '-small', 'webp'), width: SMALL_WIDTH, height: Math.round(SMALL_WIDTH / RATIO) },
        width,
        height,
        regions: capture.regions,
        sheetTop: capture.sheetTop ?? 0,
        alt: ALT[key],
      },
    ];
  }),
) as Record<ScreenKey, { key: ScreenKey; avif: string; webp: string; small: { avif: string; webp: string; width: number; height: number }; width: number; height: number; regions: Record<string, Box>; sheetTop: number; alt: string }>;

/** Every capture's width over its height: the stages' frame takes this shape. */
export { RATIO };
