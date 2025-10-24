// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Allow top-level await; modern output
    target: 'esnext',        // (or 'esnext')
    modulePreload: { polyfill: false }, // avoid legacy polyfill
    // outDir, rollupOptions, etc. can stay as-is
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
