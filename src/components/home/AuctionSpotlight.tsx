'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { ListingCard } from '@/components/shared/ListingCard'
import { SectionHeader } from './SectionHeader'

const MONO = "'Space Mono', ui-monospace, monospace"
const INK = '#14110D'
const HONEY = '#F4C03F'

// Laufende Auktionen mit tickendem Countdown: der Grund, heute wiederzukommen.
// Erscheint nur, wenn tatsaechlich Auktionen laufen.
export function AuctionSpotlight() {
  const [listings, setListings] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      setUserId(session?.user?.id || null)

      const { data } = await supabase
        .from('listings')
        .select(`
          *, listing_images(url, sort_order),
          profiles!listings_user_id_fkey(display_name, avg_rating),
          bids:bids(amount)
        `)
        .eq('status', 'active')
        .eq('listing_type', 'auction')
        .gt('auction_end', new Date().toISOString())
        .order('auction_end', { ascending: true })
        .limit(4)

      if (data) {
        // Gleiche Preis-Logik wie NewListings: hoechstes Gebot als Preis
        setListings(data.map(l => ({
          ...l,
          seller: l.profiles,
          price: l.bids?.length > 0 ? Math.max(...l.bids.map((b: any) => Number(b.amount))) : l.price,
        })))
      }
    }
    load()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const rest = (endIso: string) => {
    const ms = new Date(endIso).getTime() - now
    if (ms <= 0) return 'beendet'
    const s = Math.floor(ms / 1000)
    const d = Math.floor(s / 86400)
    if (d >= 1) return `endet in ${d} Tag${d > 1 ? 'en' : ''}`
    const h = Math.floor(s / 3600)
    if (h >= 1) return `endet in ${h} Std. ${Math.floor((s % 3600) / 60)} Min.`
    const m = Math.floor(s / 60)
    return `endet in ${m}:${String(s % 60).padStart(2, '0')} Min.`
  }

  if (!listings.length) return null

  return (
    <section style={{ padding: '32px 24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader title="Endet bald" href="/search?type=auction" linkLabel="Alle Auktionen" />

      <div className="listing-grid home-swipe">
        {listings.map(listing => {
          const dringend = new Date(listing.auction_end).getTime() - now < 3600_000
          return (
            <div key={listing.id}>
              <ListingCard listing={listing} userId={userId} />
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <span style={{
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                  background: dringend ? HONEY : '#fff', color: INK,
                  border: `1.5px solid ${INK}`, padding: '4px 10px',
                  display: 'inline-block', fontVariantNumeric: 'tabular-nums',
                }}>
                  {rest(listing.auction_end)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
