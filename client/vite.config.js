import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: process.env.VITE_BASE_URL || './',
  plugins: [
    react(),
    // basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'vite.svg', 'icon-192.png', 'icon-512.png'],
      manifestFilename: 'manifest.json',
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}']
      },
      manifest: {
        name: 'POS Abadi Jaya',
        short_name: 'POS Abadi',
        description: 'Integrated POS & Printing Service for Abadi Jaya',
        theme_color: '#137fec',
        background_color: '#f6f7f8',
        display: 'standalone',
        start_url: '.',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      }
    }
  },
})
