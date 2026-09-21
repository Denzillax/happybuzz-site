'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useInView } from '@/components/shared/effects'
import { Tag, Gavel, CalendarClock, Gift, Wrench, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const INK = '#191615'

// Die fuenf Formate als Direkteinstieg: Miete/Service/Gratis hat kein
// Schweizer Konkurrent, also gehoeren sie prominent auf die Startseite.
const FORMATE = [
  { type: 'sell', label: 'Festpreis', sub: 'Kaufen wie gewohnt', icon: Tag },
  { type: 'auction', label: 'Auktion', sub: 'Bieten und gewinnen', icon: Gavel },
  { type: 'rent', label: 'Mieten', sub: 'Nutzen statt besitzen', icon: CalendarClock },
  { type: 'free', label: 'Gratis', sub: 'Verschenken, abholen', icon: Gift },
  { type: 'service', label: 'Service', sub: 'Handwerk und Hilfe buchen', icon: Wrench },
]

// Neu gestaltet (Denis 21.09.2026): jede Kachel trägt die Pastellfarbe ihres Formats aus dem Meeko-Entwurf (Festpreis Rosé,
// Auktion Lavendel, Miete Himmel, Gratis Butter, Service Rosa). Die Form bleibt die des jetzigen Designs: weiche Rundung,
// feiner Rand, kein Ink-Rahmen. So erkennt man die Formate an der Farbe, und der spätere Wechsel auf Meeko fällt leichter.
const PASTELL: Record<string, string> = { sell: '#FFE2DE', auction: '#E3E3FF', rent: '#D3F0FF', free: '#FEE8B0', service: '#FFDFF9' }

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
  // Echte Zahl der Inserate je Format (aktiv, nicht abgelaufen). Ohne Zahl bleibt das Schild weg.
  const [zahl, setZahl] = useState<Record<string, number>>({})
  useEffect(() => {
    const jetzt = new Date().toISOString()
    FORMATE.forEach((f) => {
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('listing_type', f.type)
        .or(`expires_at.is.null,expires_at.gt.${jetzt}`)
        .then(({ count }) => { if (count && count > 0) setZahl((z) => ({ ...z, [f.type]: count })) })
    })
  }, [])
  return (
    <section style={{ padding: '48px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fmt-tile { position: relative; display: flex; flex-direction: column; min-height: 164px; padding: 16px 16px 15px; border-radius: 18px; border: 1px solid rgba(25,22,21,.08); color: #191615; text-decoration: none; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .fmt-tile:hover { transform: translateY(-4px); box-shadow: 0 14px 26px -12px rgba(25,22,21,.28); border-color: rgba(25,22,21,.22); filter: none !important; }
        .fmt-kopf { display: flex; align-items: flex-start; justify-content: space-between; }
        .fmt-feld { width: 46px; height: 46px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 14px; background: #fff; box-shadow: 0 4px 10px rgba(25,22,21,.08); }
        .fmt-pfeil { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.7); transition: background .2s ease, transform .2s ease; }
        .fmt-tile:hover .fmt-pfeil { background: #191615; color: #fff; transform: rotate(45deg); }
        .fmt-name { margin-top: auto; padding-top: 18px; font-size: 19px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
        .fmt-sub { margin-top: 3px; font-size: 12.5px; line-height: 1.35; color: rgba(25,22,21,.66); }
        .fmt-zahl { align-self: flex-start; margin-top: 10px; padding: 3px 9px 4px; border-radius: 999px; background: rgba(255,255,255,.75); font-size: 11px; font-weight: 800; letter-spacing: .02em; }
        .fmt-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        /* Mobile: wischbare Zeile, gleiches Muster wie Kategorien-Pills.
           Keine Kind-Selektoren in Inline-Styles (Hydration-Error). */
        @media (max-width: 860px) {
          .fmt-grid { display: flex; overflow-x: auto; gap: 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 4px; scroll-snap-type: x proximity; }
          .fmt-grid::-webkit-scrollbar { display: none; }
          .fmt-tile { flex: 0 0 46vw; max-width: 200px; min-height: 150px; scroll-snap-align: start; }
          .fmt-grid { padding-top: 6px; }
        }
      `}</style>
      <h2 className="bd-abschnittstitel" style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: INK, margin: '0 0 14px' }}>
        Fünf Formate, ein Marktplatz
      </h2>
      <div ref={gridRef} className={"fmt-grid" + (imBild && !fertig ? " is-in" : "")}>
        {FORMATE.map((f, i) => {
          const Icon = f.icon
          return (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`fmt-tile fmt-tile-${f.type}`} style={{ background: PASTELL[f.type] }}>
              <div className="fmt-kopf">
                {/* Icon auf weissem Feld, die Farbe trägt jetzt die ganze Kachel */}
                <div className="fmt-feld">
                  <span className={`fmt-icon fmt-icon-${f.type}`} style={{ display: 'inline-flex', animationDelay: `${i * 140}ms` }}>
                    <Icon size={21} strokeWidth={1.9} />
                  </span>
                </div>
                <span className="fmt-pfeil" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={2.2} /></span>
              </div>
              <div className="fmt-name" style={{ fontFamily: HEAD }}>{f.label}</div>
              <div className="fmt-sub">{f.sub}</div>
              {zahl[f.type] > 0 && <span className="fmt-zahl">{zahl[f.type]} online</span>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
