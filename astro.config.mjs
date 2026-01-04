// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static', // Static site generation (now default in Astro)
  server: {
    port: 4321,
    host: true
  }
});
