import type { MetadataRoute } from 'next'

// Web-App-Manifest: macht BEEDARO am Handy installierbar (PWA light,
// bewusst ohne Service Worker, damit Deploys nie in einem Cache haengen).
// Icons seit 20.09.2026: Ink-B auf Mint (Denis, Variante P5). Das maskable-Icon ist randlos mit kleinerem B,
// damit Android es als Kreis zuschneiden kann.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beedaro',
    short_name: 'Beedaro',
    description: 'Der Schweizer Marktplatz für Secondhand: Kaufen, Verkaufen, Mieten. Ab 3% Gebühr, 20% davon für Bienen- und Naturprojekte.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#DBF5F0',
    lang: 'de-CH',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
