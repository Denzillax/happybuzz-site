'use client'
import Link from 'next/link'
import { Tag, Gavel, CalendarClock, Gift, Wrench } from 'lucide-react'

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const INK = '#191615'
const CHIP = '#F2EEE7'

// Die fuenf Formate als Direkteinstieg: Miete/Service/Gratis hat kein
// Schweizer Konkurrent, also gehoeren sie prominent auf die Startseite.
const FORMATE = [
  { type: 'sell', label: 'Festpreis', sub: 'Kaufen wie gewohnt', icon: Tag },
  { type: 'auction', label: 'Auktion', sub: 'Bieten und gewinnen', icon: Gavel },
  { type: 'rent', label: 'Mieten', sub: 'Nutzen statt besitzen', icon: CalendarClock },
  { type: 'free', label: 'Gratis', sub: 'Verschenken, abholen', icon: Gift },
  { type: 'service', label: 'Service', sub: 'Können buchen', icon: Wrench },
]

export function FormatTiles() {
  return (
    <section style={{ padding: '28px 24px 36px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fmt-tile { transition: background .15s ease; }
        .fmt-tile:hover { background: #F4C03F !important; }
        .fmt-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        /* Mobile: wischbare Zeile, gleiches Muster wie Kategorien-Pills.
           Keine Kind-Selektoren in Inline-Styles (Hydration-Error). */
        @media (max-width: 860px) {
          .fmt-grid { display: flex; overflow-x: auto; gap: 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 4px; scroll-snap-type: x proximity; }
          .fmt-grid::-webkit-scrollbar { display: none; }
          .fmt-tile { flex: 0 0 58vw; max-width: 240px; scroll-snap-align: start; }
        }
      `}</style>
      <h2 style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: INK, margin: '0 0 14px' }}>
        Fünf Formate, ein Marktplatz
      </h2>
      <div className="fmt-grid">
        {FORMATE.map((f) => {
          const Icon = f.icon
          return (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`fmt-tile fmt-tile-${f.type}`} style={{
              background: CHIP, borderRadius: 12,
              padding: '16px 14px', textDecoration: 'none', color: INK,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} strokeWidth={1.9} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{f.label}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(25,22,21,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.sub}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
