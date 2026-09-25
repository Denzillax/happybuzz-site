'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Magnetic } from '@/components/shared/effects'
import { supabase } from '@/lib/supabase/supabase'
import { ArrowRight, Plus, MessageSquareHeart, Flower2, Wrench } from 'lucide-react'

// Zwei Heros zum Vergleichen, ohne Labor-Route (Denis 25.09.2026, der Kartenstapel war ihm zu wenig):
//   A "formate": der ganze Hero erzählt reihum ein Format. Satz, Farbe der Fläche und das Bild wechseln zusammen.
//   D "objekt":  ein einziges Ding steht still auf dem Honig, nur das Preisschild wechselt die Rolle.
// Standard ist A. D siehst du auf der Startseite mit ?hero=objekt. Beide blättern von allein, halten beim Überfahren
// an, springen per Klick weiter und stehen still, wenn jemand weniger Bewegung wünscht.
// Im style-Block stehen bewusst keine Kind-Selektoren und keine Anführungszeichen (Hydration).

const FORMATE = [
  { verb: 'Kaufen', format: 'Festpreis', farbe: '#FFE2DE', bild: '/images/hero/camera.png', satz: 'Kaufen, was jemand nicht mehr braucht.', schild: 'CHF 240', zusatz: 'Sofort kaufen' },
  { verb: 'Bieten', format: 'Auktion', farbe: '#E3E3FF', bild: '/images/hero/gameboy.png', satz: 'Bieten, bis es dir gehört.', schild: 'ab CHF 1', zusatz: 'Auktion, 7 Tage' },
  { verb: 'Mieten', format: 'Miete', farbe: '#D3F0FF', bild: '/images/hero/boombox.png', satz: 'Mieten, was du nur einmal brauchst.', schild: 'CHF 12', zusatz: 'pro Tag' },
  { verb: 'Buchen', format: 'Service', farbe: '#FFDFF9', bild: '', satz: 'Buchen, wer es besser kann.', schild: 'CHF 65', zusatz: 'Reparatur, pro Stunde' },
  { verb: 'Verschenken', format: 'Gratis', farbe: '#FEE8B0', bild: '/images/hero/vinyl.png', satz: 'Verschenken, was nur Platz braucht.', schild: 'CHF 0', zusatz: 'Gratis, abholen' },
]

const TAKT = 4200

// Gemeinsame Mechanik: welches Format ist dran, hält der Mauszeiger an, wie viele Inserate sind online.
function useHero() {
  const [vorn, setVorn] = useState(0)
  const [halt, setHalt] = useState(false)
  const [online, setOnline] = useState(0)
  useEffect(() => {
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .then(({ count }) => { if (count && count > 0) setOnline(count) })
  }, [])
  useEffect(() => {
    if (halt || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setVorn((v) => (v + 1) % FORMATE.length), TAKT)
    return () => clearInterval(t)
  }, [halt, vorn])
  const weiter = () => setVorn((v) => (v + 1) % FORMATE.length)
  return { vorn, setVorn, halt, setHalt, online, weiter }
}

// Gemeinsame Schicht: Zweck-Pille oben, Knöpfe und Live-Zeile unten. Dazwischen kommt, was die Variante erzählt.
function Rahmen({ online, children }: { online: number; children: React.ReactNode }) {
  return (
    <>
      <Link href="/impact" className="hw-zweck cta-pill">
        <Flower2 size={14} color="#487848" /> 20% jeder Gebühr fliessen in den Bienenschutz
        <ArrowRight size={13} strokeWidth={2.4} />
      </Link>
      {children}
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
    </>
  )
}

const STIL = `
  .hw-band { position: relative; --hw-feld: 500px; --hw-schraeg: 56px; --hw-kante: calc(max(24px, 50% - 616px) + var(--hw-feld)); background: #fff; border-bottom: 1px solid #E5E8EC; }
  .hw-flaeche { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--hw-kante) + var(--hw-schraeg)); clip-path: polygon(0 0, calc(100% - var(--hw-schraeg)) 0, 100% 100%, 0 100%); pointer-events: none; transition: background-color .8s ease; }
  .hw-flaeche.honig { background: linear-gradient(160deg, #F7C94F 0%, #F4C03F 46%, #E9B22B 100%); }
  .hw-reihe { max-width: 1280px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; display: flex; align-items: stretch; min-height: 460px; }
  .hw { flex: 1 1 0; min-width: 0; display: flex; align-items: stretch; }
  .hw-text { flex: 1 1 340px; min-width: 0; padding: clamp(30px, 4vw, 56px) 0 clamp(30px, 4vw, 56px) clamp(74px, 6vw, 100px); display: flex; flex-direction: column; justify-content: center; }
  .hw-zweck { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; margin-bottom: 18px; padding: 6px 13px; border-radius: 999px; background: #EEF3EC; border: 1px solid #D5E2D2; color: #2F5A2F; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-decoration: none; }
  .hw-titel { margin: 0 0 16px; font-size: clamp(30px, 4.2vw, 56px); font-weight: 800; letter-spacing: -.03em; line-height: 1.05; color: #191615; }
  .hw-marker { background: linear-gradient(transparent 62%, #F4C03F 62%, #F4C03F 92%, transparent 92%); padding: 0 .08em; margin: 0 -.08em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .hw-unter { margin: 0 0 26px; max-width: 30em; font-size: clamp(16px, 1.7vw, 19px); line-height: 1.5; font-weight: 500; color: #5B626C; }
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

  /* A: Format-Wechsel. Der Titel hat feste Höhe für zwei Zeilen, damit die Knöpfe nicht hüpfen. */
  .hw-a-titel { min-height: 2.1em; }
  .hw-a-titel span { display: block; animation: hwRein .55s cubic-bezier(.3,.7,.2,1) both; }
  @keyframes hwRein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .hw-reiter { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 26px; padding: 0; list-style: none; }
  .hw-reiter button { appearance: none; border: 1px solid #E5E8EC; background: #fff; color: #5B626C; padding: 7px 13px; border-radius: 999px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: background-color .25s ease, color .25s ease, border-color .25s ease; }
  .hw-reiter button.an { background: #191615; border-color: #191615; color: #fff; }
  .hw-bild { position: absolute; left: 40%; top: 52%; width: 62%; max-width: 330px; aspect-ratio: 1 / 1; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; transition: opacity .6s ease, transform .7s cubic-bezier(.3,.7,.2,1); will-change: opacity, transform; }
  .hw-bild img { display: block; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 22px 30px rgba(25,22,21,.22)); }
  .hw-bild.weg { opacity: 0; transform: translate(-50%, -50%) scale(.86) rotate(-6deg); pointer-events: none; }
  .hw-bild.da { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0); }
  .hw-bild-service { display: flex; align-items: center; justify-content: center; width: 72%; aspect-ratio: 1 / 1; border-radius: 32px; background: #fff; color: #191615; box-shadow: 0 22px 30px rgba(25,22,21,.18); }
  .hw-schild { position: absolute; left: 40%; bottom: 34px; transform: translateX(-50%); padding: 7px 14px 8px; border-radius: 999px; background: #191615; color: #fff; font-size: 13px; font-weight: 800; letter-spacing: .01em; white-space: nowrap; }

  /* D: ein Objekt, wechselndes Preisschild. Das Schild ploppt bei jedem Wechsel neu auf. */
  .hw-ding { position: absolute; left: 36%; top: 52%; width: 64%; max-width: 340px; aspect-ratio: 1 / 1; transform: translate(-50%, -50%); }
  .hw-ding img { display: block; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 22px 30px rgba(25,22,21,.22)); }
  .hw-preis { position: absolute; left: 58%; top: 60%; min-width: 150px; padding: 14px 16px 15px; border-radius: 18px; background: #fff; box-shadow: 0 16px 32px rgba(25,22,21,.2); transform: rotate(-6deg); transform-origin: 10% 90%; animation: hwPlopp .5s cubic-bezier(.3,.7,.2,1) both; }
  @keyframes hwPlopp { from { opacity: 0; transform: rotate(-14deg) scale(.7); } to { opacity: 1; transform: rotate(-6deg) scale(1); } }
  .hw-preis-format { display: inline-block; margin-bottom: 8px; padding: 4px 10px 5px; border-radius: 999px; border: 1px solid rgba(25,22,21,.14); font-size: 12px; font-weight: 800; color: #191615; }
  .hw-preis-zahl { display: block; font-size: 26px; font-weight: 800; letter-spacing: -.03em; line-height: 1; color: #191615; }
  .hw-preis-zusatz { display: block; margin-top: 5px; font-size: 12.5px; font-weight: 600; color: #5B626C; }
  .hw-d-verben { margin: 0 0 26px; max-width: 30em; font-size: clamp(16px, 1.8vw, 21px); line-height: 1.45; font-weight: 600; color: #737A82; letter-spacing: -.01em; }
  .hw-verb { transition: color .35s ease; }
  .hw-verb.an { color: #191615; background: linear-gradient(transparent 84%, #F4C03F 84%, #F4C03F 96%, transparent 96%); }

  @media (max-width: 1100px) { .hw-band { --hw-feld: 380px; } }
  @media (max-width: 860px) {
    .hw-flaeche { display: none; }
    .hw-reihe { flex-direction: column; gap: 14px; min-height: 0; }
    .hw { flex-direction: column; }
    .hw-text { padding: 26px 0 24px; }
    .hw-feld { order: 0; flex: 0 0 auto; min-height: 0; height: 260px; margin: 0 -24px; background: var(--hw-mobil, #F4C03F); transition: background-color .8s ease; }
    .hw-bild { left: 50%; width: 52%; max-width: 200px; }
    .hw-schild { left: 50%; bottom: 16px; }
    .hw-ding { left: 44%; width: 56%; max-width: 210px; }
    .hw-preis { left: 58%; top: 54%; min-width: 128px; padding: 11px 13px 12px; border-radius: 14px; }
    .hw-preis-zahl { font-size: 21px; }
    .hw-knopf { padding: 13px 17px; font-size: 14.5px; }
    .hw-knoepfe { gap: 8px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hw-live-punkt { animation: none; } .hw-verb { transition: none; }
    .hw-bild, .hw-flaeche, .hw-feld { transition: none; } .hw-a-titel span, .hw-preis { animation: none; }
  }
`

// A: Der Hero erzählt reihum ein Format. Satz, Farbe der Fläche und Bild wechseln zusammen, die Reiter springen.
function HeroFormate() {
  const { vorn, setVorn, setHalt, online, weiter } = useHero()
  const f = FORMATE[vorn]
  return (
    <div className="hw-band">
      <style>{STIL}</style>
      <span className="hw-flaeche" aria-hidden="true" style={{ backgroundColor: f.farbe }} />
      <div className="hw-reihe">
        <section className="hw">
          <div className="hw-text">
            <Rahmen online={online}>
              <h1 className="hw-titel hw-a-titel" aria-live="polite"><span key={f.format}>{f.satz}</span></h1>
              <p className="hw-unter">Festpreis, Auktion, Miete, Service oder Gratis. Ein Marktplatz, fünf Formate. Du entscheidest, wie.</p>
              <ul className="hw-reiter" aria-label="Format wählen">
                {FORMATE.map((x, i) => (
                  <li key={x.format}>
                    <button type="button" className={i === vorn ? 'an' : ''} aria-pressed={i === vorn} onClick={() => setVorn(i)} onFocus={() => setHalt(true)} onBlur={() => setHalt(false)}>{x.format}</button>
                  </li>
                ))}
              </ul>
            </Rahmen>
          </div>
          <div className="hw-feld" aria-hidden="true" style={{ ['--hw-mobil' as any]: f.farbe }} onMouseEnter={() => setHalt(true)} onMouseLeave={() => setHalt(false)} onClick={weiter}>
            {FORMATE.map((x, i) => (
              <div key={x.format} className={i === vorn ? 'hw-bild da' : 'hw-bild weg'}>
                {x.bild ? <img src={x.bild} alt="" /> : <span className="hw-bild-service"><Wrench size={96} strokeWidth={1.4} /></span>}
              </div>
            ))}
            <span className="hw-schild" key={f.format}>{f.verb}</span>
          </div>
        </section>
      </div>
    </div>
  )
}

// D: Eine Kamera, fünf Inserate. Das Ding bleibt, nur das Preisschild wechselt die Rolle.
function HeroObjekt() {
  const { vorn, setHalt, online, weiter } = useHero()
  const f = FORMATE[vorn]
  return (
    <div className="hw-band">
      <style>{STIL}</style>
      <span className="hw-flaeche honig" aria-hidden="true" />
      <div className="hw-reihe">
        <section className="hw">
          <div className="hw-text">
            <Rahmen online={online}>
              <h1 className="hw-titel">Eine Kamera.<br /><span className="hw-marker">Fünf Inserate.</span></h1>
              <p className="hw-d-verben" aria-live="polite">
                {FORMATE.map((x, i) => (
                  <span key={x.verb}>
                    <span className={i === vorn ? 'hw-verb an' : 'hw-verb'}>{i === 0 ? x.verb : x.verb.toLowerCase()}</span>
                    {i < FORMATE.length - 2 ? ', ' : i === FORMATE.length - 2 ? ' oder ' : '. Du entscheidest, wie.'}
                  </span>
                ))}
              </p>
            </Rahmen>
          </div>
          <div className="hw-feld" aria-hidden="true" onMouseEnter={() => setHalt(true)} onMouseLeave={() => setHalt(false)} onClick={weiter}>
            <div className="hw-ding"><img src="/images/hero/camera.png" alt="" /></div>
            <div className="hw-preis" key={f.format}>
              <span className="hw-preis-format" style={{ background: f.farbe }}>{f.format}</span>
              <span className="hw-preis-zahl">{f.schild}</span>
              <span className="hw-preis-zusatz">{f.zusatz}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export function Hero() {
  // Variante aus der Adresse lesen, ohne useSearchParams (das bräuchte eine Suspense-Grenze beim statischen Bauen).
  const [variante, setVariante] = useState<'formate' | 'objekt'>('formate')
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('hero')
    if (v === 'objekt') setVariante('objekt')
  }, [])
  return variante === 'objekt' ? <HeroObjekt /> : <HeroFormate />
}
