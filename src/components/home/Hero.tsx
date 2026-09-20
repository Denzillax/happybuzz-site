'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { ArrowRight, Plus, MessageSquareHeart, Flower2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { getCoverUrl, getDisplayPrice } from '@/lib/formatters'
import { TYP_LABEL, TYP_PASTELL } from '@/lib/constants'

// Meeko-Design, Schritt 2 (Denis 20.09.2026): Hero über die volle Breite in der Hauptfarbe (--mk-hero), zentrierter
// Hauptsatz, links und rechts schweben echte Inserate auf der Tafel ihrer Formatfarbe. Sie weichen dem Mauszeiger leicht
// aus und sind bei jedem Laden zufällig gewählt. Inhalt wie vorher: Hinweis auf den Bienenschutz, Hauptsatz, Inserieren,
// Stöbern, Einstieg für die Beta. Die Suche sitzt im Header, darum hier keine zweite.
// Styles: globals.css, Block MEEKO-LABOR (mk-hero, mk-schweb-*) und MEEKO STARTSEITE (mk-hero-echt).
const LABEL: Record<string, string> = TYP_LABEL
const PASTELL: Record<string, string> = TYP_PASTELL
const LISTE = 'id, title, listing_type, price, start_price, rent_price, rent_period, created_at, listing_images(url, sort_order)'

function preis(l: any) {
  if (l.listing_type === 'free') return 'Gratis'
  const p = getDisplayPrice(l)
  return `${p.prefix}${p.text}${p.suffix}`
}

export function Hero() {
  const [inserate, setInserate] = useState<any[]>([])
  const hero = useRef<HTMLElement>(null)

  useEffect(() => {
    const jetzt = new Date().toISOString()
    supabase.from('listings').select(LISTE).eq('status', 'active').or(`expires_at.is.null,expires_at.gt.${jetzt}`)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setInserate((data || []).filter((l: any) => getCoverUrl(l))))
  }, [])

  // Zufällige Auswahl, erst im Browser gemischt (kein Unterschied zwischen Server und Browser)
  const schweb = useMemo(() => {
    const topf = [...inserate]
    for (let i = topf.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [topf[i], topf[j]] = [topf[j], topf[i]] }
    return topf.slice(0, 6)
  }, [inserate])

  // Zeigerposition als --mx/--my (-1 bis 1), jede Kachel verschiebt sich um ihre Tiefe (--p). Nur mit Maus.
  useEffect(() => {
    const el = hero.current
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let bild = 0
    const setzen = (x: number, y: number) => { el.style.setProperty('--mx', x.toFixed(3)); el.style.setProperty('--my', y.toFixed(3)) }
    const bewegt = (e: PointerEvent) => {
      cancelAnimationFrame(bild)
      bild = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        setzen(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
      })
    }
    const weg = () => { cancelAnimationFrame(bild); setzen(0, 0) }
    el.addEventListener('pointermove', bewegt)
    el.addEventListener('pointerleave', weg)
    return () => { cancelAnimationFrame(bild); el.removeEventListener('pointermove', bewegt); el.removeEventListener('pointerleave', weg) }
  }, [])

  return (
    <section className="mk mk-teil mk-hero mk-hero-echt" ref={hero}>
      <div className="mk-schweb-feld">
        {schweb.map((l, i) => (
          <Link key={l.id} href={`/listing/${l.id}`} className={`mk-schweb mk-schweb-${i + 1}`} aria-label={`${l.title}, ${LABEL[l.listing_type] || ''}, ${preis(l)}`}>
            <span className={`mk-schweb-tafel mk-${PASTELL[l.listing_type] || 'lavendel'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getCoverUrl(l)} alt="" />
            </span>
            <span className="mk-schweb-preis">{preis(l)}</span>
          </Link>
        ))}
      </div>

      {/* Beta-Feedback Tacocat 08.09.: der gute Zweck steht zuoberst, als eigene Zeile über dem Titel */}
      <Link href="/impact" className="mk-hero-hinweis">
        <Flower2 size={15} aria-hidden="true" /> 20% jeder Gebühr fliessen in den Bienenschutz <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
      </Link>
      <h1 className="mk-h1">
        {/* fester Umbruch: einzeilig liefe der Satz unter die schwebenden Inserate */}
        Was du suchst,<br />hat schon jemand.
      </h1>
      <p className="mk-hero-text">Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate.</p>
      <div className="mk-hero-knoepfe">
        <Magnetic><Link href="/listings/new" className="mk-knopf mk-knopf-dunkel"><Plus size={17} strokeWidth={2.4} aria-hidden="true" /> Inserieren</Link></Magnetic>
        <Magnetic><Link href="/search" className="mk-knopf">Stöbern <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link></Magnetic>
      </div>
      <Link href="/beta" className="mk-hero-beta">
        <span className="mk-hero-beta-marke">Geschlossene Beta</span>
        <span>Du gehörst zu den Ersten. So testest du mit</span>
        <MessageSquareHeart size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}
