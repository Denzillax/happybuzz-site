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
  { type: 'service', label: 'Service', sub: 'Hilfe & Services buchen', icon: Wrench },
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
        /* Überarbeitet (Denis 21.09.2026): fünf gleichwertige Kacheln, Icon oben, Name und Untertitel darunter. So hat jeder
           Untertitel die volle Kachelbreite und darf umbrechen, nichts wird abgeschnitten. Masse überall gleich. */
        .fmt-tile { display: flex; flex-direction: column; gap: 16px; min-height: 148px; padding: 18px; border: 1px solid #1D1D1D; border-radius: 20px; color: #1D1D1D; text-decoration: none; transition: transform .3s cubic-bezier(.2,.7,.1,1); }
        .fmt-tile:hover { transform: translateY(-5px); filter: none !important; }
        .fmt-feld { width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid #1D1D1D; border-radius: 12px; background: #fff; }
        .fmt-name { font-size: 18px; font-weight: 600; letter-spacing: -.025em; line-height: 1.15; }
        .fmt-sub { margin-top: 4px; font-size: 13px; line-height: 1.35; color: rgba(29,29,29,.72); }
        .fmt-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        /* Mobile: wischbare Zeile, gleiches Muster wie Kategorien-Pills.
           Keine Kind-Selektoren in Inline-Styles (Hydration-Error). */
        @media (max-width: 1100px) {
          .fmt-grid { display: flex; overflow-x: auto; gap: 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 4px; scroll-snap-type: x proximity; }
          .fmt-grid::-webkit-scrollbar { display: none; }
          .fmt-tile { flex: 0 0 44vw; max-width: 200px; min-height: 140px; scroll-snap-align: start; }
        }
      `}</style>
      <h2 className="bd-abschnittstitel" style={{ fontFamily: HEAD, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 500, letterSpacing: '-0.035em', color: INK, margin: '0 0 20px' }}>
        Fünf Formate, ein Marktplatz
      </h2>
      <div ref={gridRef} className={"fmt-grid" + (imBild && !fertig ? " is-in" : "")}>
        {FORMATE.map((f, i) => {
          const Icon = f.icon
          return (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`fmt-tile fmt-tile-${f.type} mk-${pastell[f.type]}`}>
              <div className="fmt-feld">
                <span className={`fmt-icon fmt-icon-${f.type}`} style={{ display: 'inline-flex', animationDelay: `${i * 140}ms` }}>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
              </div>
              <div style={{ marginTop: 'auto', minWidth: 0 }}>
                <div className="fmt-name" style={{ fontFamily: HEAD }}>{f.label}</div>
                <div className="fmt-sub">{f.sub}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
