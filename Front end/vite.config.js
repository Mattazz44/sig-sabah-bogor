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
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Sabah Bogor - SIG Wisata Kota Bogor',
        short_name: 'Sabah Bogor',
        description:
          'Peta interaktif destinasi wisata alam, kuliner, dan edukasi & budaya di Kota Bogor.',
        theme_color: '#2c3b26',
        background_color: '#2c3b26',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
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
  server: {
    proxy: {
      '/api': {
        target: 'https://doorstop-agent-mobile.ngrok-free.dev',
        //target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
      '/images': {
        target: 'https://doorstop-agent-mobile.ngrok-free.dev',
        //target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },
})
