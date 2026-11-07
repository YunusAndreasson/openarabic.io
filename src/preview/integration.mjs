// The translare draft preview: routes that exist only under `astro dev`, never in a build, so nothing here can be
// shipped. /preview is the bookstore, /preview/<book> a book's chapters, /preview/<book>/<chapter> reads one as
// the article reader does. The header's Bookstore link (layouts/Content.astro) also exists only in dev.
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
  },
});
