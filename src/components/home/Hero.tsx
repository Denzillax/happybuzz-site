'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { ArrowRight, Plus, MessageSquareHeart, Flower2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'

// Meeko-Hero, vierte Fassung (Denis 21.09.2026: über die ganze Fläche, keine Inserate im Hero, etwas Lustiges mit dem Tiger).
// Mint von Rand zu Rand, der schwebende Header liegt darauf. Links der Satz mit gelbem Marker und EINEM gelben Hauptknopf.
// Rechts ragt der Tiger von unten ins Bild: die Lamellen seiner Brille gehen wie eine Jalousie auf und zu (im SVG selbst), hinter ihm dreht
// sich langsam ein Strahlenkranz, und in seiner Sprechblase wechseln trockene Sprüche. Alles steht still, wenn jemand weniger
// Bewegung wünscht. Die Suche sitzt im Header. Styles: globals.css, Block HERO FLÄCHE (hf-*).
const SPRUECHE = [
  'Schau mir in die Augen.',
  'Du inserierst heute die Hantelbank.',
  'Dein Keller nickt schon.',
  'Und den Raclette-Ofen. Den zweiten.',
  'Widerstand ist unpraktisch.',
]

export function Hero() {
  const [online, setOnline] = useState(0)
  const [spruch, setSpruch] = useState(0)

  // echte Zahl der Inserate, die gerade online sind (gleiche Bedingung wie die Inseratlisten). Ohne Zahl bleibt die Zeile weg.
  useEffect(() => {
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .then(({ count }) => { if (count && count > 0) setOnline(count) })
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setSpruch((s) => (s + 1) % SPRUECHE.length), 3600)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="hf">
      <div className="hf-strahlen" aria-hidden="true" />
      <div className="hf-innen">
        <div className="hf-text">
          {/* Beta-Feedback Tacocat 08.09.: der gute Zweck steht zuoberst, als eigene Zeile über dem Titel */}
          <Link href="/impact" className="hf-zweck">
            <Flower2 size={15} aria-hidden="true" /> 20% jeder Gebühr fliessen in den Bienenschutz <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <h1 className="hf-titel">Was du suchst,<br /><span className="hf-marker">hat schon jemand.</span></h1>
          <p className="hf-unter">Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate.</p>
          <div className="hf-knoepfe">
            <Magnetic><Link href="/listings/new" className="hf-knopf hf-knopf-haupt"><Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Inserieren</Link></Magnetic>
            <Magnetic><Link href="/search" className="hf-knopf">Stöbern <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" /></Link></Magnetic>
          </div>
          <p className="hf-zeile">
            {online > 0 && <span className="hf-live"><span className="hf-live-punkt" aria-hidden="true" /> {online.toLocaleString('de-CH')} Inserate gerade online</span>}
            <Link href="/beta" className="hf-beta"><MessageSquareHeart size={15} aria-hidden="true" /> Geschlossene Beta: so testest du mit</Link>
          </p>
        </div>

        {/* Der Tiger ist Zier: die Sprüche sind ein Witz und keine Information, darum für Vorleseprogramme ausgeblendet */}
        <div className="hf-tiger" aria-hidden="true">
          <span className="hf-blase" key={spruch}>{SPRUECHE[spruch]}</span>
          <span className="hf-sticker">Nicht wegschauen.</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tiger-hero.svg" alt="" width="640" height="640" />
        </div>
      </div>
    </section>
  )
}
