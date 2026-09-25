'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { supabase } from '@/lib/supabase/supabase'
import { ArrowRight, Plus, MessageSquareHeart, Flower2 } from 'lucide-react'

// Hero ganz neu (Denis 25.09.2026: Formatwechsel und Preisschild gefielen beide nicht, Service raus).
// Ein volles Honig-Band. Links der Satz, rechts eine Szene aus vier Dingen, die frei schweben: sie kommen gestaffelt
// ins Bild, wippen leise, weichen der Maus aus (Tiefe je Objekt) und tragen je ein Schild mit dem Format. Das Schild
// ist ein Link auf die Suche nach genau diesem Format, so hat die Szene einen Zweck und ist nicht nur Deko.
// Die Dateinamen der Bilder täuschen: gameboy.png zeigt einen Roboter, vinyl.png den Game Boy.
// Bei reduzierter Bewegung steht alles still. Im style-Block stehen keine Kind-Selektoren und keine Anführungszeichen.

const DINGE = [
  { bild: '/images/hero/camera.png', format: 'Festpreis', preis: 'CHF 240', typ: 'sell', links: '0%', oben: '6%', breite: '46%', tiefe: 10, dreh: -5, takt: '7s', warte: '.05s' },
  { bild: '/images/hero/gameboy.png', format: 'Auktion', preis: 'ab CHF 1', typ: 'auction', links: '60%', oben: '0%', breite: '32%', tiefe: 22, dreh: 8, takt: '6s', warte: '.2s' },
  { bild: '/images/hero/boombox.png', format: 'Miete', preis: 'CHF 12 pro Tag', typ: 'rent', links: '52%', oben: '44%', breite: '46%', tiefe: 16, dreh: 4, takt: '8s', warte: '.35s' },
  { bild: '/images/hero/vinyl.png', format: 'Gratis', preis: 'abholen', typ: 'free', links: '6%', oben: '68%', breite: '26%', tiefe: 28, dreh: -9, takt: '6.5s', warte: '.5s' },
]

export function Hero() {
  const band = useRef<HTMLElement>(null)
  const [online, setOnline] = useState(0)
  useEffect(() => {
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .then(({ count }) => { if (count && count > 0) setOnline(count) })
  }, [])

  // Die Maus verschiebt die Szene: jedes Ding weicht nach seiner Tiefe aus, nahe Dinge stärker als ferne.
  useEffect(() => {
    const el = band.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover)').matches) return
    let raf = 0
    const bewegen = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const mx = ((e.clientX - r.left) / r.width - .5) * 2
      const my = ((e.clientY - r.top) / r.height - .5) * 2
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { el.style.setProperty('--mx', String(mx)); el.style.setProperty('--my', String(my)) })
    }
    const raus = () => { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0') }
    el.addEventListener('mousemove', bewegen)
    el.addEventListener('mouseleave', raus)
    return () => { el.removeEventListener('mousemove', bewegen); el.removeEventListener('mouseleave', raus); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section ref={band} className="hb" style={{ ['--mx' as any]: 0, ['--my' as any]: 0 }}>
      <style>{`
        .hb { position: relative; overflow: hidden; background: linear-gradient(160deg, #F8CB52 0%, #F4C03F 48%, #EAB32B 100%); border-bottom: 1px solid #E5E8EC; }
        /* Ein weiches Licht hinter der Szene, damit die Fläche nicht platt wirkt. Es wandert leicht mit der Maus. */
        .hb-licht { position: absolute; right: -8%; top: -30%; width: 62%; aspect-ratio: 1 / 1; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,0) 72%); transform: translate(calc(var(--mx) * -18px), calc(var(--my) * -12px)); transition: transform .9s ease-out; pointer-events: none; }
        .hb-reihe { position: relative; max-width: 1280px; margin: 0 auto; padding: clamp(32px, 4vw, 52px) 24px clamp(32px, 4vw, 48px); box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 56px); align-items: center; }
        .hb-text { display: flex; flex-direction: column; align-items: flex-start; }
        .hb-zweck { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 22px; padding: 6px 13px; border-radius: 999px; background: rgba(255,255,255,.72); border: 1px solid rgba(25,22,21,.1); color: #191615; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-decoration: none; animation: hbAuf .7s cubic-bezier(.2,.7,.2,1) both; }
        .hb-titel { margin: 0 0 20px; font-size: clamp(36px, 4.6vw, 64px); font-weight: 800; letter-spacing: -.035em; line-height: 1.02; color: #191615; }
        .hb-titel .z1, .hb-titel .z2 { display: block; animation: hbAuf .8s cubic-bezier(.2,.7,.2,1) both; }
        .hb-titel .z2 { animation-delay: .12s; }
        .hb-marker { background: linear-gradient(transparent 64%, rgba(255,255,255,.85) 64%, rgba(255,255,255,.85) 94%, transparent 94%); padding: 0 .06em; margin: 0 -.06em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
        .hb-unter { margin: 0 0 30px; max-width: 26em; font-size: clamp(16px, 1.6vw, 19px); line-height: 1.5; font-weight: 500; color: #3F3A37; animation: hbAuf .8s cubic-bezier(.2,.7,.2,1) .22s both; }
        .hb-knoepfe { display: flex; gap: 10px; flex-wrap: wrap; animation: hbAuf .8s cubic-bezier(.2,.7,.2,1) .32s both; }
        .hb-knopf { display: inline-flex; align-items: center; gap: 8px; padding: 15px 26px; border-radius: 999px; font-size: 15.5px; font-weight: 800; text-decoration: none; }
        .hb-knopf.dunkel { background: #191615; color: #fff; }
        .hb-knopf.hell { background: #fff; color: #191615; }
        .hb-zeile { display: flex; align-items: center; gap: 8px 22px; flex-wrap: wrap; margin: 24px 0 0; font-size: 13px; font-weight: 600; color: #3F3A37; animation: hbAuf .8s cubic-bezier(.2,.7,.2,1) .42s both; }
        .hb-live { display: inline-flex; align-items: center; gap: 8px; }
        .hb-punkt { width: 8px; height: 8px; border-radius: 50%; background: #191615; flex-shrink: 0; animation: hbPuls 2.2s ease-out infinite; }
        .hb-betalink { display: inline-flex; align-items: center; gap: 6px; color: #3F3A37; text-decoration: underline; text-underline-offset: 3px; }
        @keyframes hbPuls { 0% { box-shadow: 0 0 0 0 rgba(25,22,21,.35); } 70%, 100% { box-shadow: 0 0 0 9px rgba(25,22,21,0); } }
        @keyframes hbAuf { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

        /* Die Szene: ein Feld mit festem Seitenverhältnis, die Dinge liegen in Prozent darin und skalieren mit. */
        .hb-szene { position: relative; width: 100%; aspect-ratio: 5 / 4.6; max-width: 560px; justify-self: end; }
        .hb-ding { position: absolute; transform: translate(calc(var(--mx) * var(--tiefe) * 1px), calc(var(--my) * var(--tiefe) * 1px)); transition: transform .7s cubic-bezier(.2,.7,.2,1); will-change: transform; }
        .hb-auf { animation: hbHer .9s cubic-bezier(.2,.7,.2,1) var(--warte) both; }
        @keyframes hbHer { from { opacity: 0; transform: translateY(40px) scale(.9); } to { opacity: 1; transform: none; } }
        .hb-schweb { animation: hbSchweb var(--takt) ease-in-out calc(var(--warte) + .9s) infinite alternate; transform: rotate(calc(var(--dreh) * 1deg)); }
        @keyframes hbSchweb { from { transform: rotate(calc(var(--dreh) * 1deg)) translateY(0); } to { transform: rotate(calc(var(--dreh) * 1deg)) translateY(-14px); } }
        .hb-bild { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: contain; filter: drop-shadow(0 26px 28px rgba(25,22,21,.24)); transition: transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease; }
        .hb-ding:hover .hb-bild { transform: scale(1.05) translateY(-4px); filter: drop-shadow(0 36px 34px rgba(25,22,21,.28)); }
        /* Das Schild: weiss, leicht gedreht, hängt unten am Ding. Ein Link auf die Suche nach diesem Format. */
        .hb-schild { position: absolute; left: 50%; bottom: -4%; transform: translateX(-50%) rotate(calc(var(--dreh) * -.5deg)); display: inline-flex; align-items: baseline; gap: 7px; padding: 8px 14px 9px; border-radius: 999px; background: #fff; color: #191615; box-shadow: 0 10px 24px rgba(25,22,21,.16); white-space: nowrap; text-decoration: none; font-size: 13px; font-weight: 800; transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease; }
        .hb-schild small { font-size: 12px; font-weight: 600; color: #5B626C; }
        .hb-ding:hover .hb-schild { transform: translateX(-50%) rotate(0) scale(1.06); box-shadow: 0 14px 28px rgba(25,22,21,.22); }
        .hb-schild:focus-visible { outline: 2px solid #191615; outline-offset: 3px; }

        @media (max-width: 900px) {
          .hb-reihe { grid-template-columns: 1fr; gap: 12px; padding-top: 28px; padding-bottom: 28px; }
          .hb-titel { font-size: clamp(36px, 10vw, 48px); }
          .hb-unter { margin-bottom: 24px; }
          .hb-szene { max-width: 420px; justify-self: center; margin-top: 18px; aspect-ratio: 5 / 4.2; }
          .hb-schild { padding: 6px 11px 7px; font-size: 12px; }
          .hb-schild small { font-size: 11px; }
          .hb-knopf { padding: 13px 18px; font-size: 14.5px; }
          .hb-licht { right: -30%; top: 30%; width: 90%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hb-titel span, .hb-zweck, .hb-unter, .hb-knoepfe, .hb-zeile, .hb-auf, .hb-schweb, .hb-punkt { animation: none; }
          .hb-ding, .hb-licht, .hb-bild, .hb-schild { transition: none; }
        }
      `}</style>
      <span className="hb-licht" aria-hidden="true" />
      <div className="hb-reihe">
        <div className="hb-text">
          <Link href="/impact" className="hb-zweck cta-pill">
            <Flower2 size={14} color="#487848" /> 20% jeder Gebühr fliessen in den Bienenschutz
            <ArrowRight size={13} strokeWidth={2.4} />
          </Link>
          <h1 className="hb-titel"><span className="z1">Was du suchst,</span><span className="z2"><span className="hb-marker">hat schon jemand.</span></span></h1>
          <p className="hb-unter">Kaufen, bieten, mieten oder gratis mitnehmen. Die Gebühr wählst du selbst, ab 3 Prozent. Ein Fünftel davon geht an die Bienen.</p>
          <div className="hb-knoepfe">
            <Magnetic>
              <Link href="/listings/new" className="hb-knopf dunkel cta-pill"><Plus size={17} strokeWidth={2.4} /> Inserieren</Link>
            </Magnetic>
            <Magnetic>
              <Link href="/search" className="hb-knopf hell cta-pill">Stöbern <ArrowRight size={16} strokeWidth={2.4} /></Link>
            </Magnetic>
          </div>
          <p className="hb-zeile">
            {online > 0 && <span className="hb-live"><span className="hb-punkt" /> {online.toLocaleString('de-CH')} Inserate gerade online</span>}
            <Link href="/beta" className="hb-betalink"><MessageSquareHeart size={14} /> Geschlossene Beta: so testest du mit</Link>
          </p>
        </div>

        <div className="hb-szene" role="group" aria-label="Vier Formate: Festpreis, Auktion, Miete, Gratis">
          {DINGE.map((d) => (
            <div key={d.format} className="hb-ding" style={{ left: d.links, top: d.oben, width: d.breite, ['--tiefe' as any]: d.tiefe, ['--dreh' as any]: d.dreh, ['--takt' as any]: d.takt, ['--warte' as any]: d.warte }}>
              <div className="hb-auf">
                <div className="hb-schweb">
                  <img className="hb-bild" src={d.bild} alt="" />
                  <Link href={`/search?type=${d.typ}`} className="hb-schild">{d.format} <small>{d.preis}</small></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
