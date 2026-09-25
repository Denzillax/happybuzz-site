import Link from 'next/link'
import BLogo from '@/components/shared/BLogo'

// Neues Logo aus dem Meeko-Design, übertragen aufs Live-Design (Denis 25.09.2026): kacheliges B plus Wortmarke "beedaro"
// in Sora 700, ganz in Ink (auf dunklem Grund weiss). Ein gelbes B war die erste Fassung und wirkte neben dem gelben Hero
// und den gelben Knöpfen nur wie ein weiterer gelber Fleck (Denis 25.09.2026, Variante A gewählt).
// width bleibt die Gesamtbreite wie bisher, damit alle Aufrufer (Header, Fuss, Splash, Beta-Tor, Login) unverändert passen:
// das B nimmt 18.5 % davon, die Schrift rechnet sich daraus.
export function Logo({ width = 400, white = false }: { width?: number, white?: boolean }) {
  return (
    <Link href="/" aria-label="BEEDARO, zur Startseite" className="bd-logo flex items-center shrink-0"
      style={{ width, gap: width * 0.042, color: white ? '#fff' : '#191615', textDecoration: 'none' }}>
      <BLogo size={width * 0.185} title="" />
      <span style={{ fontFamily: "'Sora', 'Manrope', sans-serif", fontSize: width * 0.178, fontWeight: 700, letterSpacing: '-.05em', lineHeight: 1 }}>beedaro</span>
    </Link>
  )
}
