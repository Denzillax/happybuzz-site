'use client'
import { Percent, SlidersHorizontal, TreePine, ShieldCheck } from 'lucide-react'

const usps = [
  {
    icon: Percent,
    title: 'Ab 3% Gebühr',
    description: 'Die tiefsten Plattformgebühren der Schweiz. Kein Abo, keine versteckten Kosten.',
    accent: '#F4C03F',
    accentBg: '#FDF6E3',
  },
  {
    icon: SlidersHorizontal,
    title: 'Du bestimmst',
    description: 'Wähle deinen Beitrag selbst: von 3% bis 10%. Je mehr du gibst, desto mehr fliesst in die Natur.',
    accent: '#4A90B8',
    accentBg: '#E4F0F8',
  },
  {
    icon: TreePine,
    title: 'Für die Natur',
    description: 'Ein Teil jedes Verkaufs unterstützt direkt Schweizer Bienen- und Naturschutzprojekte.',
    accent: '#3D8B3D',
    accentBg: '#E8F5E8',
  },
  {
    icon: ShieldCheck,
    title: 'Sicher & Lokal',
    description: 'Schweizer Plattform, Schweizer Daten. Sichere Kommunikation direkt über BEEDARO.',
    accent: '#7C5CBF',
    accentBg: '#F0EBF8',
  },
]

const FONT = "'General Sans', 'Manrope', system-ui, sans-serif"

export function WhyBeedaro() {
  return (
    <section style={{ padding: '72px 0 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 10px', fontFamily: FONT }}>
            Warum <span style={{ color: '#F4C03F' }}>Beedaro</span>?
          </h2>
          <p style={{ fontSize: 16, color: '#888', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Fair handeln, Natur schützen. Mit jeder Transaktion.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {usps.map((usp, i) => {
            const Icon = usp.icon
            return (
              <div
                key={i}
                style={{
                  background: '#fff', borderRadius: 10, border: '1px solid #e5e5e5',
                  padding: '32px 24px', transition: 'all 0.15s ease', cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = usp.accent
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = `0 8px 24px ${usp.accent}15`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#e5e5e5'
                  el.style.transform = 'none'
                  el.style.boxShadow = 'none'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 12, background: usp.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: usp.accent, marginBottom: 20,
                }}>
                  <Icon size={26} strokeWidth={1.8} />
                </div>

                {/* Text */}
                <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 8, fontFamily: FONT, letterSpacing: '-0.01em', color: '#1a1a1a' }}>
                  {usp.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666', margin: 0 }}>
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
