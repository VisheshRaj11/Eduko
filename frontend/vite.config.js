import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', '*.svg', 'icons/*.ico'],
      devOptions: { enabled: true },
      manifest: {
        name: 'Eduko — AI Rural Education Platform',
        short_name: 'Eduko',
        description: 'AI-powered education for rural India. Learn in Hindi, Punjabi & English.',
        theme_color: '#8B5CF6',
        background_color: '#FAFAF5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'hi',
        categories: ['education'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        screenshots: [],
        shortcuts: [
          { name: 'AI Tutor',      url: '/tutor',    description: 'Ask your AI tutor' },
          { name: 'My Plan',       url: '/plan',     description: 'View study plan' },
          { name: 'Content Library', url: '/library', description: 'Browse lessons' },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Runtime caching rules
        runtimeCaching: [
          // Google Fonts — cache forever
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Lessons — serve from cache, refresh in background
          {
            urlPattern: /\/api\/lessons(\/.*)?/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lessons-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Quizzes — same strategy
          {
            urlPattern: /\/api\/quizzes(\/.*)?/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quizzes-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          // Dashboard — network first with cache fallback
          {
            urlPattern: /\/api\/dashboard/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dashboard-cache',
              expiration: { maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          // AI Chat — network only (no caching for AI responses)
          {
            urlPattern: /\/api\/ask-ai/,
            handler: 'NetworkOnly',
          },
          // Everything else API — network first
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          ui:       ['framer-motion', 'react-icons'],
          charts:   ['recharts'],
          i18n:     ['i18next', 'react-i18next'],
          state:    ['zustand'],
        },
      },
    },
  },
})
