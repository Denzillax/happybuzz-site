'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { supabase } from '@/lib/supabase/supabase'
import { ArrowRight, Plus, MessageSquareHeart, Flower2, Wrench } from 'lucide-react'

// Hero über die ganze Breite: links das Honig-Feld bis an den Bildschirmrand, rechts der Satz (Denis 21.09.2026).
// Dritte Fassung am Abend (Denis: der Hero ist langweilig). Der Hero zeigt jetzt das, was BEEDARO als einziger kann:
// fünf Formate. Der Satz unten nennt die fünf Verben, und genau EINES leuchtet auf, während links die passende
// Format-Karte vorne liegt. Der Stapel blättert von allein weiter, hält beim Überfahren an und steht still, wenn
// jemand weniger Bewegung wünscht. Die fünfte Karte hat bewusst kein Foto: ein Service ist kein Ding.
// Im style-Block stehen bewusst keine Kind-Selektoren und keine Anführungszeichen (Hydration).
const FORMATE = [
  { verb: 'Kaufen', format: 'Festpreis', farbe: '#FFE2DE', bild: '/images/hero/camera.png' },
  { verb: 'bieten', format: 'Auktion', farbe: '#E3E3FF', bild: '/images/hero/gameboy.png' },
  { verb: 'mieten', format: 'Miete', farbe: '#D3F0FF', bild: '/images/hero/boombox.png' },
  { verb: 'buchen', format: 'Service', farbe: '#FFDFF9', bild: '' },
  { verb: 'verschenken', format: 'Gratis', farbe: '#FEE8B0', bild: '/images/hero/vinyl.png' },
]

// Platz 0 liegt vorn, 1 und 2 schauen dahinter hervor, 3 wartet unsichtbar dahinter, 4 ist gerade nach links weggewischt.
const PLATZ = [
  { transform: 'translate(-50%, -50%) rotate(-4deg) scale(1)', opacity: 1, zIndex: 5 },
  { transform: 'translate(-20%, -56%) rotate(9deg) scale(.86)', opacity: 1, zIndex: 4 },
  { transform: 'translate(2%, -60%) rotate(16deg) scale(.72)', opacity: .92, zIndex: 3, transition: 'opacity .45s ease .3s' },
  { transform: 'translate(2%, -60%) rotate(16deg) scale(.72)', opacity: 0, zIndex: 2 },
  { transform: 'translate(-175%, -46%) rotate(-24deg) scale(1)', opacity: 0, zIndex: 6 },
]

export function Hero() {
  const [vorn, setVorn] = useState(0)
  const [halt, setHalt] = useState(false)
  // Lebenszeichen: wie viele Inserate gerade online sind (echte Zahl, gleiche Bedingung wie die Inseratlisten). Ohne Zahl bleibt die Zeile weg.
  const [online, setOnline] = useState(0)
  useEffect(() => {
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .then(({ count }) => { if (count && count > 0) setOnline(count) })
  }, [])
  useEffect(() => {
    if (halt || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setVorn((v) => (v + 1) % FORMATE.length), 3000)
    return () => clearInterval(t)
  }, [halt])
  const weiter = () => setVorn((v) => (v + 1) % FORMATE.length)
  return (
    <div className="hw-band">
      <style>{`
                .hw-band { position: relative; --hw-feld: 500px; --hw-schraeg: 56px; --hw-kante: calc(max(24px, 50% - 616px) + var(--hw-feld)); background: #fff; border-bottom: 1px solid #E5E8EC; }
        /* Die Honigfläche ist eine eigene Ebene, damit ihre rechte Kante eine Form sein kann und keine gerade Linie:
           sie läuft schräg und öffnet sich nach unten zu den Knöpfen hin. Der leichte Verlauf gibt ihr Tiefe. */
        .hw-honig { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--hw-kante) + var(--hw-schraeg)); background: linear-gradient(160deg, #F7C94F 0%, #F4C03F 46%, #E9B22B 100%); clip-path: polygon(0 0, calc(100% - var(--hw-schraeg)) 0, 100% 100%, 0 100%); pointer-events: none; }
        .hw-reihe { max-width: 1280px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; display: flex; align-items: stretch; min-height: 440px; }
        .hw { flex: 1 1 0; min-width: 0; display: flex; align-items: stretch; }
        .hw-text { flex: 1 1 340px; min-width: 0; padding: clamp(30px, 4vw, 56px) 0 clamp(30px, 4vw, 56px) clamp(74px, 6vw, 100px); display: flex; flex-direction: column; justify-content: center; }
        .hw-zweck { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; margin-bottom: 16px; padding: 6px 13px; border-radius: 999px; background: #EEF3EC; border: 1px solid #D5E2D2; color: #2F5A2F; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-decoration: none; }
        .hw-titel { margin: 0 0 16px; font-size: clamp(30px, 4.4vw, 60px); font-weight: 800; letter-spacing: -.03em; line-height: 1.05; color: #191615; }
        .hw-marker { background: linear-gradient(transparent 62%, #F4C03F 62%, #F4C03F 92%, transparent 92%); padding: 0 .08em; margin: 0 -.08em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
        /* Die fünf Verben: das gerade gezeigte Format leuchtet auf, die anderen bleiben leise. Das ist der Kern des Heros. */
        .hw-verben { margin: 0 0 26px; max-width: 30em; font-size: clamp(16px, 1.8vw, 21px); line-height: 1.45; font-weight: 600; color: #737A82; letter-spacing: -.01em; }
        .hw-verb { transition: color .35s ease; }
        .hw-verb.an { color: #191615; background: linear-gradient(transparent 84%, #F4C03F 84%, #F4C03F 96%, transparent 96%); }
        .hw-zeile { display: flex; align-items: center; gap: 8px 22px; flex-wrap: wrap; margin: 22px 0 0; font-size: 13px; font-weight: 600; color: #5B626C; }
        .hw-live { display: inline-flex; align-items: center; gap: 8px; }
        .hw-betalink { display: inline-flex; align-items: center; gap: 6px; color: #5B626C; text-decoration: underline; text-underline-offset: 3px; }
        .hw-live-punkt { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #50804F; flex-shrink: 0; animation: hwPuls 2.2s ease-out infinite; }
        @keyframes hwPuls { 0% { box-shadow: 0 0 0 0 rgba(80,128,79,.5); } 70%, 100% { box-shadow: 0 0 0 9px rgba(80,128,79,0); } }
        .hw-knoepfe { display: flex; gap: 10px; flex-wrap: wrap; }
        .hw-knopf { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 999px; font-size: 15px; font-weight: 800; text-decoration: none; }
        .hw-knopf.dunkel { background: #191615; color: #fff; }
        .hw-knopf.hell { background: #fff; color: #191615; border: 1px solid #D5D9DF; }
        .hw-feld { position: relative; order: -1; overflow: hidden; cursor: pointer; flex: 0 0 var(--hw-feld); min-height: 300px; }
        /* Hinter dem Stapel leuchtet die Farbe des gerade gezeigten Formats durch. Sie wandert mit, die Fläche bleibt Honig. */
        .hw-glanz { position: absolute; left: 42%; top: 54%; width: 150%; height: 150%; transform: translate(-50%, -50%); background-color: var(--akzent, #FFE2DE); opacity: .5; mix-blend-mode: soft-light; transition: background-color .7s ease; -webkit-mask-image: radial-gradient(closest-side, #000 10%, transparent 72%); mask-image: radial-gradient(closest-side, #000 10%, transparent 72%); pointer-events: none; }
        .hw-fund { position: absolute; left: 40%; top: 54%; width: 56%; max-width: 270px; padding: 14px; text-align: center; background: #fff; border-radius: 22px; box-shadow: 0 16px 32px rgba(25,22,21,.2); transition: transform .6s cubic-bezier(.3,.7,.2,1), opacity .45s ease; will-change: transform; }
        .hw-fund img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: contain; }
        .hw-format { display: inline-block; margin-bottom: 10px; padding: 5px 12px 6px; border-radius: 999px; border: 1px solid rgba(25,22,21,.14); font-size: 12.5px; font-weight: 800; color: #191615; text-align: center; }
        /* Service hat kein Foto: ein Service ist kein Ding, sondern Zeit. Darum Werkzeug statt Produktbild. */
        .hw-service { display: flex; align-items: center; justify-content: center; aspect-ratio: 1 / 1; border-radius: 14px; color: #191615; }
        @media (max-width: 1100px) { .hw-band { --hw-feld: 380px; } }
        @media (max-width: 860px) {
          .hw-honig { display: none; }
          .hw-reihe { flex-direction: column; gap: 14px; min-height: 0; }
          .hw { flex-direction: column; }
          .hw-text { padding: 26px 0 24px; }
          .hw-verben { margin-bottom: 22px; }
          .hw-feld { order: 0; flex: 0 0 auto; min-height: 0; height: 260px; margin: 0 -24px; background: #F4C03F; }
          .hw-fund { width: 42%; max-width: 160px; padding: 10px; border-radius: 18px; top: 58%; }
          .hw-format { margin-bottom: 7px; padding: 4px 9px 5px; font-size: 11px; }
          .hw-knopf { padding: 13px 17px; font-size: 14.5px; }
          .hw-knoepfe { gap: 8px; }
        }
        @media (prefers-reduced-motion: reduce) { .hw-fund { transition: none; } .hw-live-punkt { animation: none; } .hw-verb { transition: none; } }
      `}</style>
      <span className="hw-honig" aria-hidden="true" />
      <div className="hw-reihe">

        <section className="hw">
          <div className="hw-text">
            {/* Beta-Feedback Tacocat 08.09.: der gute Zweck steht zuoberst, als eigene Zeile über dem Titel */}
            <Link href="/impact" className="hw-zweck cta-pill">
              <Flower2 size={14} color="#487848" /> 20% jeder Gebühr fliessen in den Bienenschutz
              <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
            <h1 className="hw-titel">Was du suchst,<br /><span className="hw-marker">hat schon jemand.</span></h1>
            <p className="hw-verben">
              {FORMATE.map((f, i) => (
                <span key={f.verb}>
                  <span className={i === vorn ? 'hw-verb an' : 'hw-verb'}>{f.verb}</span>
                  {i < FORMATE.length - 2 ? ', ' : i === FORMATE.length - 2 ? ' oder ' : '.'}
                </span>
              ))}
            </p>
            <div className="hw-knoepfe">
              <Magnetic>
                <Link href="/listings/new" className="hw-knopf dunkel cta-pill"><Plus size={17} strokeWidth={2.4} /> Inserieren</Link>
              </Magnetic>
              <Magnetic>
                <Link href="/search" className="hw-knopf hell cta-pill">Stöbern <ArrowRight size={16} strokeWidth={2.4} /></Link>
              </Magnetic>
            </div>
            <p className="hw-zeile">
              {online > 0 && <span className="hw-live"><span className="hw-live-punkt" /> {online.toLocaleString('de-CH')} Inserate gerade online</span>}
              <Link href="/beta" className="hw-betalink"><MessageSquareHeart size={14} /> Geschlossene Beta: so testest du mit</Link>
            </p>
          </div>
          <div className="hw-feld" aria-hidden="true" style={{ ['--akzent' as any]: FORMATE[vorn].farbe }} onMouseEnter={() => setHalt(true)} onMouseLeave={() => setHalt(false)} onClick={weiter}>
            <span className="hw-glanz" />
            {FORMATE.map((f, i) => (
              <div key={f.format} className="hw-fund" style={PLATZ[(i - vorn + FORMATE.length) % FORMATE.length]}>
                <span className="hw-format" style={{ background: f.farbe }}>{f.format}</span>
                {f.bild ? <img src={f.bild} alt="" /> : <span className="hw-service" style={{ background: f.farbe }}><Wrench size={58} strokeWidth={1.5} /></span>}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
