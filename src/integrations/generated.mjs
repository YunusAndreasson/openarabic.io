// Writes what the Worker bundles, from the same snapshot the pages read, before Vite starts.
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from 'esbuild';
import { indexSnapshot, loadSnapshot, snapshotFile } from '../lib/snapshot.mjs';
import { articleSlug, AUDIO, authorSlug, CATEGORIES } from '../lib/words.mjs';

export function workerData(snapshot) {
  const site = indexSnapshot(snapshot);
  const withTexts = site.authorsWithTexts();
  const withTextIds = new Set(withTexts.map((author) => author.id));
  return {
    words: site.qualifying.map((root) => [root.id, root.letters, root.meaning]),
    articles: Object.fromEntries(site.published.map((article) => [article.id, articleSlug(article)])),
    authors: Object.fromEntries(withTexts.map((author) => [author.id, authorSlug(author)])),
    emptyAuthors: site.authors.filter((author) => !withTextIds.has(author.id)).map((author) => author.id),
    categories: Object.fromEntries(site.categoriesWithTexts().filter((category) => CATEGORIES[category.name]).map((category) => [category.id, category.name])),
  };
}

export const generated = () => ({
  name: 'openarabic-generated',
  hooks: {
    // Production only: the preview's site-wide noindex header goes. Nothing else in _headers changes.
    'astro:build:done': () => {
      if (process.env.OPENARABIC_PRODUCTION !== '1') return;
      const file = path.join(process.cwd(), 'dist/client/_headers');
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^\/\*\s*\n[ \t]+X-Robots-Tag: noindex[ \t]*\n/m, ''));
    },
    'astro:route:setup': ({ route }) => {
      route.prerender = true;
    },
    'astro:config:setup': () => {
      const out = path.join(process.cwd(), 'src/generated/worker-data.json');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const file = snapshotFile();
      // A throwaway dev copy has no snapshot: it only ever renders `/`, and every redirect answers 404.
      const data = file ? workerData(loadSnapshot(file)) : { words: [], articles: {}, authors: {}, emptyAuthors: [], categories: {} };
      fs.writeFileSync(out, JSON.stringify(data));
      // The reader's one script: plain, external and deferred. Its budget leaves about 100 B, so it ships minified.
      const reader = fs.readFileSync(path.join(process.cwd(), 'src/scripts/reader.src.js'), 'utf8');
      fs.writeFileSync(path.join(process.cwd(), 'public/reader.js'), transformSync(reader, { minify: true, target: 'es2020', define: { __AUDIO__: JSON.stringify(AUDIO) } }).code);
    },
  },
});
