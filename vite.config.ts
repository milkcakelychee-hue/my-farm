import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import pkg from './package.json'

let hash = 'dev'
try { hash = execSync('git rev-parse --short HEAD').toString().trim() } catch {}

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version + ' · ' + hash) },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png', 'icon-1024.png'],
      manifest: {
        name: 'My Farm',
        short_name: 'My Farm',
        description: 'คู่มือฟาร์ม Stardew Valley',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F4F1EB',
        theme_color: '#F4F1EB',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-1024.png', sizes: '1024x1024', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
