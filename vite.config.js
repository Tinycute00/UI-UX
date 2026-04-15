import { fileURLToPath } from 'node:url';
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
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        login: fileURLToPath(new URL('./login.html', import.meta.url)),
      },
    },
  },
});
