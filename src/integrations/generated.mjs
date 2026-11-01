// Writes what the Worker bundles, from the same snapshot the pages read, before Vite starts.
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from 'esbuild';
import { indexSnapshot, loadSnapshot, snapshotFile } from '../lib/snapshot.mjs';
import { articleSlug, authorSlug, CATEGORIES } from '../lib/words.mjs';

export function workerData(snapshot) {
  const site = indexSnapshot(snapshot);
  const withTexts = new Set(site.authorsWithTexts().map((author) => author.id));
  return {
    words: site.qualifying.map((root) => [root.id, root.letters, root.meaning]),
    articles: Object.fromEntries(site.published.map((article) => [article.id, articleSlug(article)])),
    authors: Object.fromEntries(site.authors.filter((author) => withTexts.has(author.id)).map((author) => [author.id, authorSlug(author)])),
    emptyAuthors: site.authors.filter((author) => !withTexts.has(author.id)).map((author) => author.id),
    categories: Object.fromEntries(site.categories.filter((category) => CATEGORIES[category.name] && site.articlesIn(category.id).length > 0).map((category) => [category.id, category.name])),
  };
}

export const generated = () => ({
  name: 'openarabic-generated',
  hooks: {
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
      fs.writeFileSync(path.join(process.cwd(), 'public/reader.js'), transformSync(reader, { minify: true, target: 'es2020' }).code);
    },
  },
});
