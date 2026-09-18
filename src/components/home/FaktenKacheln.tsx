'use client'
import Link from 'next/link'
import { BadgePercent, Wallet, Layers } from 'lucide-react'
import BeeIcon from '@/components/shared/BeeIcon'
import { FEE_FREE_BELOW, BEE_IMPACT_RATE } from '@/lib/constants'

// Vier Fakten direkt unter dem Hero (Denis 19.09.2026, Anregung marko.ch):
// Was BEEDARO ausmacht, in einer Zeile statt weiter unten im Erklärteil.
// Flächig in Sand und Honig, kein Verlauf. Zahlen kommen aus constants.js.
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const INK = '#191615'

const FAKTEN = [
  { key: 'gratis', titel: `Unter CHF ${FEE_FREE_BELOW} gebührenfrei`, text: 'Kleine Verkäufe kosten dich nichts.', href: '/search?max=' + FEE_FREE_BELOW, honig: true },
  { key: 'bienen', titel: `${Math.round(BEE_IMPACT_RATE * 100)} % der Gebühr für Bienen`, text: 'Jeder Verkauf hilft dem Bienenschutz.', href: '/impact' },
  { key: 'zahlen', titel: 'TWINT, Bank oder bar', text: 'Du zahlst so, wie es für dich passt.', href: '/help' },
  { key: 'formate', titel: 'Kaufen, bieten, mieten, schenken', text: 'Fünf Formate auf einer Plattform.', href: '/search' },
]

function Symbol({ k }: { k: string }) {
  if (k === 'gratis') return <BadgePercent size={18} />
  if (k === 'bienen') return <BeeIcon size={18} />
  if (k === 'zahlen') return <Wallet size={18} />
  return <Layers size={18} />
}

export function FaktenKacheln() {
  return (
    <section style={{ padding: '18px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fakten-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .fakten-kachel { transition: transform .15s ease, box-shadow .15s ease; }
        .fakten-kachel:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(25,22,21,.10); filter: none !important; }
        @media (max-width: 860px) {
          .fakten-grid { display: flex; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; padding-bottom: 4px; }
          .fakten-grid::-webkit-scrollbar { display: none; }
          .fakten-kachel { flex: 0 0 78%; scroll-snap-align: start; }
        }
      `}</style>
      <div className="fakten-grid">
        {FAKTEN.map((f) => (
          <Link key={f.key} href={f.href} className="fakten-kachel" style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, textDecoration: 'none', color: INK,
            background: f.honig ? '#FFF6DB' : '#F4F4F2',
            border: `1px solid ${f.honig ? '#F0E3BC' : '#E9E6DF'}`,
            borderRadius: 12, padding: '12px 14px', minWidth: 0,
          }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: f.honig ? '#F4C03F' : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: INK }}>
              <Symbol k={f.key} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: HEAD, fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{f.titel}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(25,22,21,.62)', marginTop: 2, lineHeight: 1.35 }}>{f.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
