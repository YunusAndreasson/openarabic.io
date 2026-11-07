import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { generated } from './src/integrations/generated.mjs';
import { translarePreview } from './src/preview/integration.mjs';

// The Worker name lives in wrangler.jsonc and is proved in the built config by `pnpm ship`.
export default defineConfig({
  site: 'https://openarabic.io',
  // The floating dev toolbar reads as a broken element on the page.
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: { format: 'file' },
  session: false,
  // Only `pnpm ship --production` sets this. Everything else is a noindexed preview.
  vite: { define: { __OA_PRODUCTION__: JSON.stringify(process.env.OPENARABIC_PRODUCTION === '1') } },
  // 'server' only so the adapter builds src/worker.ts. The integration prerenders every page: no on-demand page exists.
  output: 'server',
  // translarePreview adds /preview under `astro dev` only: translare's draft chapters, never built or shipped.
  integrations: [generated(), translarePreview()],
  // imageService 'compile': images are resized into the build, so no Cloudflare Images binding.
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' }),
});
