// The translare draft preview: routes that exist only under `astro dev`, never in a build, so nothing here can be
// shipped. /preview is the bookstore, /preview/<book> a book's chapters, /preview/<book>/<chapter> reads one as
// the article reader does. The header's Bookstore link (layouts/Content.astro) also exists only in dev.
//
// Word audio: translare makes new clips on this machine (its audio/clips/) and uploads them only at release, so the
// dev server serves them at /preview/audio/<clip>.mp3, with byte ranges (Safari plays media only from a server that
// answers them). The preview's reader is src/scripts/reader.src.js with an empty audio prefix, so a word plays the
// full URL its gloss carries: the app's bucket for an existing clip, /preview/audio/ for a new one.
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from 'esbuild';
import { clipsRoot } from './drafts.mjs';

const CLIP = /^[0-9a-f]{32}(\.take\d+)?\.mp3$/;

function serveClip(req, res) {
  const name = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\//, ''));
  const file = path.join(clipsRoot(), name);
  if (!CLIP.test(name) || !fs.existsSync(file)) {
    res.statusCode = 404;
    res.end('No such clip');
    return;
  }
  const size = fs.statSync(file).size;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  let start = 0;
  let end = size - 1;
  if (range && (range[1] || range[2])) {
    start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      res.end();
      return;
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
  } else {
    res.statusCode = 200;
  }
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Length', String(end - start + 1));
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(file, { start, end }).pipe(res);
}

function serveReader(_req, res) {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/scripts/reader.src.js'), 'utf8');
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(transformSync(source, { target: 'es2020', define: { __AUDIO__: '""' } }).code);
}

export const translarePreview = () => ({
  name: 'openarabic-translare-preview',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/preview', entrypoint: './src/preview/index.astro' });
      injectRoute({ pattern: '/preview/[book]', entrypoint: './src/preview/book.astro' });
      injectRoute({ pattern: '/preview/[book]/[chapter]', entrypoint: './src/preview/chapter.astro' });
      injectRoute({ pattern: '/preview/gl/[book]/[chapter].json', entrypoint: './src/preview/gl.ts' });
    },
    // Runs only under `astro dev`: the dev server's own middleware, so no route of a build can serve these.
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/preview/audio/', serveClip);
      server.middlewares.use('/preview/reader.js', serveReader);
    },
  },
});
