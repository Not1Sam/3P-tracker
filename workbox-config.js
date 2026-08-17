module.exports = {
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{js,html,css,png,ico,json,woff2,woff,ttf}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [
    /^\/_/,
    /\/[^/]+\.[^/]+$/
  ],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.(supabase\.co|supabase\.in)\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3600
        }
      }
    },
    {
      urlPattern: /^https?.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200
        }
      }
    }
  ]
};
