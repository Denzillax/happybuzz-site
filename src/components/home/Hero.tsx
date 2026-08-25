'use client'
import Link from 'next/link'
import { ArrowRight, Plus, MessageSquareHeart } from 'lucide-react'

// Klar-Look: schmales Willkommensband + separate Beta-Karte daneben.
// Gelb ist die CTA-Farbe, der Rest bleibt zurueckhaltend.
const DISPLAY = "'General Sans', 'Manrope', system-ui, sans-serif"
const INK = '#191615'
const HONEY = '#F4C03F'
const BAND = '#F6F4EF'
const BETA_BG = '#FBF0D2'

export function Hero() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '14px 0 6px' }}>

        {/* Hauptband: Slogan + CTAs + Karten-Collage */}
        <section style={{ flex: '2 1 460px', minWidth: 0, background: BAND, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: 'clamp(22px, 4vw, 40px) clamp(18px, 4vw, 44px)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, color: INK, margin: '0 0 10px' }}>
                Nicht neu. Nur interessanter.
              </h1>
              <p style={{ fontSize: 'clamp(14px, 1.6vw, 16px)', color: 'rgba(25,22,21,0.65)', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 540 }}>
                Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate, und 20% jeder Gebühr gehen an den Bienenschutz.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/listings/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: HONEY, color: INK, fontWeight: 700, fontSize: 14.5, padding: '11px 20px', borderRadius: 999, textDecoration: 'none' }}>
                  <Plus size={17} strokeWidth={2.4} /> Inserieren
                </Link>
                <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: INK, fontWeight: 700, fontSize: 14.5, padding: '11px 20px', borderRadius: 999, textDecoration: 'none' }}>
                  Stöbern <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
            {/* Drei Hero-Karten (aus dem frueheren Karussell), jetzt als ruhige Collage */}
            <div className="hero-bee-side" style={{ flex: '0 0 auto', position: 'relative', width: 300, height: 190, marginRight: 8 }}>
              {[
                { src: '/images/hero/camera.png', alt: 'Kamera, analog', rot: -7, x: 0, y: 18 },
                { src: '/images/hero/gameboy.png', alt: 'Spielkonsole', rot: 3, x: 96, y: 0 },
                { src: '/images/hero/vinyl.png', alt: 'Schallplatte', rot: 8, x: 190, y: 26 },
              ].map((k) => (
                <div key={k.src} style={{
                  position: 'absolute', left: k.x, top: k.y,
                  width: 110, padding: 8, background: '#fff', borderRadius: 12,
                  boxShadow: '0 4px 14px rgba(25,22,21,.12)',
                  transform: `rotate(${k.rot}deg)`,
                }}>
                  <img src={k.src} alt={k.alt} style={{ width: '100%', height: 92, objectFit: 'contain', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Separate Beta-Karte: Willkommen + Feedback-CTA */}
        <section className="beta-card-full" style={{ flex: '1 1 260px', minWidth: 240, maxWidth: 420, background: BETA_BG, borderRadius: 14, padding: 'clamp(20px, 3vw, 28px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxSizing: 'border-box' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: INK, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: HONEY }} />
            Geschlossene Beta
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(19px, 2.2vw, 24px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15, color: INK, margin: '0 0 8px' }}>
            Willkommen, Beta-Crew.
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(25,22,21,0.68)', lineHeight: 1.55, margin: '0 0 16px' }}>
            Du gehörst zu den Ersten. Teste kaufen, verkaufen und mieten, und melde alles, was klemmt.
          </p>
          <Link href="/beta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: INK, color: '#fff', fontWeight: 700, fontSize: 13.5, padding: '10px 18px', borderRadius: 999, textDecoration: 'none', marginTop: 'auto' }}>
            <MessageSquareHeart size={15} /> So testest du mit
          </Link>
        </section>

        {/* Mobil: kompakte Beta-Leiste statt grosser Karte */}
        <Link href="/beta" className="beta-mini" style={{ display: 'none', alignItems: 'center', gap: 9, background: BETA_BG, borderRadius: 999, padding: '11px 16px', textDecoration: 'none', color: INK, fontWeight: 700, fontSize: 13.5, flex: '1 1 100%' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: HONEY, flexShrink: 0 }} />
          Beta: So testest du mit
          <ArrowRight size={15} style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </Link>

      </div>
    </div>
  )
}
