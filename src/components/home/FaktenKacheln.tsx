'use client'
import Link from 'next/link'
import { BadgePercent, Wallet } from 'lucide-react'
import BeeIcon from '@/components/shared/BeeIcon'
import { FEE_FREE_BELOW, BEE_IMPACT_RATE } from '@/lib/constants'

// Drei Fakten als mittige Unterzeile des Heros (Denis 19.09.2026).
// Verlauf: erst vier Boxen (zu viel los), dann eine linksbündige Zeile (rechte Hälfte
// leer, schlecht verteilt). Jetzt mittig mit Trennpunkten, so liest sie sich als
// Bildunterschrift zum Hero. Der vierte Fakt ("fünf Formate") ist gestrichen: das
// sagt schon der Hero und die Überschrift darunter. Zahlen kommen aus constants.js.
const BODY = "'Instrument Sans', 'Manrope', system-ui, sans-serif"

const FAKTEN = [
  { key: 'gratis', text: `Unter CHF ${FEE_FREE_BELOW} gebührenfrei`, href: '/search?max=' + FEE_FREE_BELOW },
  { key: 'bienen', text: `${Math.round(BEE_IMPACT_RATE * 100)} % der Gebühr für Bienen`, href: '/impact' },
  { key: 'zahlen', text: 'TWINT, Bank oder bar', href: '/help' },
]

function Symbol({ k }: { k: string }) {
  if (k === 'gratis') return <BadgePercent size={14} />
  if (k === 'bienen') return <BeeIcon size={14} />
  return <Wallet size={14} />
}

export function FaktenKacheln() {
  return (
    <section style={{ padding: '14px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .fakten-zeile { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; row-gap: 4px; }
        .fakten-punkt:hover { color: #1D1D1D !important; filter: none !important; }
        .fakten-trenner { width: 3px; height: 3px; border-radius: 50%; background: rgba(25,22,21,.28); flex-shrink: 0; }
        @media (max-width: 640px) {
          .fakten-zeile { gap: 10px; }
          .fakten-trenner { display: none; }
        }
      `}</style>
      <div className="fakten-zeile">
        {FAKTEN.map((f, i) => (
          <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            {i > 0 && <span className="fakten-trenner" aria-hidden="true" />}
            <Link href={f.href} className="fakten-punkt" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              textDecoration: 'none', color: 'rgba(25,22,21,.62)', fontFamily: BODY, fontSize: 12.5, fontWeight: 600,
            }}>
              <Symbol k={f.key} />
              {f.text}
            </Link>
          </span>
        ))}
      </div>
    </section>
  )
}
