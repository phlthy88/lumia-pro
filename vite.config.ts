import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      cacheDir: 'node_modules/.vite-cache',
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        }
      },
      optimizeDeps: {
        include: [
          '@mui/material',
          '@mui/icons-material',
          '@emotion/react',
          '@emotion/styled'
        ]
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /\.(?:task|wasm)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'ai-models',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
                }
              },
              {
                urlPattern: /\.cube$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'lut-files',
                  expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
                }
              }
            ]
          },
          includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
          manifest: false
        })
      ],
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'mui-vendor': ['@mui/material', '@mui/icons-material']
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
