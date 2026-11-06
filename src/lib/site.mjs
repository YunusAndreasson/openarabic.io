// The site's own address, name and store links, and the JSON-LD shapes several pages share. No Node imports: the Worker uses this too.
import { articlePath } from './words.mjs';

export const SITE = 'https://openarabic.io';
export const SITE_NAME = 'OpenArabic: Read the Classics';
export const APP_STORE_ID = '1594031029';
export const PLAY_ID = 'com.edenmind.OpenArabic';
export const APP_STORE = `https://apps.apple.com/app/openarabic/id${APP_STORE_ID}`;
export const PLAY_STORE = `https://play.google.com/store/apps/details?id=${PLAY_ID}`;
export const SOCIAL = { x: 'https://x.com/openarabicio', instagram: 'https://www.instagram.com/openarabic.io/', facebook: 'https://www.facebook.com/OpenArabic.io/' };

export const absolute = (path) => `${SITE}${path}`;

/** Home, then each `[name, path]` in order. */
export const breadcrumbs = (...trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...trail].map(([name, path], index) => ({ '@type': 'ListItem', position: index + 1, name, item: absolute(path) })),
});

/** A page's list of texts, in the order shown. */
export const itemList = (articles) => ({
  '@type': 'ItemList',
  numberOfItems: articles.length,
  itemListElement: articles.map((article, index) => ({ '@type': 'ListItem', position: index + 1, name: article.title, url: absolute(articlePath(article)) })),
});
