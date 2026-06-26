import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'hybrid',
  build: {
    assets: '_assets',
  },
});
