import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// 纯前端静态构建，可直接部署到 Vercel / Netlify / 任意静态托管。
// base 用相对路径，方便部署到子目录。
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'], // Phaser 单独分包，利于缓存
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '连锁矿工 · Combo Miner',
        short_name: 'Combo Miner',
        description: '摆钩抓矿、同色连锁滚雪球的休闲街机游戏',
        theme_color: '#0b0f1d',
        background_color: '#080b16',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
});
