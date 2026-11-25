import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://example.github.io',
  base: process.env.ASTRO_BASE || '/',
  trailingSlash: 'always',
  output: 'static',
});
