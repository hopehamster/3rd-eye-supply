import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hopehamster.github.io',
  base: '/3rd-eye-supply',
  integrations: [
    tailwind(),
    sitemap()
  ],
  output: 'static'
});
