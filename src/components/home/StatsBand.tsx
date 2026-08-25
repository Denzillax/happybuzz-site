'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { getCommunityImpactStats } from '@/lib/listings'

const MONO = "'Manrope', sans-serif"
const INK = '#14110D'

// Der Katalog in Zahlen: lebende Kennzahlen direkt unter dem Hero.
// Ehrliche kleine Zahlen sind besser als gar keine.
export function StatsBand() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [{ count: exponate }, { count: mitglieder }, impact] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        getCommunityImpactStats(),
      ])
      setStats({
        exponate: exponate ?? 0,
        mitglieder: mitglieder ?? 0,
        impact: Number((impact as any)?.impact || 0),
      })
    }
    load().catch(() => {})
  }, [])

  if (!stats) return null

  const teile = [
    `${stats.exponate.toLocaleString('de-CH')} Inserate`,
    `${stats.mitglieder.toLocaleString('de-CH')} Mitglieder`,
    `CHF ${stats.impact.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bee-Impact`,
  ]

  return (
    <div style={{
      borderTop: "1px solid #E4E0D8", borderBottom: "1px solid #E4E0D8",
      background: '#fff', padding: '11px 16px',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: 'clamp(14px, 4vw, 44px)', flexWrap: 'wrap',
    }}>
      {teile.map((t, i) => (
        <span key={t} style={{
          fontFamily: MONO, fontSize: 'clamp(10px, 1.4vw, 12px)', fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase', color: INK, whiteSpace: 'nowrap',
        }}>
          {t}
        </span>
      ))}
    </div>
  )
}
