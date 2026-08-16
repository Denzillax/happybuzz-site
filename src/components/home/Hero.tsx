'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import BeeIcon from '@/components/shared/BeeIcon'

// ─── Katalog-Slides: jede Slide = eine Katalog-Sektion ──
// Headline-Regel: title + highlight sind IMMER genau je eine Zeile (nowrap im
// Render). Beide Teile deshalb kurz halten — max ~18 Zeichen, sonst bricht
// die Zwei-Zeilen-Form auf schmalen Screens.
const slides = [
  {
    kicker: 'GESCHLOSSENE BETA',
    title: 'Willkommen,',
    highlight: 'Beta-Crew.',
    description: 'Du gehörst zu den Ersten. Teste Kaufen, Verkaufen und Mieten, hak die Checkliste ab und melde alles, was klemmt, über den Feedback-Knopf.',
    image: '/images/hero/boombox.png',
    cat: '0001', cond: 'BETA', specimen: 'Boombox',
    beta: true,
  },
  {
    kicker: 'VERKAUFEN',
    title: 'Finde Schätze.',
    highlight: 'Verkaufe deine.',
    description: 'Der Schweizer Marktplatz für Secondhand. Fair, einfach und mit Haltung.',
    image: '/images/hero/camera.png',
    cat: '0291', cond: 'WIE NEU', specimen: 'Kamera, analog',
  },
  {
    kicker: 'MIETEN',
    title: 'Heute geliehen,',
    highlight: 'morgen zurück.',
    description: 'Bohrmaschine, Kamera, Velo? Miete von Privat. Günstig und unkompliziert.',
    image: '/images/hero/gameboy.png',
    cat: '0042', cond: 'GUT', specimen: 'Spielkonsole',
  },
  {
    kicker: 'ZWEITES LEBEN',
    title: 'Nicht neu.',
    highlight: 'Nur interessanter.',
    description: 'Gebrauchte Dinge haben Geschichte. Hier bekommen sie ihr zweites Leben.',
    image: '/images/hero/vinyl.png',
    cat: '0173', cond: 'VINTAGE', specimen: 'Schallplatte',
  },
]

const DISPLAY = "'General Sans', 'Manrope', system-ui, sans-serif"
const BODY = "'Manrope', system-ui, sans-serif"
const MONO = "'Space Mono', ui-monospace, monospace"
const INK = '#14110D'
const SAND = '#ECE3D2'
const PAPER = '#FBF8F2'
const HONEY = '#F4C03F'
const PETROL = '#0B5E5C'

export function Hero() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((i: number) => {
    if (transitioning || i === current) return
    setTransitioning(true)
    setTimeout(() => { setCurrent(i); setTransitioning(false) }, 350)
  }, [transitioning, current])

  useEffect(() => {
    const t = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => { setCurrent(c => (c + 1) % slides.length); setTransitioning(false) }, 350)
    }, 6500)
    return () => clearInterval(t)
  }, [])

  const s = slides[current]
  const fade = { transition: 'opacity .35s ease, transform .35s ease', opacity: transitioning ? 0 : 1 }

  return (
    <section className="hero-section" style={{
      position: 'relative', width: '100%', minHeight: 560, overflow: 'hidden',
      background: SAND, color: INK,
      backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: '22px 22px',
    }}>
      <div className="hero-content" style={{
        position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto',
        padding: '72px 32px 60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 48, minHeight: 560,
      }}>
        {/* ── Text ── */}
        <div style={{ flex: '0 1 580px', ...fade, transform: transitioning ? 'translateY(8px)' : 'translateY(0)' }}>
          <div style={{
            fontFamily: MONO, fontSize: 12, letterSpacing: '.16em', color: PETROL,
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
          }}>
            <span style={{ fontWeight: 700 }}>№ 00{current + 1}</span>
            <span style={{ width: 22, height: 1, background: INK, opacity: .35 }} />
            <span>{s.kicker}</span>
          </div>

          {/* Immer exakt zwei Zeilen: nowrap je Teil, min-Schriftgroesse so
              gewaehlt, dass die laengste Zeile (18 Zeichen) auf 375px passt. */}
          {/* key erzwingt Remount pro Slide, damit der Highlight-Wisch
              bei jedem Wechsel neu abspielt */}
          <h1 key={current} style={{
            fontFamily: DISPLAY, fontSize: 'clamp(32px, 5.6vw, 72px)', fontWeight: 600,
            lineHeight: 1.08, letterSpacing: '-0.02em', color: INK, margin: '0 0 20px',
          }}>
            <span style={{ whiteSpace: 'nowrap' }}>{s.title}</span><br />
            <span className='hero-hl-sweep' style={{ whiteSpace: 'nowrap', background: HONEY, color: INK, padding: '0 .08em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', position: 'relative', zIndex: -1 }}>{s.highlight}</span>
          </h1>

          <p style={{
            fontFamily: BODY, fontSize: 'clamp(15px, 1.6vw, 18px)', lineHeight: 1.6,
            color: 'rgba(20,17,13,0.72)', margin: '0 0 32px', maxWidth: 460,
          }}>
            {s.description}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {s.beta ? (
              <>
                {/* Beta-Slide: Checkliste erklaert den Testern, was zu tun ist;
                    Bewerben fuehrt Interessierte zum Kontaktformular. */}
                <Link href="/beta" className="bd-btn" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px',
                  background: HONEY, color: INK, fontWeight: 700, fontSize: 15.5, borderRadius: 0,
                  textDecoration: 'none', fontFamily: BODY, border: `1.5px solid ${INK}`,
                  boxShadow: `3px 3px 0 ${INK}`,
                }}>
                  Zur Test-Checkliste <ArrowRight size={16} />
                </Link>
                <Link href="/bewerben" className="bd-btn" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px',
                  background: 'transparent', border: `1.5px solid ${INK}`,
                  color: INK, fontWeight: 600, fontSize: 15.5, borderRadius: 0,
                  textDecoration: 'none', fontFamily: BODY,
                }}>
                  Als Tester bewerben
                </Link>
              </>
            ) : (
              <>
                <Link href="/listings/new" className="bd-btn" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px',
                  background: INK, color: PAPER, fontWeight: 700, fontSize: 15.5, borderRadius: 0,
                  textDecoration: 'none', fontFamily: BODY, border: `1.5px solid ${INK}`,
                }}>
                  <Plus size={18} /> Gratis inserieren
                </Link>
                <Link href="/how-it-works" className="bd-btn" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px',
                  background: 'transparent', border: `1.5px solid ${INK}`,
                  color: INK, fontWeight: 600, fontSize: 15.5, borderRadius: 0,
                  textDecoration: 'none', fontFamily: BODY,
                }}>
                  So funktioniert&apos;s <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 44 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {slides.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} style={{
                  width: i === current ? 30 : 9, height: 9, borderRadius: 0,
                  background: i === current ? INK : 'rgba(20,17,13,0.22)',
                  border: 'none', cursor: 'pointer', transition: 'all .3s ease', padding: 0,
                }} />
              ))}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '.12em', color: 'rgba(20,17,13,0.5)' }}>AB 3% GEBÜHR · 20% FÜR BIENEN</span>
          </div>
        </div>

        {/* ── Exponat-Karte (Specimen) ── */}
        <div style={{ flex: '0 1 440px', position: 'relative', display: 'flex', justifyContent: 'center', ...fade, transform: transitioning ? 'scale(.97)' : 'scale(1)' }}>
          {/* Offset-Karte dahinter (Archiv-Stapel) */}
          <div aria-hidden style={{ position: 'absolute', inset: '18px 28px', border: `1.5px solid ${INK}`, borderRadius: 0, transform: 'rotate(4deg)', opacity: .28 }} />
          <div className='hero-beta-float' style={{
            position: 'relative', width: '100%', maxWidth: 400, background: PAPER,
            border: `1.5px solid ${INK}`, borderRadius: 0, transform: 'rotate(-2deg)',
            padding: 18, boxShadow: '0 24px 48px rgba(20,17,13,0.14)',
          }}>
            {/* Katalog-Kopf */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11.5, letterSpacing: '.08em', color: INK, borderBottom: `1px solid ${INK}22`, paddingBottom: 10, marginBottom: 12 }}>
              <span style={{ fontWeight: 700 }}>№ {s.cat}</span>
              <span style={{ background: PETROL, color: PAPER, padding: '3px 8px', borderRadius: 0, fontWeight: 700, fontSize: 10.5 }}>{s.cond}</span>
            </div>
            {/* Exponat */}
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: SAND, borderRadius: 0 }}>
              <img src={s.image} alt="" style={{ maxWidth: '86%', maxHeight: 260, objectFit: 'contain' }} />
            </div>
            {/* Fuss: Echtheit + Wachssiegel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.1em', color: 'rgba(20,17,13,0.5)' }}>EXPONAT № {s.cat}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: INK, lineHeight: 1.1 }}>Geprüft &amp; katalogisiert</div>
              </div>
              <span className='hero-beta-seal' style={{ width: 38, height: 38, borderRadius: '50%', background: HONEY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${INK}` }} title={s.beta ? 'Beta-Crew' : 'Geprüft von BEEDARO'}>
                <BeeIcon size={19} color={INK} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
