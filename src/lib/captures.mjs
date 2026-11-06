// The app captures behind the home page's stages, the offers and /download-app: where each comes from, how it is
// cropped, and the named regions a stage frames or rings. The one place for these numbers. `node scripts/captures.mjs`
// checks each source against its hash and writes src/assets/story/screens/. No Node imports: the build reads this too.
// Regions are [x, y, width, height] as fractions of the cropped capture, measured by eye on a gridded copy of it.
//
// The set in use since 2026-11-06: the best of the existing captures, iPhone and Android, each cropped below its status
// bar (and above Android's gesture bar) so they share one shape. The emulator recapture couldn't be filmed on this
// machine, and the owner accepted these screens as they are. docs/decisions/2026-11-06-story-pass.md.
// A ring's region is measured from the capture's pixels, never by eye: a few percent off shows as a ring beside its button.

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
      // Measured from the pixels: كِتَابِ's ink is [0.6484, 0.7118, 0.1633, 0.0447], here with 1.2% around it.
      word: [0.6364, 0.6998, 0.1873, 0.0687],
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
      // The green pill, measured from its pixels (128,184,142) as [0.0597, 0.3911, 0.8806, 0.0593], with 0.3% more
      // at the sides and 0.2% above and below, so its anti-aliased edge stays inside the ring.
      add: [0.0567, 0.3891, 0.8866, 0.0633],
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
      // The green pill, measured from its pixels (128,184,142) as [0.5361, 0.9169, 0.4056, 0.0713], with the same room.
      speak: [0.5331, 0.9149, 0.4116, 0.0753],
    },
  },
};

/** A capture's size after its crop. */
export const croppedSize = (capture) => [capture.size[0], capture.size[1] - capture.crop.top - capture.crop.bottom];
