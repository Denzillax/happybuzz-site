import type { Metadata, Viewport } from 'next'
import './globals.css'
import BetaFeedback from '@/components/shared/BetaFeedback'
import GamificationProvider from '@/components/shared/GamificationProvider'
import AppSplash from '@/components/shared/AppSplash'

export const metadata: Metadata = {
  metadataBase: new URL('https://beedaro.ch'),
  title: {
    default: 'BEEDARO: Kaufen, Verkaufen & Gutes tun',
    template: '%s | BEEDARO',
  },
  description: 'Der Schweizer Marktplatz für nachhaltiges Kaufen, Verkaufen und Mieten. Ab 3% Gebühr, ein Teil fliesst in Bienen- und Naturprojekte.',
  icons: {
    icon: '/favicon.svg',
  },
  // "Zum Home-Bildschirm" auf iOS: eigener Fenstermodus + App-Titel
  appleWebApp: {
    capable: true,
    title: 'Beedaro',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    siteName: 'BEEDARO',
    title: 'BEEDARO: Kaufen, Verkaufen & Gutes tun',
    description: 'Der Schweizer Marktplatz für nachhaltiges Kaufen, Verkaufen und Mieten. Ab 3% Gebühr, ein Teil fliesst in Bienen- und Naturprojekte.',
    images: [{ url: '/images/bee-impact.jpg', width: 1923, height: 1292, alt: 'BEEDARO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BEEDARO: Kaufen, Verkaufen & Gutes tun',
    description: 'Der Schweizer Marktplatz für nachhaltiges Kaufen, Verkaufen und Mieten.',
    images: ['/images/bee-impact.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#F4C03F',
}

// Organisations- und Website-Daten fuer Google und KI-Assistenten:
// WebSite mit SearchAction macht die interne Suche maschinenlesbar.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://beedaro.ch/#org',
      name: 'BEEDARO',
      url: 'https://beedaro.ch',
      logo: 'https://beedaro.ch/logo.svg',
      description: 'Schweizer Marktplatz für Secondhand: Kaufen, Verkaufen, Auktionen, Mieten und Services. Ab 3% Gebühr, 20% davon fliessen in Bienen- und Naturprojekte (Bee-Impact).',
      areaServed: 'CH',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://beedaro.ch/#website',
      name: 'BEEDARO',
      url: 'https://beedaro.ch',
      publisher: { '@id': 'https://beedaro.ch/#org' },
      inLanguage: 'de-CH',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://beedaro.ch/search?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body><AppSplash />{children}<BetaFeedback /><GamificationProvider /></body>
    </html>
  )
}