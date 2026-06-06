'use client'
import { supabase } from '@/lib/supabase/supabase'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, Tag, Clock, Trash2, Search, ShoppingBag } from 'lucide-react'
import { getUserFavorites, toggleFavorite } from '@/lib/listings'
import { getCoverUrl } from '@/lib/formatters'
import { TypeBadge } from '@/components/shared/Badge'

function formatPrice(listing) {
  if (listing.listing_type === 'free') return 'Gratis'
  if (listing.listing_type === 'rent') return `CHF ${Number(listing.rent_price || 0).toLocaleString('de-CH')} / ${listing.rent_period || 'Tag'}`
  if (listing.listing_type === 'auction') return `ab CHF ${Number(listing.price || 0).toLocaleString('de-CH')}`
  return `CHF ${Number(listing.price || 0).toLocaleString('de-CH')}`
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `vor ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `vor ${days}d`
  return `vor ${Math.floor(days / 30)} Mt.`
}

function ListingCard({ listing, onRemove }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setRemoving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await toggleFavorite(session.user.id, listing.id)
        onRemove(listing.id)
      }
    } catch (err) {
      console.error(err)
      setRemoving(false)
    }
  }

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`group bg-white rounded-2xl overflow-hidden border border-text/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${removing ? 'opacity-50 scale-95' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-text/5 overflow-hidden">
        {getCoverUrl(listing) ? (
          <img
            src={getCoverUrl(listing)}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={48} className="text-text/10" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <TypeBadge type={listing.listing_type} />
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-red-400 hover:text-red-600 hover:bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Favorit entfernen"
        >
          <Trash2 size={16} />
        </button>

        {/* Condition Badge */}
        {listing.conditionLabel && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-text/70">
              {listing.conditionLabel}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-text text-sm leading-snug line-clamp-2 group-hover:text-honey transition-colors">
          {listing.title}
        </h3>

        <p className="text-lg font-bold text-text">
          {formatPrice(listing)}
        </p>

        <div className="flex items-center justify-between text-xs text-text/40 pt-1">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {listing.city || 'Schweiz'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(listing.created_at)}
          </span>
        </div>

        {listing.categoryName && (
          <span className="inline-flex items-center gap-1 text-[11px] text-text/30 mt-1">
            <Tag size={10} />
            {listing.categoryName}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      try {
        const favs = await getUserFavorites(session.user.id)
        setFavorites(favs)
      } catch (err) {
        console.error('Error loading favorites:', err)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleRemove = (listingId) => {
    setFavorites(prev => prev.filter(f => f.id !== listingId))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-text/5 rounded-lg w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-text/5 rounded-2xl h-72" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text flex items-center gap-3">
            <Heart size={28} className="text-honey" />
            Meine Favoriten
          </h1>
          <p className="text-text/50 mt-1">
            {favorites.length === 0
              ? 'Du hast noch keine Favoriten gespeichert.'
              : `${favorites.length} ${favorites.length === 1 ? 'Inserat' : 'Inserate'} gespeichert`}
          </p>
        </div>
      </div>

      {/* Listings Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-honey/10 mb-6">
            <Heart size={36} className="text-honey" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">
            Noch keine Favoriten
          </h2>
          <p className="text-text/50 mb-8 max-w-md mx-auto">
            Stöbere im Marktplatz und speichere Inserate die dich interessieren. Sie erscheinen dann hier.
          </p>
          <Link
            href="/search"
            className="btn-honey inline-flex items-center gap-2"
          >
            <Search size={18} />
            Marktplatz entdecken
          </Link>
        </div>
      )}
    </div>
  )
}
