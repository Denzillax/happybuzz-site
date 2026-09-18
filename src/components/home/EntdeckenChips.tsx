'use client'
import Link from 'next/link'
import { Coins, Timer, Truck } from 'lucide-react'
import { FEE_FREE_BELOW } from '@/lib/constants'

// Schnelleinstiege nach Preis und Anlass (Denis 19.09.2026, Anregung marko.ch).
// Bewusst EXAKT der Stil der Kategorie-Pillen darüber (Klasse cat-pill, gleiche
// Fläche, Schrift, Abstände), damit die zwei Reihen wie eine Einheit wirken. Erste
// Fassung hatte sieben Chips mit Rand und Honigfläche: zu viel los. Jetzt vier.
// Die Formate (Miete, Gratis, Service) stehen in FormatTiles.
const INK = '#191615'
const CHIP = '#F2EEE7'
const BODY = "'Manrope', system-ui, sans-serif"

const CHIPS = [
  { label: `Unter CHF ${FEE_FREE_BELOW}`, href: `/search?max=${FEE_FREE_BELOW}`, icon: Coins },
  { label: 'Unter CHF 50', href: '/search?max=50', icon: Coins },
  { label: 'Endet bald', href: '/search?type=auction&sort=endet_bald', icon: Timer },
  { label: 'Mit Versand', href: '/search?delivery=shipping', icon: Truck },
]

export function EntdeckenChips() {
  return (
    <section style={{ padding: '2px 24px 6px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="cat-pills">
        {CHIPS.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.href} href={c.href} className="cat-pill" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: CHIP, color: INK, textDecoration: 'none',
              fontFamily: BODY, fontSize: 13, fontWeight: 600,
              padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background .15s ease',
            }}>
              <Icon size={15} />
              {c.label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
