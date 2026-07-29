import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'maskable-icon-512.png'],
        manifest: {
          name: 'BelanjaKlik',
          short_name: 'BelanjaKlik',
          description: 'Asisten Belanja Pribadi Serba Ada - Alfamind Store',
          theme_color: '#e11d48',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['shopping', 'lifestyle', 'business'],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/maskable-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      dirStyle: 'nested',
      async onPageRendered(_route: string, renderedHTML: string, appCtx: any) {
        if (appCtx.head) {
          const { renderSSRHead } = await import('@unhead/vue/server')
          const headPayload = await renderSSRHead(appCtx.head)

          let html = renderedHTML
          if (headPayload.headTags) {
            html = html.replace('</head>', `${headPayload.headTags}\n</head>`)
          }
          if (headPayload.htmlAttrs) {
            html = html.replace('<html', `<html ${headPayload.htmlAttrs}`)
          }
          if (headPayload.bodyAttrs) {
            html = html.replace('<body', `<body ${headPayload.bodyAttrs}`)
          }
          return html
        }
        return renderedHTML
      },
      async includedRoutes(paths: string[], _routes: any[]) {
        // Exclude all dynamic product routes from SSG pre-rendering
        // Dynamic product detail pages are rendered client-side (SPA fallback) via Vue Router
        return paths.filter((path: string) => 
          !path.startsWith('/produk/') && 
          !path.startsWith('/product/') && 
          !path.includes(':')
        );
      }
    }


  }
})
