'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RasterUmschalter } from '@/components/shared/RasterUmschalter'

// Klar-Look Sektionskopf: ruhige einzeilige Ueberschrift, Link rechts
// auf derselben Zeile. Kein Eyebrow-Geschrei, keine Trennlinie.
const HEAD = "'Instrument Sans', 'General Sans', 'Instrument Sans', 'Manrope', system-ui, sans-serif"
const INK = '#191615'
const TEAL = '#1D1D1D'

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'Alle ansehen',
  eyebrow,
  raster = false,
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  eyebrow?: string
  raster?: boolean
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <h2 className="bd-abschnittstitel" style={{
          fontFamily: HEAD, fontSize: 20, fontWeight: 700,
          letterSpacing: '-0.01em', color: INK, margin: 0, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
        }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{title}</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {raster && <RasterUmschalter />}
        {href && (
          <Link href={href} className="bd-section-link" style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 700, color: TEAL,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            {linkLabel} <ArrowRight size={14} />
          </Link>
        )}
        </div>
      </div>
      {subtitle && (
        <p style={{
          fontFamily: "'Instrument Sans', 'Manrope', system-ui, sans-serif", fontSize: 13.5,
          color: 'rgba(25,22,21,0.55)', margin: '4px 0 0',
        }}>{subtitle}</p>
      )}
    </div>
  )
}
