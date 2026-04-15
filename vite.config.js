import { defineConfig } from 'vite';
import { htmlPartialsPlugin } from './scripts/vite-plugin-html-partials.mjs';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [htmlPartialsPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
