'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, User, Package } from 'lucide-react'
import { getShowcaseSellers } from '@/lib/gamification'
import { AccountBadge } from '@/components/shared/AccountBadge'
import { SectionHeader } from './SectionHeader'

const MUTED = '#9A9490'
const YELLOW = '#F4C03F'
const INK = '#14110D'
const SAND = '#ECE3D2'
const PETROL = '#0B5E5C'

const PERIOD = { hour: 'Std', day: 'Tag', week: 'Wo', month: 'Mt' }
function priceLabel(l) {
  if (l.listing_type === 'free') return 'Gratis'
  if (l.listing_type === 'rent' || l.listing_type === 'service') {
    if (l.rent_price == null) return ''
    return `CHF ${Number(l.rent_price).toLocaleString('de-CH')}${l.rent_period ? ` / ${PERIOD[l.rent_period] || l.rent_period}` : ''}`
  }
  if (l.price == null) return ''
  return `CHF ${Number(l.price).toLocaleString('de-CH')}`
}

export function FeaturedSellers() {
  const [sellers, setSellers] = useState([])

  useEffect(() => {
    getShowcaseSellers(6).then(setSellers).catch(() => setSellers([]))
  }, [])

  if (!sellers.length) return null

  return (
    <section style={{ padding: '16px 24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader title="Schaufenster" subtitle="Verkäufer, die diese Woche im Rampenlicht stehen" />

      <div className="featured-sellers-grid">
        {sellers.map((s) => {
          const name = s.account_type === 'business' && s.company_name ? s.company_name : (s.display_name || 'Verkäufer')
          return (
            <div key={s.id} style={{ background: '#fff', border: `1px solid ${INK}`, borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Link href={`/user/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: SAND, border: `1px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {s.avatar_url ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color={PETROL} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                    <AccountBadge accountType={s.account_type} />
                  </div>
                  {s.rating_count > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                      <Star size={12} color={YELLOW} fill={YELLOW} /> {Number(s.avg_rating).toFixed(1)} · {s.rating_count} {s.rating_count === 1 ? 'Bewertung' : 'Bewertungen'}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12.5, color: MUTED, marginTop: 2, display: 'block' }}>Noch keine Bewertungen</span>
                  )}
                </div>
              </Link>

              {s.listings.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '0 2px 2px' }}>
                  {s.listings.map((l) => {
                    const pl = priceLabel(l)
                    return (
                    <Link key={l.id} href={`/listing/${l.id}`} title={l.title} style={{ position: 'relative', aspectRatio: '1 / 1', background: SAND, borderRadius: 0, overflow: 'hidden', textDecoration: 'none', display: 'flex', alignItems: 'flex-end' }}>
                      {l.cover
                        ? <img src={l.cover} alt={l.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#CFC8BC" /></div>}
                      {pl && <span style={{ position: 'relative', width: '100%', padding: '12px 6px 5px', fontSize: 11, fontWeight: 800, color: '#fff', background: 'linear-gradient(transparent, rgba(0,0,0,.65))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl}</span>}
                    </Link>
                  )})}
                </div>
              ) : (
                <div style={{ padding: '0 14px 14px', fontSize: 12.5, color: MUTED }}>Keine aktiven Inserate</div>
              )}

              <Link href={`/user/${s.id}`} style={{ marginTop: 'auto', textAlign: 'center', padding: '10px 14px', borderTop: `1px solid ${INK}1f`, fontSize: 13, fontWeight: 700, color: INK, textDecoration: 'none' }}>
                Profil ansehen
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
