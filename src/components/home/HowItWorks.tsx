'use client'
import { Camera, Handshake, Leaf } from 'lucide-react'
import { UspGrid } from './WhyBeedaro'

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

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const MONO = "'Manrope', sans-serif"
const INK = '#14110D'
const SAND = '#F4F4F2'
const PAPER = '#FFFFFF'
const HONEY = '#F4C03F'
const PETROL = '#0B5E5C'

export function HowItWorks() {
  return (
    <section style={{ padding: '72px 0', background: PAPER, borderTop: "1px solid #E4E0D8", borderBottom: "1px solid #E4E0D8" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: PETROL, marginBottom: 16 }}>
            In 3 Schritten
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, fontFamily: HEAD, color: INK, lineHeight: 1.05, position: 'relative', zIndex: 0 }}>
            So funktioniert{' '}
            <span style={{ background: HONEY, color: INK, padding: '0 .1em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', position: 'relative', zIndex: -1 }}>Beedaro</span>
          </h2>
        </div>

        {/* Steps Grid — echte Sequenz, daher Mono-Schrittnummern */}
        <div className="steps-grid" style={{ display: 'grid', gap: 20 }}>
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} style={{
                background: '#fff', border: "1px solid #E4E0D8", borderRadius: 10,
                padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                {/* Schrittnummer + Icon-Tafel */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: MONO, fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 700, color: INK, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {s.step}
                  </span>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, background: SAND, border: "1px solid #E4E0D8",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: PETROL,
                  }}>
                    <Icon size={23} strokeWidth={1.8} />
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 600, margin: '0 0 7px', fontFamily: HEAD, letterSpacing: '-0.01em', color: INK }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'rgba(20,17,13,0.6)', margin: 0 }}>
                    {s.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* "Warum wir" fliesst direkt hier weiter: eine Sektion statt zwei */}
        <UspGrid />
      </div>
    </section>
  )
}
