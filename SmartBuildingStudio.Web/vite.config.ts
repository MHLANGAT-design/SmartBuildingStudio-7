// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,

    // ── File watcher ──────────────────────────────────────────────
    // Windows + antivirus + safe-write tooling frequently break
    // fs.watch notifications, which makes Vite serve stale modules
    // even though the files on disk are correct. Polling sidesteps
    // the OS notification layer entirely.
    watch: {
      usePolling: true,
      interval: 200,
    },

    proxy: {
      '/api/v1/floorplan-designer/import-dwg': {
        target: 'https://127.0.0.1:49235',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) =>
            console.error('[Vite Large-File Secure Proxy Error]:', err)
          );
          proxy.on('proxyReq', (proxyReq, req) => {
            req.setTimeout(600000);
            proxyReq.setTimeout(600000);
          });
        },
      },
      '^/api/v1/project-explorer': {
        target: 'http://127.0.0.1:5199',
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/v1\/project-explorer/, '/api/projectexplorer'),
      },
      // ─── Storage (served by ProjectExplorerService.Api) ──────────────
      '^/api/v1/storage': {
        target: 'http://127.0.0.1:5199',
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/v1\/storage/, '/api/storage'),
      },
      '^/api/v1/floorplan-designer': {
        target: 'https://127.0.0.1:49235',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1\/floorplan-designer/, '/api'),
      },

      // ─── ProductCatalogService ───────────────────────────────────────
      '^/api/v1/product-catalog': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/v1\/product-catalog/, '/api/productcatalog'),
      },
    },
  },
});