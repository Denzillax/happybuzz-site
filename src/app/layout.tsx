import type { Metadata } from 'next'
import './globals.css'
import BetaFeedback from '@/components/shared/BetaFeedback'
import GamificationProvider from '@/components/shared/GamificationProvider'

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
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" />
      </head>
      <body>{children}<BetaFeedback /><GamificationProvider /></body>
    </html>
  )
}