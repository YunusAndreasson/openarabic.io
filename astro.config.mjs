import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { generated } from './src/integrations/generated.mjs';

// The Worker name lives in wrangler.jsonc and is proved in the built config by `pnpm ship`.
export default defineConfig({
  site: 'https://openarabic.io',
  // The floating dev toolbar reads as a broken element on the page.
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: { format: 'file' },
  session: false,
  // 'server' only so the adapter builds src/worker.ts. The integration prerenders every page: no on-demand page exists.
  output: 'server',
  integrations: [generated()],
  // imageService 'compile': images are resized into the build, so no Cloudflare Images binding.
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' }),
});
