import type { APIRoute } from 'astro';
import { themeColorHex } from '../styles/tokens.generated';
import { APP_STORE, APP_STORE_ID, PLAY_ID, PLAY_STORE, SITE_NAME } from '../lib/site.mjs';

export const GET = (() =>
  new Response(
    JSON.stringify({
      name: SITE_NAME,
      short_name: 'OpenArabic',
      description: 'If you can sound out Arabic script, you can start reading classical texts.',
      start_url: '/',
      display: 'standalone',
      background_color: themeColorHex,
      theme_color: themeColorHex,
      icons: [{ src: '/oa-logo.png', sizes: '512x512', type: 'image/png' }],
      related_applications: [
        { platform: 'itunes', url: APP_STORE, id: APP_STORE_ID },
        { platform: 'play', url: PLAY_STORE, id: PLAY_ID },
      ],
      prefer_related_applications: true,
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )) satisfies APIRoute;
