import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // CSP Header Construction
    const connectSrc = [
      "'self'",
      'ws://localhost:*',
      'https://generativelanguage.googleapis.com',
      'https://openrouter.ai',
      'https://cdn.jsdelivr.net',
      'https://storage.googleapis.com'
    ].join(' ');

    // In dev mode, Vite injects inline scripts for HMR
    const scriptSrcElem = mode === 'development' 
      ? "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://storage.googleapis.com"
      : "script-src-elem 'self' https://cdn.jsdelivr.net https://storage.googleapis.com";

    const csp = [
      "default-src 'self' blob:",
      "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://storage.googleapis.com blob: 'strict-dynamic'",
      scriptSrcElem,
      `connect-src ${connectSrc}`,
      "img-src 'self' data: blob:",
      "media-src 'self' blob: data:",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "style-src-elem 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
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
          'Content-Security-Policy': csp,
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        },
        watch: {
          // Don't watch node_modules to prevent unnecessary re-optimizations
          ignored: ['**/node_modules/**', '**/.vite-cache/**'],
        },
        hmr: {
          // Ensure HMR doesn't cause cache issues
          overlay: true,
        }
      },
      optimizeDeps: {
        force: true, // Force re-optimization on every dev server start
        include: [
          '@mui/material',
          '@mui/icons-material',
          '@emotion/react',
          '@emotion/styled',
          '@mui/material/styles',
          '@mui/material/utils',
          '@mui/system', // Explicitly include @mui/system
          '@mui/material/Box',
          '@mui/material/Stack',
          '@mui/material/Typography',
          '@mui/material/TextField',
          '@mui/material/Select',
          '@mui/material/MenuItem',
          '@mui/material/Collapse',
          '@mui/material/Alert',
          '@mui/material/IconButton',
          '@mui/material/Chip',
          '@mui/material/FormControlLabel'
        ],
        exclude: [],
        holdUntilCrawlEnd: false, // Don't wait for all deps to be crawled
        esbuildOptions: {
          keepNames: true,
          target: 'es2022',
          platform: 'browser',
          format: 'esm',
          logLevel: 'silent'
        }
      },
      plugins: [
        react({
          jsxImportSource: '@emotion/react',
        }),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            // Exclude large LUT files from precache
            globIgnores: ['**/*.cube', '**/vendor-mediapipe*.js', '**/vendor-sentry*.js'],
            runtimeCaching: [
              {
                // Cache vendor chunks with stale-while-revalidate for fast loads
                urlPattern: /\/assets\/vendor-.*\.js$/,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'vendor-chunks',
                  expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }
                }
              },
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
              },
              {
                // Cache fonts
                urlPattern: /\.(?:woff2?|ttf|otf)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'fonts',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
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
        }),
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            assets: ['./dist/**'],
          },
          release: {
            name: process.env.npm_package_version,
          },
          disable: mode !== 'production' || !process.env.SENTRY_AUTH_TOKEN,
        }),
      ],
      build: {
        sourcemap: true,
        target: 'es2022',
        chunkSizeWarningLimit: 400,
        minify: 'terser',
        cssCodeSplit: true,
        modulePreload: {
          polyfill: true,
        },
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            passes: 2,
          },
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              // MUI + Emotion + Icons must stay together
              if (id.includes('@mui/') || id.includes('@emotion/')) {
                return 'vendor-mui';
              }
              if (id.includes('react-dom') || id.includes('node_modules/react/')) {
                return 'vendor-react';
              }
              if (id.includes('@mediapipe/')) {
                return 'vendor-mediapipe';
              }
              if (id.includes('jszip')) {
                return 'vendor-jszip';
              }
              if (id.includes('@sentry/')) {
                return 'vendor-sentry';
              }
              if (id.includes('@material/material-color-utilities')) {
                return 'vendor-color-utils';
              }
              if (id.includes('@fontsource/')) {
                return 'vendor-fonts';
              }
              // Let Rollup handle app code splitting automatically
              return undefined;
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
          // Force resolution of @mui packages to prevent duplication
          '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
          '@mui/system': path.resolve(__dirname, 'node_modules/@mui/system'),
          '@mui/icons-material': path.resolve(__dirname, 'node_modules/@mui/icons-material'),
          '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
          '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
        }
      },
      // Clear cache when Vite version changes
      clearScreen: false,
      logLevel: 'info'
    };
});
