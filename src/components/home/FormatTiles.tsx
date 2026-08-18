'use client'
import Link from 'next/link'
import { Tag, Gavel, CalendarClock, Gift, Wrench } from 'lucide-react'

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const MONO = "'Space Mono', ui-monospace, monospace"
const INK = '#14110D'
const PETROL = '#0B5E5C'

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
    <section style={{ padding: '40px 24px 8px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fmt-tile:hover { transform: translateY(-3px); box-shadow: 3px 3px 0 ${INK}; }
        .fmt-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        @media (max-width: 860px) { .fmt-grid { grid-template-columns: repeat(2, 1fr); } .fmt-tile-sell { grid-column: span 2; } }
      `}</style>
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: PETROL, marginBottom: 14, textAlign: 'center' }}>
        Fünf Wege, ein Katalog
      </div>
      <div className="fmt-grid">
        {FORMATE.map((f) => {
          const Icon = f.icon
          return (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`fmt-tile fmt-tile-${f.type}`} style={{
              background: '#fff', border: `1.5px solid ${INK}`, borderRadius: 0,
              padding: '16px 14px', textDecoration: 'none', color: INK,
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s ease',
            }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, background: '#FBF1D2', border: `1px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} strokeWidth={1.9} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{f.label}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(20,17,13,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.sub}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
