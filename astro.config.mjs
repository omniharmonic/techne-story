import { defineConfig } from 'astro/config';

// Project Pages site: assets and internal links honor the repository base.
export default defineConfig({
  site: process.env.SITE_ORIGIN ?? 'https://omniharmonic.github.io',
  base: '/techne-story/',
  trailingSlash: 'ignore',
  output: 'static',
  build: { assets: 'assets', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
