// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwind()            // ← Tailwind’s dedicated Vite plugin (v4+)
  ],
  css: {
    // Ensure Vite uses the v4 PostCSS bridge
    postcss: path.resolve('./postcss.config.cjs')
  },
  build: {
    // Keep Vite’s minifiers disabled to avoid flatten/strip bugs in v4
    minify: false,
    cssMinify: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true, secure: false }
    }
  }
});
