// The app captures behind the home page's stages, the offers and /download-app: where each comes from, how it is
// cropped, and the named regions a stage frames or rings. The one place for these numbers. `node scripts/captures.mjs`
// checks each source against its hash and writes src/assets/story/screens/. No Node imports: the build reads this too.
// Regions are [x, y, width, height] as fractions of the cropped capture, measured by eye on a gridded copy of it.
//
// Interim set, 2026-11-06: the emulator recapture couldn't run (the host was too busy for the emulator), so these are
// the best of the existing captures, iPhone and Android, each cropped below its status bar (and above Android's gesture
// bar) so they share one shape. docs/decisions/2026-11-06-story-pass.md.

/** Encoder settings. WebP 70 at effort 6 is what the stuck still used; AVIF 53 likewise. */
export const ENCODE = { webp: { quality: 70, effort: 6 }, avif: { quality: 53 } };

/** The small copy, for offers and /download-app, where a screen is shown at most about 240 px wide. */
export const SMALL_WIDTH = 480;

/** Every capture is cropped to this width over height, so one frame and its maths hold for all of them. */
export const RATIO = 1080 / 2203;

export const CAPTURES = {
  read: {
    source: 'docs/specimens/app-captures/ios/01-read.png',
    sha256: '58cec77b6b7aa63d444526c730ebbdef67b47b8d7194485a1668ee8e77cb6853',
    size: [1206, 2622],
    crop: { top: 162, bottom: 0 },
    regions: {
      pair: [0, 0.61, 1, 0.25],
      // From just above the title to the end of the first Arabic pair: the whole title and the scholar's name in view.
      opening: [0, 0.2, 1, 0.65],
      word: [0.625, 0.69, 0.19, 0.075],
    },
  },
  tap: {
    source: 'docs/specimens/app-captures/ios/02-tap-word.png',
    sha256: '06914ae6067a929220cf0fad851fbf3f016a9165d82689029e3e2c23da040bbd',
    size: [1206, 2622],
    crop: { top: 162, bottom: 0 },
    sheetTop: 0.094,
    regions: {
      card: [0, 0.13, 1, 0.35],
      add: [0.065, 0.39, 0.87, 0.058],
      root: [0, 0.47, 1, 0.43],
    },
  },
  speak: {
    source: 'docs/specimens/app-captures/09-voice-review-speak-prompt.png',
    sha256: '55d41b08813066611c6f2b99bcf1fb06c1c486e7a9987f710a3131c7ff8d8428',
    size: [1080, 2400],
    crop: { top: 118, bottom: 79 },
    regions: {
      review: [0, 0.35, 1, 0.63],
      speak: [0.535, 0.905, 0.435, 0.075],
    },
  },
};

/** A capture's size after its crop. */
export const croppedSize = (capture) => [capture.size[0], capture.size[1] - capture.crop.top - capture.crop.bottom];
