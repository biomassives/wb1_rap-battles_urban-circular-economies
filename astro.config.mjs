//
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import vercel from '@astrojs/vercel';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      rehypeSlug, // Adds 'id' attributes to headings based on their text
      [rehypeAutolinkHeadings, { behavior: 'append' }], // Adds a clickable link icon next to headings
    ],
  },
  output: 'server',
  adapter: vercel()
});
