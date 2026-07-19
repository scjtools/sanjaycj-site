// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://sanjaycj.com',
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});
