'use client'
import Link from 'next/link'
import { Coins, Timer, Sparkles, Truck, ShieldCheck } from 'lucide-react'
import { FEE_FREE_BELOW } from '@/lib/constants'

// Schnelleinstiege nach Preis und Anlass (Denis 19.09.2026, Anregung marko.ch).
// "Unter CHF 20" ist bei BEEDARO mehr als ein Preisfilter: diese Verkäufe sind
// gebührenfrei. Die Formate (Miete, Gratis, Service) stehen in FormatTiles, hier
// geht es um Preis und Dringlichkeit. Die Suche liest max / sort / verified aus der URL.
const INK = '#191615'
const BODY = "'Manrope', system-ui, sans-serif"

const CHIPS = [
  { label: `Unter CHF ${FEE_FREE_BELOW}`, zusatz: 'gebührenfrei', href: `/search?max=${FEE_FREE_BELOW}`, icon: Coins, honig: true },
  { label: 'Unter CHF 50', href: '/search?max=50', icon: Coins },
  { label: 'Unter CHF 100', href: '/search?max=100', icon: Coins },
  { label: 'Endet bald', href: '/search?type=auction&sort=endet_bald', icon: Timer },
  { label: 'Neu eingestellt', href: '/search?sort=newest', icon: Sparkles },
  { label: 'Mit Versand', href: '/search?delivery=shipping', icon: Truck },
  { label: 'Verifizierte Verkäufer', href: '/search?verified=1', icon: ShieldCheck },
]

export function EntdeckenChips() {
  return (
    <section style={{ padding: '14px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .entdecken-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .entdecken-chip { transition: background .15s ease, border-color .15s ease; }
        .entdecken-chip:hover { background: #F4F4F2 !important; filter: none !important; }
        .entdecken-chip:hover svg { stroke: #0E9493; }
        @media (max-width: 860px) {
          .entdecken-row { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .entdecken-row::-webkit-scrollbar { display: none; }
        }
      `}</style>
      <div className="entdecken-row">
        <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(25,22,21,.5)', marginRight: 4, flexShrink: 0 }}>Entdecken</span>
        {CHIPS.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.href} href={c.href} className="entdecken-chip" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, whiteSpace: 'nowrap',
              textDecoration: 'none', color: INK, fontFamily: BODY, fontSize: 13, fontWeight: 600,
              padding: '7px 13px', borderRadius: 999,
              background: c.honig ? '#FFF6DB' : '#fff',
              border: `1px solid ${c.honig ? '#F0E3BC' : '#E4E0D8'}`,
            }}>
              <Icon size={14} />
              {c.label}
              {c.zusatz && <span style={{ fontSize: 11, fontWeight: 800, color: '#8a6d00' }}>{c.zusatz}</span>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
