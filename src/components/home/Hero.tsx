'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import BeeIcon from '@/components/shared/BeeIcon'

// ─── Slides ──────────────────────────────────────────────────
// mode: "product" = freigestelltes PNG + farbiger BG
// mode: "cover"   = Vollbild-Hintergrund
// mode: "gradient" = Nur Farbverlauf, kein Bild
const slides = [
  {
    title: 'Finde Schätze.',
    highlight: 'Verkaufe deine.',
    description: 'Der Schweizer Marktplatz für Secondhand. Fair, einfach und mit Haltung.',
    image: '/images/hero/camera.png',
    bg: '#662C91',
    mode: 'product' as const,
  },
  {
    title: 'Miete, was du',
    highlight: 'temporär brauchst.',
    description: 'Bohrmaschine, Kamera, Velo? Miete von Privat. Günstig und unkompliziert.',
    image: '/images/hero/gameboy.png',
    bg: '#7CA982',
    mode: 'product' as const,
  },
  {
    title: 'Nicht neu.',
    highlight: 'Nur interessanter.',
    description: 'Gebrauchte Dinge sind Legenden mit Geschichte. Gemeinsam geben wir ihnen ein zweites Leben.',
    image: '/images/hero/vinyl.png',
    bg: '#0075A2',
    mode: 'product' as const,
  },
]

const FONT = "'General Sans', 'Manrope', system-ui, sans-serif"
const BODY = "'Manrope', system-ui, sans-serif"

export function Hero() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
  }, [])

  const goTo = useCallback((i: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => { setCurrent(i); setTransitioning(false) }, 400)
  }, [transitioning])

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [current, goTo])

  const s = slides[current]
  const isProduct = s.mode === 'product'
  const isCover = s.mode === 'cover'
  const isGradient = s.mode === 'gradient'

  return (
    <section className="hero-section" style={{
      position: 'relative', width: '100%', minHeight: 520, overflow: 'hidden',
      background: s.bg || '#191615',
    }}>
      {/* Cover mode: full background image */}
      {isCover && s.image && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'opacity 0.5s ease',
            opacity: transitioning ? 0 : 1,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)',
          }} />
        </>
      )}

      {/* Gradient mode: color gradient only */}
      {isGradient && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${s.bg || '#191615'} 0%, ${s.bg || '#191615'}dd 100%)`,
        }} />
      )}

      {/* Content */}
      <div className="hero-content" style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1280, margin: '0 auto', padding: '80px 32px 60px',
        display: 'flex', alignItems: isProduct ? 'center' : 'flex-start',
        justifyContent: 'space-between', gap: 40,
        minHeight: 520,
      }}>
        {/* Text */}
        <div style={{
          flex: isProduct ? '0 1 540px' : '0 1 600px',
          transition: 'all 0.5s ease',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(10px)' : 'translateY(0)',
        }}>
          <span style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 6,
            background: 'rgba(244, 192, 63, 0.2)', backdropFilter: 'blur(8px)',
            color: '#F4C03F', fontSize: 13, fontWeight: 700, marginBottom: 20,
            letterSpacing: '0.03em', fontFamily: BODY,
          }}>
            Ab 3% Gebühr
          </span>

          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#fff', margin: '0 0 16px',
            fontFamily: FONT,
          }}>
            {s.title}<br />
            <span style={{ color: '#F4C03F' }}>{s.highlight}</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.6,
            color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', maxWidth: 480,
            fontFamily: BODY,
          }}>
            {s.description}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: '#F4C03F', color: '#1a1a1a',
              fontWeight: 700, fontSize: 16, borderRadius: 8, textDecoration: 'none',
              fontFamily: BODY, transition: 'all 0.15s',
            }}>
              <Search size={18} /> Jetzt entdecken
            </Link>
            <Link href="/how-it-works" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.25)',
              color: '#fff', fontWeight: 600, fontSize: 16, borderRadius: 8,
              textDecoration: 'none', fontFamily: BODY, transition: 'all 0.15s',
            }}>
              So funktionierts <ArrowRight size={16} />
            </Link>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 10, marginTop: 48 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i === current ? 32 : 10, height: 10, borderRadius: 5,
                background: i === current ? '#F4C03F' : 'rgba(255,255,255,0.35)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
              }} />
            ))}
          </div>
        </div>

        {/* Product image (only in product mode) */}
        {isProduct && s.image && (
          <div style={{
            flex: '0 1 480px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.5s ease',
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'scale(0.95) translateX(20px)' : 'scale(1) translateX(0)',
          }}>
            <img
              src={s.image}
              alt=""
              style={{
                maxWidth: '100%', maxHeight: 420, objectFit: 'contain',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
              }}
            />
          </div>
        )}
      </div>

    </section>
  )
}
