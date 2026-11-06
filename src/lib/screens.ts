// The real app captures, AVIF with a WebP fallback, each with the alt text it carries wherever it is the screen being described.
import readAvif from '../assets/story/ios-01-read.avif?url';
import readWebp from '../assets/story/ios-01-read.webp?url';
import tapAvif from '../assets/story/ios-02-tap-word.avif?url';
import tapWebp from '../assets/story/ios-02-tap-word.webp?url';
import listenAvif from '../assets/story/ios-04-listen.avif?url';
import listenWebp from '../assets/story/ios-04-listen.webp?url';
import audioAvif from '../assets/story/audio.avif?url';
import audioWebp from '../assets/story/audio.webp?url';
import speakAvif from '../assets/story/ios-05-speak.avif?url';
import speakWebp from '../assets/story/ios-05-speak.webp?url';
import horizonAvif from '../assets/story/horizon.avif?url';
import horizonWebp from '../assets/story/horizon.webp?url';

export const screens = {
  read: { avif: readAvif, webp: readWebp, alt: 'The app’s reader: an English line above each classical Arabic line, with parts of the words in colour.' },
  tap: { avif: tapAvif, webp: tapWebp, alt: 'The app’s sheet for the word كِتَاب: book, an audio button, and the root it comes from.' },
  listen: { avif: listenAvif, webp: listenWebp, alt: 'The app’s playlist of texts, each with its scholar and length, and a Play all button.' },
  audio: { avif: audioAvif, webp: audioWebp, alt: 'The app’s reader with its player open along the bottom, playing a text aloud.' },
  speak: { avif: speakAvif, webp: speakWebp, alt: 'The app’s voice review: one Arabic word, a sound button, and the buttons Show answer and Speak to answer.' },
  horizon: { avif: horizonAvif, webp: horizonWebp, alt: 'The app’s memory horizon: how many practised words hold for days, weeks and months.' },
};
