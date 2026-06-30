import { defineConfig } from 'vite';

const MUSIC_BACKEND = 'http://54.196.133.35:3000';
const GAMES_BACKEND = 'http://54.196.133.35:3700';
const VIDEO_SUBTITLE_CDN = 'https://biblecms-media-2026-app.s3.us-east-1.amazonaws.com';

export default defineConfig({
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    proxy: {
      // Proxy /music-api/* -> http://54.196.133.35:3000/api/*
      // Strips Cross-Origin-Resource-Policy header so browser can load images/audio
      '/music-api': {
        target: MUSIC_BACKEND,
        changeOrigin: true,
        headers: { 'User-Agent': 'bible-appclient' },
        rewrite: (path) => path.replace(/^\/music-api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Remove CORP header so browser allows cross-origin resource loading
            delete proxyRes.headers['cross-origin-resource-policy'];
            delete proxyRes.headers['cross-origin-opener-policy'];
          });
        },
      },
      // Proxy /music-uploads/* -> http://54.196.133.35:3000/uploads/*
      '/music-uploads': {
        target: MUSIC_BACKEND,
        changeOrigin: true,
        headers: { 'User-Agent': 'bible-appclient' },
        rewrite: (path) => path.replace(/^\/music-uploads/, '/uploads'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['cross-origin-resource-policy'];
            delete proxyRes.headers['cross-origin-opener-policy'];
          });
        },
      },
      '/games-api': {
        target: GAMES_BACKEND,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/games-api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['cross-origin-resource-policy'];
            delete proxyRes.headers['cross-origin-opener-policy'];
          });
        },
      },
      '/game-uploads': {
        target: GAMES_BACKEND,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/game-uploads/, '/uploads'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['cross-origin-resource-policy'];
            delete proxyRes.headers['cross-origin-opener-policy'];
          });
        },
      },
      '/caption-media': {
        target: VIDEO_SUBTITLE_CDN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/caption-media/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['cross-origin-resource-policy'];
            delete proxyRes.headers['cross-origin-opener-policy'];
          });
        },
      },
    },
  },
});
