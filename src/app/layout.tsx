import type { Metadata } from 'next'
import './globals.css'
import BetaFeedback from '@/components/shared/BetaFeedback'

export const metadata = {
  title: {
    default: 'BEEDARO – Kaufen, Verkaufen & Gutes tun',
    template: '%s | BEEDARO',
  },
  description: 'Der Schweizer Marktplatz für nachhaltiges Kaufen, Verkaufen und Mieten. Ab 3% Gebühr – ein Teil fliesst in Bienen- und Naturprojekte.',
  icons: {
    icon: '/favicon.svg',
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
      </head>
      <body>{children}<BetaFeedback /></body>
    </html>
  )
}