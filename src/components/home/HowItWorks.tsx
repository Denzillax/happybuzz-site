'use client'
import { Camera, Handshake, Leaf } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    title: 'Inserat erstellen',
    description: 'Fotos hochladen, Preis festlegen, Gebührenmodell wählen. In wenigen Minuten ist dein Artikel online.',
    step: '01',
  },
  {
    icon: Handshake,
    title: 'Kaufen oder bieten',
    description: 'Sofort kaufen zum Festpreis, auf Auktionen mitbieten oder Artikel mieten. Alles sicher über die Plattform.',
    step: '02',
  },
  {
    icon: Leaf,
    title: 'Gutes tun',
    description: 'Ein Teil deines Plattformbeitrags fliesst direkt in Schweizer Bienen- und Naturschutzprojekte.',
    step: '03',
  },
]

const FONT = "'General Sans', 'Manrope', system-ui, sans-serif"

export function HowItWorks() {
  return (
    <section style={{ padding: '72px 0', background: '#fff', borderTop: '1px solid #f0ede8', borderBottom: '1px solid #f0ede8' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 6, background: '#FDF6E3', color: '#D4A020', fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            In 3 Schritten
          </span>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.025em', margin: 0, fontFamily: FONT }}>
            So funktioniert <span style={{ color: '#F4C03F' }}>Beedaro</span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="steps-grid" style={{ display: 'grid', gap: 32 }}>
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} style={{ textAlign: 'center', padding: '0 12px' }}>
                {/* Step Number + Icon */}
                <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 24 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 16, background: '#FDF6E3',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A020',
                  }}>
                    <Icon size={32} strokeWidth={1.8} />
                  </div>
                  <span style={{
                    position: 'absolute', top: -8, right: -12,
                    width: 28, height: 28, borderRadius: '50%', background: '#F4C03F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#1a1a1a',
                  }}>
                    {s.step}
                  </span>
                </div>

                {/* Text */}
                <h3 style={{ fontSize: 20, fontWeight: 400, marginBottom: 10, fontFamily: FONT, letterSpacing: '-0.01em' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#666', margin: 0 }}>
                  {s.description}
                </p>

                {/* Connector line (between steps) */}
                {i < steps.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 36, right: -16,
                    width: 32, height: 2, background: '#e5e5e5',
                    display: 'none', // hidden for now, would need relative parent
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
