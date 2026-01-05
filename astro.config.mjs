// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Static site generation (now default in Astro)
  output: 'static',

  server: {
    port: 4321,
    host: true
  },

  adapter: vercel()
});