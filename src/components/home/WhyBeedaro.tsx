'use client'
import { Percent, SlidersHorizontal, TreePine, ShieldCheck } from 'lucide-react'

// Akzente bewusst nur aus der Markenpalette (Honey / Petrol / Moss / Ink) —
// keine Fremdfarben, damit das Katalog-System diszipliniert bleibt.
const usps = [
  {
    icon: Percent,
    title: 'Ab 3% Gebühr',
    description: 'Die tiefsten Plattformgebühren der Schweiz. Kein Abo, keine versteckten Kosten.',
    accent: '#C99A1E', tint: '#FBF1D2',
  },
  {
    icon: SlidersHorizontal,
    title: 'Du bestimmst',
    description: 'Wähle deinen Beitrag selbst: von 3% bis 10%. Je mehr du gibst, desto mehr fliesst in die Natur.',
    accent: '#0B5E5C', tint: '#DCEFEE',
  },
  {
    icon: TreePine,
    title: 'Für die Natur',
    description: 'Ein Teil jedes Verkaufs unterstützt direkt Schweizer Bienen- und Naturschutzprojekte.',
    accent: '#5B8C5A', tint: '#E7EFE6',
  },
  {
    icon: ShieldCheck,
    title: 'Sicher & Lokal',
    description: 'Schweizer Plattform, Schweizer Daten. Sichere Kommunikation direkt über BEEDARO.',
    accent: '#14110D', tint: '#ECE3D2',
  },
]

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const MONO = "'Space Mono', ui-monospace, monospace"
const INK = '#14110D'
const PETROL = '#0B5E5C'

export function WhyBeedaro() {
  return (
    <section style={{ padding: '72px 0 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: PETROL, marginBottom: 14 }}>
            Warum wir
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px', fontFamily: HEAD, color: INK, lineHeight: 1.05 }}>
            Fair handeln, Natur schützen
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(20,17,13,0.6)', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Mit jeder Transaktion. Kein Werbeversprechen, sondern ins Modell eingebaut.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {usps.map((usp, i) => {
            const Icon = usp.icon
            return (
              <div
                key={i}
                style={{
                  background: '#fff', borderRadius: 12, border: `1px solid ${INK}`,
                  padding: '28px 22px', transition: 'all 0.18s ease', cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = usp.accent
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = `0 10px 26px ${usp.accent}1f`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = INK
                  el.style.transform = 'none'
                  el.style.boxShadow = 'none'
                }}
              >
                {/* Icon-Tafel */}
                <div style={{
                  width: 52, height: 52, borderRadius: 10, background: usp.tint, border: `1px solid ${INK}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: usp.accent, marginBottom: 18,
                }}>
                  <Icon size={24} strokeWidth={1.9} />
                </div>

                {/* Text */}
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', fontFamily: HEAD, letterSpacing: '-0.01em', color: INK }}>
                  {usp.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(20,17,13,0.6)', margin: 0 }}>
                  {usp.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
