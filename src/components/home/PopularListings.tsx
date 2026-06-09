'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { ListingCard } from '@/components/shared/ListingCard'

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const MUTED = '#9A9490'
const YELLOW = '#F4C03F'
const DARK = '#191615'

export function PopularListings() {
  const [listings, setListings] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

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
        .order('view_count', { ascending: false })
        .limit(8)

      if (data) {
        const mapped = data.map(l => ({
          ...l,
          seller: l.profiles,
          price: l.listing_type === 'auction' && l.bids?.length > 0
            ? Math.max(...l.bids.map((b: any) => b.amount))
            : l.price,
          bid_count: l.bids?.length || 0,
        }))
        setListings(mapped)
      }
    }
    load()
  }, [])

  if (!listings.length) return null

  return (
    <section style={{ padding: '16px 24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: HEAD, color: DARK, margin: 0 }}>
          Beliebt gerade
        </h2>
        <Link href="/search?sort=relevanz" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 14, fontWeight: 600, color: YELLOW,
          textDecoration: 'none',
        }}>
          Alle anzeigen <ChevronRight size={16} />
        </Link>
      </div>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 16px' }}>Die beliebtesten Artikel der Community</p>

      <div className="listing-grid">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} userId={userId} />
        ))}
      </div>
    </section>
  )
}
