'use client'
import Link from 'next/link'
import { BadgePercent, Wallet, Layers } from 'lucide-react'
import BeeIcon from '@/components/shared/BeeIcon'
import { FEE_FREE_BELOW, BEE_IMPACT_RATE } from '@/lib/constants'

// Vier Fakten als EINE schmale Zeile unter dem Hero (Denis 19.09.2026).
// Erste Fassung waren vier Boxen mit Untertitel: zu viel los. Jetzt nur Symbol
// und Kurztext, ohne Flächen, gleiche Schrift wie die Pillen darunter.
// Zahlen kommen aus constants.js.
const INK = '#191615'
const BODY = "'Manrope', system-ui, sans-serif"

const FAKTEN = [
  { key: 'gratis', text: `Unter CHF ${FEE_FREE_BELOW} gebührenfrei`, href: '/search?max=' + FEE_FREE_BELOW },
  { key: 'bienen', text: `${Math.round(BEE_IMPACT_RATE * 100)} % der Gebühr für Bienen`, href: '/impact' },
  { key: 'zahlen', text: 'TWINT, Bank oder bar', href: '/help' },
  { key: 'formate', text: 'Kaufen, bieten, mieten, schenken', href: '/search' },
]

function Symbol({ k }: { k: string }) {
  if (k === 'gratis') return <BadgePercent size={14} />
  if (k === 'bienen') return <BeeIcon size={14} />
  if (k === 'zahlen') return <Wallet size={14} />
  return <Layers size={14} />
}

export function FaktenKacheln() {
  return (
    <section style={{ padding: '10px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fakten-zeile { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
        .fakten-punkt:hover { color: #0E9493 !important; filter: none !important; }
        @media (max-width: 860px) {
          .fakten-zeile { flex-wrap: nowrap; overflow-x: auto; gap: 18px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .fakten-zeile::-webkit-scrollbar { display: none; }
        }
      `}</style>
      <div className="fakten-zeile">
        {FAKTEN.map((f) => (
          <Link key={f.key} href={f.href} className="fakten-punkt" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap',
            textDecoration: 'none', color: 'rgba(25,22,21,.62)', fontFamily: BODY, fontSize: 12.5, fontWeight: 600,
          }}>
            <Symbol k={f.key} />
            {f.text}
          </Link>
        ))}
      </div>
    </section>
  )
}
