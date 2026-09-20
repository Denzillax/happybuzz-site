import Link from 'next/link'
import BLogo from '@/components/shared/BLogo'

// Meeko-Design (20.09.2026): kacheliges B plus Wortmarke "beedaro" in Instrument Sans statt der Bilddatei /logo.svg.
// width bleibt die Gesamtbreite wie bisher, damit alle Aufrufer (Header, Fuss, Rechnungen, Splash) unverändert passen:
// das B nimmt 21 % davon, die Schrift rechnet sich daraus. Die Farbe kommt aus currentColor (white = weiss).
export function Logo({ width = 400, white = false }: { width?: number, white?: boolean }) {
  return (
    <Link href="/" aria-label="BEEDARO, zur Startseite" className="bd-logo flex items-center shrink-0"
      style={{ width, gap: width * 0.06, color: white ? '#fff' : '#1D1D1D', textDecoration: 'none' }}>
      <BLogo size={width * 0.21} title="" />
      <span style={{ fontFamily: "'Instrument Sans', 'General Sans', sans-serif", fontSize: width * 0.2, fontWeight: 600, letterSpacing: '-.05em', lineHeight: 1 }}>beedaro</span>
    </Link>
  )
}
