import { themeColorHex } from '../styles/tokens.generated';

const NAME = 'OpenArabic: Read the Classics';
export const GET = () =>
  new Response(
    JSON.stringify({
      name: NAME,
      short_name: 'OpenArabic',
      description: 'If you can sound out Arabic script, you can start reading classical texts.',
      start_url: '/',
      display: 'standalone',
      background_color: themeColorHex,
      theme_color: themeColorHex,
      icons: [{ src: '/oa-logo.png', sizes: '512x512', type: 'image/png' }],
      related_applications: [
        { platform: 'itunes', url: 'https://apps.apple.com/app/openarabic/id1594031029', id: '1594031029' },
        { platform: 'play', url: 'https://play.google.com/store/apps/details?id=com.edenmind.OpenArabic', id: 'com.edenmind.OpenArabic' },
      ],
      prefer_related_applications: true,
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
