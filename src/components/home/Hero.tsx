'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { ArrowRight, Plus, MessageSquareHeart, Flower2 } from 'lucide-react'

// Neu gestaltet (Denis 21.09.2026), gleiche Sprache wie Challenge und Bee-Impact: eine weisse Karte mit feinem Rand und
// weichem Schatten. Rechts der Satz, grösser und fetter als bisher, mit EINEM dunklen Hauptknopf. Links ein Honig-Feld,
// auf dem die Fundstücke als grosser Kartenstapel liegen, der von allein weiterblättert, mit dunklem Aufkleber. Daneben die Beta-Karte als dunkler
// Gegenpol mit Honig-Knopf. Am Handy stehen Satz und Honig-Feld untereinander, die Beta-Karte wird zur schmalen Leiste.
// Im style-Block stehen bewusst keine Kind-Selektoren und keine Anführungszeichen (Hydration).
// Fundstücke als Kartenstapel, der von allein weiterblättert (Denis 21.09.2026: Karten grösser, swipen von selbst).
// Platz 0 liegt vorn, 1 und 2 schauen dahinter hervor, der letzte Platz ist die Karte, die gerade nach links weggewischt wurde.
const FUNDE = ['/images/hero/camera.png', '/images/hero/gameboy.png', '/images/hero/boombox.png', '/images/hero/vinyl.png']
const PLATZ = [
  { transform: 'translate(-50%, -50%) rotate(-4deg) scale(1)', opacity: 1, zIndex: 4 },
  { transform: 'translate(-20%, -56%) rotate(9deg) scale(.86)', opacity: 1, zIndex: 3 },
  { transform: 'translate(2%, -60%) rotate(16deg) scale(.72)', opacity: .92, zIndex: 2, transition: 'opacity .45s ease .3s' },
  { transform: 'translate(-175%, -46%) rotate(-24deg) scale(1)', opacity: 0, zIndex: 5 },
]

export function Hero() {
  const [vorn, setVorn] = useState(0)
  const [halt, setHalt] = useState(false)
  useEffect(() => {
    if (halt || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setVorn((v) => (v + 1) % FUNDE.length), 2600)
    return () => clearInterval(t)
  }, [halt])
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      <style>{`
        .hw-reihe { display: flex; gap: 14px; flex-wrap: wrap; margin: 14px 0 6px; align-items: stretch; }
        .hw { flex: 2 1 560px; min-width: 0; display: flex; align-items: stretch; background: #fff; border: 1px solid #E5E8EC; border-radius: 18px; box-shadow: 0 10px 30px rgba(25,22,21,.07); overflow: hidden; }
        .hw-text { flex: 1 1 340px; min-width: 0; padding: clamp(26px, 3.6vw, 46px) clamp(20px, 3.4vw, 44px); display: flex; flex-direction: column; justify-content: center; }
        .hw-zweck { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; margin-bottom: 16px; padding: 6px 13px; border-radius: 999px; background: #EEF3EC; border: 1px solid #D5E2D2; color: #2F5A2F; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-decoration: none; }
        .hw-titel { margin: 0 0 12px; font-size: clamp(30px, 4.2vw, 50px); font-weight: 800; letter-spacing: -.03em; line-height: 1.05; color: #191615; }
        .hw-unter { margin: 0 0 24px; max-width: 30em; font-size: clamp(14.5px, 1.5vw, 17px); line-height: 1.5; color: #5B626C; }
        .hw-knoepfe { display: flex; gap: 10px; flex-wrap: wrap; }
        .hw-knopf { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 999px; font-size: 15px; font-weight: 800; text-decoration: none; }
        .hw-knopf.dunkel { background: #191615; color: #fff; }
        .hw-knopf.hell { background: #fff; color: #191615; border: 1px solid #D5D9DF; }
        .hw-feld { position: relative; order: -1; overflow: hidden; cursor: pointer; flex: 0 0 38%; min-width: 300px; min-height: 270px; background: #F4C03F; }
        .hw-marke { position: absolute; left: 16px; top: 18px; z-index: 3; padding: 7px 13px 8px; border-radius: 10px; background: #191615; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; transform: rotate(-5deg); box-shadow: 0 6px 14px rgba(25,22,21,.22); white-space: nowrap; }
        .hw-fund { position: absolute; left: 38%; top: 60%; width: 60%; max-width: 250px; padding: 14px; background: #fff; border-radius: 22px; box-shadow: 0 16px 32px rgba(25,22,21,.2); transition: transform .6s cubic-bezier(.3,.7,.2,1), opacity .45s ease; will-change: transform; }
        .hw-fund img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: contain; }
        .hw-beta { flex: 1 1 260px; min-width: 240px; max-width: 420px; box-sizing: border-box; display: flex; flex-direction: column; align-items: flex-start; padding: clamp(22px, 3vw, 30px); border-radius: 18px; background: #191615; color: #fff; box-shadow: 0 10px 30px rgba(25,22,21,.12); }
        .hw-beta-marke { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 14px; padding: 5px 12px; border-radius: 999px; background: rgba(255,255,255,.12); font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .hw-punkt { width: 7px; height: 7px; border-radius: 50%; background: #F4C03F; flex-shrink: 0; }
        .hw-beta-titel { margin: 0 0 8px; font-size: clamp(20px, 2.2vw, 26px); font-weight: 800; letter-spacing: -.02em; line-height: 1.12; color: #fff; }
        .hw-beta-text { margin: 0 0 18px; font-size: 14px; line-height: 1.55; color: rgba(255,255,255,.72); }
        .hw-beta-knopf { margin-top: auto; display: inline-flex; align-items: center; gap: 7px; padding: 12px 20px; border-radius: 999px; background: #F4C03F; color: #191615; font-size: 14px; font-weight: 800; text-decoration: none; }
        .hw-mini { align-items: center; gap: 9px; flex: 1 1 100%; padding: 12px 16px; border-radius: 999px; background: #191615; color: #fff; font-size: 13.5px; font-weight: 800; text-decoration: none; }
        @media (max-width: 860px) {
          .hw { flex-direction: column; }
          .hw-feld { order: 0; flex: 0 0 auto; min-width: 0; min-height: 0; height: 250px; }
          .hw-fund { width: 42%; max-width: 160px; padding: 10px; border-radius: 18px; top: 58%; }
          .hw-knopf { padding: 13px 17px; font-size: 14.5px; }
          .hw-knoepfe { gap: 8px; }
        }
        @media (prefers-reduced-motion: reduce) { .hw-fund { transition: none; } }
      `}</style>
      <div className="hw-reihe">

        {/* Hauptkarte: Satz, Knöpfe, Honig-Feld mit den Fundstücken */}
        <section className="hw">
          <div className="hw-text">
            {/* Beta-Feedback Tacocat 08.09.: der gute Zweck steht zuoberst, als eigene Zeile über dem Titel */}
            <Link href="/impact" className="hw-zweck cta-pill">
              <Flower2 size={14} color="#487848" /> 20% jeder Gebühr fliessen in den Bienenschutz
              <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
            <h1 className="hw-titel">Was du suchst, hat schon jemand.</h1>
            <p className="hw-unter">Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate.</p>
            <div className="hw-knoepfe">
              <Magnetic>
                <Link href="/listings/new" className="hw-knopf dunkel cta-pill"><Plus size={17} strokeWidth={2.4} /> Inserieren</Link>
              </Magnetic>
              <Magnetic>
                <Link href="/search" className="hw-knopf hell cta-pill">Stöbern <ArrowRight size={16} strokeWidth={2.4} /></Link>
              </Magnetic>
            </div>
          </div>
          <div className="hw-feld" aria-hidden="true" onMouseEnter={() => setHalt(true)} onMouseLeave={() => setHalt(false)} onClick={() => setVorn((v) => (v + 1) % FUNDE.length)}>
            <span className="hw-marke">Secondhand aus der Schweiz</span>
            {FUNDE.map((src, i) => (
              <div key={src} className="hw-fund" style={PLATZ[(i - vorn + FUNDE.length) % FUNDE.length]}>
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </section>

        {/* Beta-Karte: dunkler Gegenpol mit Honig-Knopf */}
        <section className="hw-beta beta-card-full">
          <div className="hw-beta-marke"><span className="hw-punkt" /> Geschlossene Beta</div>
          <h2 className="hw-beta-titel">Willkommen, Beta-Crew.</h2>
          <p className="hw-beta-text">Du gehörst zu den Ersten. Teste kaufen, verkaufen und mieten, und melde alles, was klemmt.</p>
          <Link href="/beta" className="hw-beta-knopf cta-pill"><MessageSquareHeart size={15} /> So testest du mit</Link>
        </section>

        {/* Handy: schmale Beta-Leiste statt der grossen Karte (Umschaltung über beta-mini in globals.css) */}
        <Link href="/beta" className="hw-mini beta-mini">
          <span className="hw-punkt" />
          Beta: So testest du mit
          <ArrowRight size={15} style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </Link>

      </div>
    </div>
  )
}
