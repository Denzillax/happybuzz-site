import type { MetadataRoute } from 'next'

const BASE = 'https://happybuzz.ch'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private/transaktionale Bereiche nicht indexieren
      disallow: [
        '/admin',
        '/settings',
        '/order/',
        '/chat',
        '/favorites',
        '/purchases',
        '/sales',
        '/bids',
        '/bookings',
        '/hive',
        '/listings',
        '/login',
        '/beta',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
