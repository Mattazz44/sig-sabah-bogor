import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['favicon.svg', 'manifest.json', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/admin/, /^\/login/, /^\/logout/, /^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\/api\/(tourists|boundary)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-public-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /\/images\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wisata-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: '../backend/public',
    emptyOutDir: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})