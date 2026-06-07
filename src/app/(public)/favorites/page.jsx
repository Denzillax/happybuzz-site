'use client'
import { supabase } from '@/lib/supabase/supabase'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, Tag, Clock, Trash2, Search, ShoppingBag, User } from 'lucide-react'
import { getUserFavorites, toggleFavorite } from '@/lib/listings'
import { getCoverUrl } from '@/lib/formatters'
import { TypeBadge } from '@/components/shared/Badge'

// Inline seller favorite functions (avoid import issues)
async function getFavoriteSellers(userId) {
  const { data, error } = await supabase
    .from('favorite_sellers')
    .select('seller_id, created_at, seller:profiles!favorite_sellers_seller_id_fkey(id, display_name, avatar_url, bee_impact_total, city)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getFavoriteSellers:', error); return [] }
  return data || []
}

async function toggleFavoriteSeller(userId, sellerId) {
  const { data: existing } = await supabase
    .from('favorite_sellers')
    .select('user_id')
    .eq('user_id', userId)
    .eq('seller_id', sellerId)
    .maybeSingle()
  if (existing) {
    await supabase.from('favorite_sellers').delete().eq('user_id', userId).eq('seller_id', sellerId)
    return false
  } else {
    await supabase.from('favorite_sellers').insert({ user_id: userId, seller_id: sellerId })
    return true
  }
}

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
  const [sellers, setSellers] = useState([])
  const [tab, setTab] = useState('listings')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('tab') === 'sellers') setTab('sellers')
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      try {
        const [favs, favSellers] = await Promise.all([
          getUserFavorites(session.user.id),
          getFavoriteSellers(session.user.id),
        ])
        setFavorites(favs)
        setSellers(favSellers)
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

  const handleRemoveSeller = async (sellerId) => {
    if (!user) return
    await toggleFavoriteSeller(user.id, sellerId)
    setSellers(prev => prev.filter(s => s.seller_id !== sellerId))
  }

  // Filter by search
  const q = search.toLowerCase().trim()
  const filteredFavorites = q ? favorites.filter(f => f.title?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q)) : favorites
  const filteredSellers = q ? sellers.filter(s => s.seller?.display_name?.toLowerCase().includes(q) || s.seller?.city?.toLowerCase().includes(q)) : sellers

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text flex items-center gap-3">
          <Heart size={28} className="text-honey" />
          Meine Favoriten
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-text/10 mb-6">
        <button onClick={() => { setTab('listings'); setSearch('') }} className={`px-5 py-3 text-sm font-bold transition-all ${tab === 'listings' ? 'border-b-2 border-honey text-text -mb-[2px]' : 'text-text/40 hover:text-text/60'}`}>
          Inserate ({favorites.length})
        </button>
        <button onClick={() => { setTab('sellers'); setSearch('') }} className={`px-5 py-3 text-sm font-bold transition-all ${tab === 'sellers' ? 'border-b-2 border-honey text-text -mb-[2px]' : 'text-text/40 hover:text-text/60'}`}>
          Verkäufer ({sellers.length})
        </button>
      </div>

      {/* Search */}
      {(favorites.length > 0 || sellers.length > 0) && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'listings' ? 'Favoriten durchsuchen...' : 'Verkäufer suchen...'}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-text/10 bg-white text-sm focus:outline-none focus:border-honey transition-colors"
          />
        </div>
      )}

      {/* Tab: Inserate */}
      {tab === 'listings' && (
        <>
          {filteredFavorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFavorites.map(listing => (
                <ListingCard key={listing.id} listing={listing} onRemove={handleRemove} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-honey/10 mb-6">
                <Heart size={36} className="text-honey" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">{q ? 'Keine Treffer' : 'Noch keine Favoriten'}</h2>
              <p className="text-text/50 mb-8 max-w-md mx-auto">
                {q ? 'Versuch einen anderen Suchbegriff.' : 'Stöbere im Marktplatz und speichere Inserate die dich interessieren.'}
              </p>
              {!q && (
                <Link href="/search" className="btn-honey inline-flex items-center gap-2">
                  <Search size={18} /> Marktplatz entdecken
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* Tab: Verkäufer */}
      {tab === 'sellers' && (
        <>
          {filteredSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSellers.map(s => (
                <div key={s.seller_id} className="bg-white rounded-2xl border border-text/5 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <Link href={`/user/${s.seller_id}`} className="flex items-center gap-4 flex-1 min-w-0 no-underline">
                    <div className="w-14 h-14 rounded-full bg-honey/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.seller?.avatar_url
                        ? <img src={s.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <User size={24} className="text-honey" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text text-sm truncate">{s.seller?.display_name || 'User'}</p>
                      {s.seller?.city && <p className="text-text/40 text-xs flex items-center gap-1 mt-1"><MapPin size={11} /> {s.seller.city}</p>}
                    </div>
                  </Link>
                  <button onClick={() => handleRemoveSeller(s.seller_id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-text/30 hover:text-red-500 flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-honey/10 mb-6">
                <User size={36} className="text-honey" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">{q ? 'Keine Treffer' : 'Noch keine Verkäufer gemerkt'}</h2>
              <p className="text-text/50 mb-8 max-w-md mx-auto">
                {q ? 'Versuch einen anderen Suchbegriff.' : 'Merke dir Verkäufer auf deren Profilseite oder auf Inseraten.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
