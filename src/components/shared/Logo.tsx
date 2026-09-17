import Link from 'next/link'

// Logo-Test (Denis 17.09.): neues Bildzeichen VOR dem Wortmarke-B, der alte
// Honig-Pfeil hinter dem "o" ist raus (logo-wordmark.svg = logo.svg ohne die
// zwei Pfeil-Pfade, enger Ausschnitt). Groessen: Wortmarke 950x185, Zeichen
// 812x907 Einheiten; das Zeichen ist so hoch wie die Wortmarke.
const WORTMARKE = 950 / 185   // Breite/Hoehe
const ZEICHEN = 812 / 907
const LUECKE = 0.32           // Abstand in Hoehen-Einheiten
const GESAMT = ZEICHEN + LUECKE + WORTMARKE

export function Logo({ width = 400, white = false }: { width?: number, white?: boolean }) {
  const h = width / GESAMT
  return (
    <Link href="/" className="flex items-center shrink-0" aria-label="BEEDARO" style={{ gap: h * LUECKE, ...(white ? { filter: 'brightness(0) invert(1)' } : {}) }}>
      <img src="/logo-icon.svg" alt="" aria-hidden="true" style={{ height: h, width: h * ZEICHEN, display: 'block' }} />
      <img src="/logo-wordmark.svg" alt="BEEDARO" style={{ height: h, width: h * WORTMARKE, display: 'block' }} />
    </Link>
  )
}
