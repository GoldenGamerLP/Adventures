// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/leaflet',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxtjs/turnstile',
    '@nuxt/fonts',
    'nuxt-capo',
    'nuxt-actions',
    'nuxt-i18n-micro',
  ],
  turnstile: {
    siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY || '',
  },
  routeRules: {
    'a.tile.openstreetmap.org/**': {
      security: {
        headers: {
          //Enable default browser referrer policy for OSM tiles to ensure proper attribution and functionality
          'referrerPolicy': 'strict-origin-when-cross-origin',
        }
      }
    },
  },
  capo: {
    server: false,
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: '@/components/ui'
  },
  i18n: {
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'de', name: 'German', language: 'de-DE', file: 'de.json' },
    ],
    defaultLocale: 'de',
    strategy: 'no_prefix',
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  nitro: {
    experimental: {
      websocket: true,
      asyncContext: true,
    }
  },
  experimental: {
    appManifest: true,
    headNext: true,
    lazyHydration: true,
    sharedPrerenderData: true,
    viewTransition: true,
    extractAsyncDataHandlers: true,
    typescriptPlugin: true,
    restoreState: true,
  },
  app: {
    keepalive: {
      //Include only the front page / index.vue
      exclude: [
        "adventure-drafts",
        "adventure-drafts-[draftId]",
      ]
    },
    head: {
      title: 'Adventures - Finde und erstelle spannende Outdoor-Abenteuer',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1' },
        { charset: 'utf-8' },
        { name: 'color-scheme', content: 'dark light' },
      ],
      htmlAttrs: {
        lang: 'de',
      },
      link: [
        { rel: 'icon', type: 'image/png', href: '/white_adventures_logo.webp' },
      ]
    }
  },
  pinia: {
    storesDirs: ['./app/stores/**'],
  },
  router: {
    options: {
      scrollBehaviorType: 'smooth',
    }
  },
})