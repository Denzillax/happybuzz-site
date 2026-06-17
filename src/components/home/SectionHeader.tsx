'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Einheitlicher Katalog-Sektionskopf: General-Sans-Headline auf einer INK-Haarlinie,
// optionaler Mono-Eyebrow, Mono-"Alle anzeigen"-Link rechts auf der Grundlinie.
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const MONO = "'Space Mono', ui-monospace, monospace"
const INK = '#14110D'
const PETROL = '#0B5E5C'

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'Alle anzeigen',
  eyebrow,
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  eyebrow?: string
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 16, paddingBottom: 12, borderBottom: `1.5px solid ${INK}`,
      }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
              textTransform: 'uppercase', color: PETROL, marginBottom: 7,
            }}>{eyebrow}</div>
          )}
          <h2 style={{
            fontFamily: HEAD, fontSize: 'clamp(23px, 3vw, 30px)', fontWeight: 700,
            letterSpacing: '-0.01em', color: INK, margin: 0, lineHeight: 1.04,
          }}>{title}</h2>
        </div>
        {href && (
          <Link href={href} className="bd-section-link" style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: MONO, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em',
            textTransform: 'uppercase', color: INK, textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            {linkLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {subtitle && (
        <p style={{
          fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 14,
          color: 'rgba(20,17,13,0.55)', margin: '11px 0 0',
        }}>{subtitle}</p>
      )}
    </div>
  )
}
