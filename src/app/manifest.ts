import type { MetadataRoute } from 'next'

// Web-App-Manifest: macht BEEDARO am Handy installierbar (PWA light,
// bewusst ohne Service Worker, damit Deploys nie in einem Cache haengen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beedaro',
    short_name: 'Beedaro',
    description: 'Der Schweizer Marktplatz für Secondhand: Kaufen, Verkaufen, Mieten. Ab 3% Gebühr, 20% davon für Bienen- und Naturprojekte.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8F2',
    theme_color: '#F4C03F',
    lang: 'de-CH',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
