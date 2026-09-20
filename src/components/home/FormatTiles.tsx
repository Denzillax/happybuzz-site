'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useInView } from '@/components/shared/effects'
import { Tag, Gavel, CalendarClock, Gift, Wrench } from 'lucide-react'
import { TYP_PASTELL } from '@/lib/constants'

const HEAD = "'Instrument Sans', 'General Sans', 'Instrument Sans', 'Manrope', system-ui, sans-serif"
const INK = '#1D1D1D'

// Die fuenf Formate als Direkteinstieg: Miete/Service/Gratis hat kein
// Schweizer Konkurrent, also gehoeren sie prominent auf die Startseite.
const FORMATE = [
  { type: 'sell', label: 'Festpreis', sub: 'Kaufen wie gewohnt', icon: Tag },
  { type: 'auction', label: 'Auktion', sub: 'Bieten und gewinnen', icon: Gavel },
  { type: 'rent', label: 'Mieten', sub: 'Nutzen statt besitzen', icon: CalendarClock },
  { type: 'free', label: 'Gratis', sub: 'Verschenken, abholen', icon: Gift },
  { type: 'service', label: 'Service', sub: 'Handwerk und Hilfe buchen', icon: Wrench },
]

// Meeko-Design (20.09.2026): jede Kachel ist ganz in der Pastellfarbe ihres Formats, dieselbe wie die Tafel hinter den Inseratbildern
const pastell: Record<string, string> = TYP_PASTELL

export function FormatTiles() {
  // Icons bewegen sich einmal, wenn die Reihe ins Bild kommt (gestaffelt), und beim Hovern
  // der Kachel erneut. Die Bewegungen stehen in globals.css unter FORMAT-ICONS.
  const gridRef = useRef<HTMLDivElement>(null)
  const imBild = useInView(gridRef)
  // Nach dem ersten Durchlauf die Einblend-Animation abschalten. Sonst greift sie beim
  // VERLASSEN einer Kachel wieder (die Hover-Regel fällt weg, der Animationsname wechselt
  // zurück) und das Icon bewegt sich ein zweites Mal. Gewollt ist nur: beim Draufgehen.
  const [fertig, setFertig] = useState(false)
  useEffect(() => {
    if (!imBild) return
    const t = setTimeout(() => setFertig(true), 1700)
    return () => clearTimeout(t)
  }, [imBild])
  return (
    <section style={{ padding: '48px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fmt-tile { transition: transform .3s cubic-bezier(.2,.7,.1,1); }
        .fmt-tile:hover { transform: translateY(-5px); filter: none !important; }
        .fmt-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        /* Mobile: wischbare Zeile, gleiches Muster wie Kategorien-Pills.
           Keine Kind-Selektoren in Inline-Styles (Hydration-Error). */
        @media (max-width: 860px) {
          .fmt-grid { display: flex; overflow-x: auto; gap: 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 4px; scroll-snap-type: x proximity; }
          .fmt-grid::-webkit-scrollbar { display: none; }
          .fmt-tile { flex: 0 0 58vw; max-width: 240px; scroll-snap-align: start; }
        }
      `}</style>
      <h2 className="bd-abschnittstitel" style={{ fontFamily: HEAD, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 500, letterSpacing: '-0.035em', color: INK, margin: '0 0 20px' }}>
        Fünf Formate, ein Marktplatz
      </h2>
      <div ref={gridRef} className={"fmt-grid" + (imBild && !fertig ? " is-in" : "")}>
        {FORMATE.map((f, i) => {
          const Icon = f.icon
          return (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`fmt-tile fmt-tile-${f.type} mk-${pastell[f.type]}`} style={{
              border: '1px solid #1D1D1D', borderRadius: 20,
              padding: '18px 16px', textDecoration: 'none', color: INK,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Icon-Feld in der Typfarbe des Formats, dieselbe wie der Chip auf den Inseraten */}
              <div style={{ width: 42, height: 42, flexShrink: 0, background: '#fff', color: INK, border: '1px solid #1D1D1D', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className={`fmt-icon fmt-icon-${f.type}`} style={{ display: 'inline-flex', animationDelay: `${i * 140}ms` }}>
                  <Icon size={19} strokeWidth={1.9} />
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 600, letterSpacing: '-0.025em' }}>{f.label}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(29,29,29,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.sub}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
