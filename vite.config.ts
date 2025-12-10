import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // CSP Header Construction
    const connectSrc = [
      "'self'",
      'ws://localhost:*',
      'https://generativelanguage.googleapis.com',
      'https://openrouter.ai'
    ].join(' ');

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
      `connect-src ${connectSrc}`,
      "img-src 'self' blob: data:",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
    ].join('; ');

    return {
      cacheDir: 'node_modules/.vite-cache',
      worker: {
        format: 'iife'
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Content-Security-Policy': csp
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
            // Exclude large LUT files from precache
            globIgnores: ['**/*.cube'],
            runtimeCaching: [
              {
                urlPattern: /\.(?:task|wasm)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'ai-models',
                  expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 7 }
                }
              },
              {
                // LUTs: NetworkFirst with small cache - load on demand
                urlPattern: /\.cube$/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'lut-files',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
                  networkTimeoutSeconds: 3
                }
              }
            ],
            // Limit total cache size
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB max per file
          },
          includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
          manifest: {
            name: "Lumia Pro Lens",
            short_name: "Lumia",
            description: "Professional WebGL Camera Studio",
            theme_color: "#000000",
            background_color: "#000000",
            display: "standalone",
            orientation: "landscape",
            start_url: "/",
            icons: [
              {
                src: "icon-192.png",
                sizes: "192x192",
                type: "image/png"
              },
              {
                src: "icon-512.png",
                sizes: "512x512",
                type: "image/png"
              }
            ],
            shortcuts: [
              {
                name: "Start Recording",
                short_name: "Record",
                description: "Start recording immediately",
                url: "/?action=record",
                icons: [{ src: "icon-192.png", sizes: "192x192" }]
              }
            ]
          }
        })
      ],
      build: {
        target: 'es2022',
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
              'mediapipe': ['@mediapipe/tasks-vision'],
            }
          }
        }
      },
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
