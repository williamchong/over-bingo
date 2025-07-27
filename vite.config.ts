import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  base: process.env.NODE_ENV === 'production' ? '/over-bingo/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});