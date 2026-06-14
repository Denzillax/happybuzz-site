'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { ListingCard } from '@/components/shared/ListingCard'

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"
const YELLOW = '#F4C03F'
const DARK = '#191615'

export function NewListings() {
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
        .order('created_at', { ascending: false })
        .limit(8)

      if (data) {
        const mapped = data.map(l => ({
          ...l,
          seller: l.profiles,
          price: l.listing_type === 'auction' && l.bids?.length > 0
            ? Math.max(...l.bids.map((b: any) => Number(b.amount)))
            : l.price,
          // bid_count aus der Spalte (Anzahl Gebots-Events)
        }))
        setListings(mapped)
      }
    }
    load()
  }, [])

  if (!listings.length) return null

  return (
    <section style={{ padding: '32px 24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: HEAD, color: DARK, margin: 0 }}>
          Neu eingestellt
        </h2>
        <Link href="/search?sort=newest" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 14, fontWeight: 600, color: YELLOW,
          textDecoration: 'none',
        }}>
          Alle anzeigen <ChevronRight size={16} />
        </Link>
      </div>

      <div className="listing-grid">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} userId={userId} />
        ))}
      </div>
    </section>
  )
}
