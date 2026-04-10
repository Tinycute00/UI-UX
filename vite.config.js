import { defineConfig } from 'vite';
import { htmlPartialsPlugin } from './scripts/vite-plugin-html-partials.mjs';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [htmlPartialsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
