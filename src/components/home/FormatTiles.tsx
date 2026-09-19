'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useInView } from '@/components/shared/effects'
import { Tag, Gavel, CalendarClock, Gift, Wrench } from 'lucide-react'
import { TYP_FARBEN } from '@/lib/constants'

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const INK = '#191615'
const CHIP = '#F1F3F5'

// Die fuenf Formate als Direkteinstieg: Miete/Service/Gratis hat kein
// Schweizer Konkurrent, also gehoeren sie prominent auf die Startseite.
const FORMATE = [
  { type: 'sell', label: 'Festpreis', sub: 'Kaufen wie gewohnt', icon: Tag },
  { type: 'auction', label: 'Auktion', sub: 'Bieten und gewinnen', icon: Gavel },
  { type: 'rent', label: 'Mieten', sub: 'Nutzen statt besitzen', icon: CalendarClock },
  { type: 'free', label: 'Gratis', sub: 'Verschenken, abholen', icon: Gift },
  { type: 'service', label: 'Service', sub: 'Handwerk und Hilfe buchen', icon: Wrench },
]

const farben: Record<string, { bg: string; fg: string }> = TYP_FARBEN

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
        .fmt-tile { transition: background .15s ease; }
        .fmt-tile:hover { background: #FFF5D8 !important; filter: none !important; }
        .fmt-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        /* Mobile: wischbare Zeile, gleiches Muster wie Kategorien-Pills.
           Keine Kind-Selektoren in Inline-Styles (Hydration-Error). */
        @media (max-width: 860px) {
          .fmt-grid { display: flex; overflow-x: auto; gap: 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 4px; scroll-snap-type: x proximity; }
          .fmt-grid::-webkit-scrollbar { display: none; }
          .fmt-tile { flex: 0 0 58vw; max-width: 240px; scroll-snap-align: start; }
        }
      `}</style>
      <h2 className="bd-abschnittstitel" style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: INK, margin: '0 0 14px' }}>
        Fünf Formate, ein Marktplatz
      </h2>
      <div ref={gridRef} className={"fmt-grid" + (imBild && !fertig ? " is-in" : "")}>
        {FORMATE.map((f, i) => {
          const Icon = f.icon
          return (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`fmt-tile fmt-tile-${f.type}`} style={{
              background: CHIP, borderRadius: 12,
              padding: '16px 14px', textDecoration: 'none', color: INK,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Icon-Feld in der Typfarbe des Formats, dieselbe wie der Chip auf den Inseraten */}
              <div style={{ width: 40, height: 40, flexShrink: 0, background: farben[f.type].bg, color: farben[f.type].fg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className={`fmt-icon fmt-icon-${f.type}`} style={{ display: 'inline-flex', animationDelay: `${i * 140}ms` }}>
                  <Icon size={19} strokeWidth={1.9} />
                </span>
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
