'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { ArrowRight, Plus, MessageSquareHeart, Flower2, CircleCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { getCoverUrl, getDisplayPrice } from '@/lib/formatters'
import { TYP_LABEL, TYP_PASTELL } from '@/lib/constants'

// Meeko-Hero, zweite Fassung (Denis 21.09.2026: Hero neu designen). Aufbau wie der Hero, der im alten Design gut ankam, in der
// Formensprache von Meeko: eine Karte mit Ink-Rand. Links ein Mint-Feld mit einem Stapel ECHTER Inserate (bei jedem Laden
// zufällig gewählt), der von allein weiterblättert. Rechts der Satz mit gelbem Marker, EIN gelber Hauptknopf, darunter die
// echte Zahl der Inserate, die gerade online sind. Daneben die Beta-Karte, hell, mit den drei Dingen zum Testen.
// Die Suche sitzt im Header, darum hier keine zweite. Styles: globals.css, Block HERO NEU (hn-*).
const LABEL: Record<string, string> = TYP_LABEL
const PASTELL: Record<string, string> = TYP_PASTELL
const LISTE = 'id, title, listing_type, price, start_price, rent_price, rent_period, created_at, listing_images(url, sort_order)'

// Plätze im Stapel: 0 vorn, 1 und 2 schauen dahinter hervor, der letzte ist die Karte, die gerade nach links weggewischt wurde.
// Platz 2 blendet nur ein (kein Flug quer durchs Bild), weil die Karte dort unsichtbar ankommt.
const PLATZ: any[] = [
  { transform: 'translate(-50%, -50%) rotate(-4deg) scale(1)', opacity: 1, zIndex: 4 },
  { transform: 'translate(-22%, -56%) rotate(8deg) scale(.86)', opacity: 1, zIndex: 3, pointerEvents: 'none' },
  { transform: 'translate(0%, -60%) rotate(15deg) scale(.73)', opacity: .95, zIndex: 2, pointerEvents: 'none', transition: 'opacity .45s ease .3s' },
  { transform: 'translate(-180%, -46%) rotate(-24deg) scale(1)', opacity: 0, zIndex: 5, pointerEvents: 'none' },
]

function preis(l: any) {
  if (l.listing_type === 'free') return 'Gratis'
  const p = getDisplayPrice(l)
  return `${p.prefix}${p.text}${p.suffix}`
}

export function Hero() {
  const [inserate, setInserate] = useState<any[]>([])
  const [online, setOnline] = useState(0)
  const [vorn, setVorn] = useState(0)
  const [halt, setHalt] = useState(false)

  useEffect(() => {
    const jetzt = new Date().toISOString()
    supabase.from('listings').select(LISTE, { count: 'exact' }).eq('status', 'active').or(`expires_at.is.null,expires_at.gt.${jetzt}`)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data, count }) => { setInserate((data || []).filter((l: any) => getCoverUrl(l))); if (count && count > 0) setOnline(count) })
  }, [])

  // Zufällige Auswahl, erst im Browser gemischt (kein Unterschied zwischen Server und Browser)
  const stapel = useMemo(() => {
    const topf = [...inserate]
    for (let i = topf.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [topf[i], topf[j]] = [topf[j], topf[i]] }
    return topf.slice(0, 4)
  }, [inserate])

  // Blättert von allein, hält beim Überfahren an und steht still, wenn jemand weniger Bewegung wünscht
  useEffect(() => {
    if (halt || stapel.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setVorn((v) => (v + 1) % stapel.length), 2800)
    return () => clearInterval(t)
  }, [halt, stapel.length])

  const platz = (i: number) => {
    const n = stapel.length
    const p = (i - vorn + n) % n
    // bei weniger als vier Karten ist der letzte Platz immer der "weggewischte"
    return p === n - 1 && n > 1 && p !== 0 ? PLATZ[3] : PLATZ[Math.min(p, 2)]
  }

  return (
    <div className="hn">
      <div className="hn-reihe">
        <section className="hn-karte">
          <div className="hn-feld" onMouseEnter={() => setHalt(true)} onMouseLeave={() => setHalt(false)}>
            <span className="hn-marke" aria-hidden="true">Secondhand aus der Schweiz</span>
            {stapel.map((l, i) => (
              <Link key={l.id} href={`/listing/${l.id}`} className="hn-fund" style={platz(i)} tabIndex={platz(i) === PLATZ[0] ? 0 : -1}
                aria-label={`${l.title}, ${LABEL[l.listing_type] || ''}, ${preis(l)}`}>
                <span className="hn-fund-bild">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getCoverUrl(l)} alt="" />
                  <span className={`hn-fund-format mk-${PASTELL[l.listing_type] || 'lavendel'}`}>{LABEL[l.listing_type]}</span>
                </span>
                <span className="hn-fund-fuss"><span className="hn-fund-titel">{l.title}</span><b>{preis(l)}</b></span>
              </Link>
            ))}
          </div>

          <div className="hn-text">
            {/* Beta-Feedback Tacocat 08.09.: der gute Zweck steht zuoberst, als eigene Zeile über dem Titel */}
            <Link href="/impact" className="hn-zweck">
              <Flower2 size={15} aria-hidden="true" /> 20% jeder Gebühr fliessen in den Bienenschutz <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <h1 className="hn-titel">Was du suchst, <span className="hn-marker">hat schon jemand.</span></h1>
            <p className="hn-unter">Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate.</p>
            <div className="hn-knoepfe">
              <Magnetic><Link href="/listings/new" className="hn-knopf hn-knopf-haupt"><Plus size={17} strokeWidth={2.4} aria-hidden="true" /> Inserieren</Link></Magnetic>
              <Magnetic><Link href="/search" className="hn-knopf">Stöbern <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link></Magnetic>
            </div>
            {online > 0 && <p className="hn-live"><span className="hn-live-punkt" aria-hidden="true" /> {online.toLocaleString('de-CH')} Inserate gerade online</p>}
          </div>
        </section>

        <section className="hn-beta">
          <span className="hn-beta-marke"><span className="hn-punkt" aria-hidden="true" /> Geschlossene Beta</span>
          <h2 className="hn-beta-titel">Willkommen, Beta-Crew.</h2>
          <p className="hn-beta-text">Du gehörst zu den Ersten. Melde alles, was klemmt.</p>
          <ul className="hn-beta-liste">
            {['Kaufen und bieten', 'Inserieren und verkaufen', 'Mieten und buchen'].map((s) => (
              <li key={s}><CircleCheck size={17} color="#50804F" aria-hidden="true" /> {s}</li>
            ))}
          </ul>
          <Link href="/beta" className="hn-knopf hn-beta-knopf"><MessageSquareHeart size={16} aria-hidden="true" /> So testest du mit</Link>
        </section>

        {/* Handy: schmale Beta-Leiste statt der grossen Karte */}
        <Link href="/beta" className="hn-mini">
          <span className="hn-punkt" aria-hidden="true" /> Beta: So testest du mit <ArrowRight size={15} style={{ marginLeft: 'auto', flexShrink: 0 }} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
