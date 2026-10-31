import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// The Worker name lives in wrangler.jsonc and is proved in the built config by `pnpm ship`.
export default defineConfig({
  // The floating dev toolbar reads as a broken element on the page.
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: { format: 'file' },
  session: false,
  // imageService 'compile': images are resized into the build, so no Cloudflare Images binding.
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' }),
});
