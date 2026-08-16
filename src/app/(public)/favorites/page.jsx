'use client'
import { supabase } from '@/lib/supabase/supabase'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, Trash2, Search, User, ChevronDown } from 'lucide-react'
import { getUserFavorites } from '@/lib/listings'
import { ListingCard } from '@/components/shared/ListingCard'

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

// Stempeltext fuer nicht mehr verfuegbare Inserate; null = aktiv.
// Auktionen gelten als beendet, sobald das Enddatum vorbei ist, auch wenn der
// Status (noch) active ist.
function inactiveLabel(l) {
  if (l.status === 'sold') return 'Verkauft'
  if (l.status === 'expired') return 'Beendet'
  if (l.listing_type === 'auction' && l.auction_end && new Date(l.auction_end).getTime() < Date.now()) return 'Beendet'
  if (l.status !== 'active') return 'Beendet'
  return null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [sellers, setSellers] = useState([])
  const [tab, setTab] = useState('listings')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showInactive, setShowInactive] = useState(true)
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

  const handleRemoveSeller = async (sellerId) => {
    if (!user) return
    await toggleFavoriteSeller(user.id, sellerId)
    setSellers(prev => prev.filter(s => s.seller_id !== sellerId))
  }

  // Filter by search
  const q = search.toLowerCase().trim()
  const filteredFavorites = q ? favorites.filter(f => f.title?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q)) : favorites
  const filteredSellers = q ? sellers.filter(s => s.seller?.display_name?.toLowerCase().includes(q) || s.seller?.city?.toLowerCase().includes(q)) : sellers

  // Aktive zuerst, erledigte (verkauft/beendet) in die eigene Sektion darunter
  const activeFavs = filteredFavorites.filter(f => !inactiveLabel(f))
  const inactiveFavs = filteredFavorites.filter(f => inactiveLabel(f))

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-text/5 rounded-none w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-text/5 rounded-none h-72" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-6">
        <div className="font-['Space_Mono',monospace] text-[10px] font-bold tracking-[.18em] uppercase text-[#0B5E5C] mb-1.5">Gemerkte Exponate · Katalog der zweiten Leben</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#14110D] font-['General_Sans','Manrope',sans-serif] flex items-center gap-3">
          <Heart size={26} className="text-honey" fill="#F4C03F" />
          Meine Favoriten
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-[#14110D] mb-6">
        <button onClick={() => { setTab('listings'); setSearch('') }} className={`px-5 py-3 font-['Space_Mono',monospace] text-[11px] font-bold uppercase tracking-[.1em] transition-all ${tab === 'listings' ? 'border-b-[3px] border-honey text-[#14110D] -mb-[2px]' : 'text-text/50 hover:text-text/70'}`}>
          Inserate ({favorites.length})
        </button>
        <button onClick={() => { setTab('sellers'); setSearch('') }} className={`px-5 py-3 font-['Space_Mono',monospace] text-[11px] font-bold uppercase tracking-[.1em] transition-all ${tab === 'sellers' ? 'border-b-[3px] border-honey text-[#14110D] -mb-[2px]' : 'text-text/50 hover:text-text/70'}`}>
          Verkäufer ({sellers.length})
        </button>
      </div>

      {/* Search */}
      {(favorites.length > 0 || sellers.length > 0) && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'listings' ? 'Favoriten durchsuchen...' : 'Verkäufer suchen...'}
            className="w-full pl-10 pr-4 py-3 rounded-none border border-[#14110D] bg-white text-sm focus:outline-none focus:border-[#0B5E5C] transition-colors"
          />
        </div>
      )}

      {/* Tab: Inserate */}
      {tab === 'listings' && (
        <>
          {filteredFavorites.length > 0 ? (
            <>
              {activeFavs.length > 0 && (
                <div className="listing-grid">
                  {activeFavs.map(listing => (
                    <ListingCard key={listing.id} listing={listing} userId={user?.id} onUnfavorite={(id) => setFavorites(prev => prev.filter(f => f.id !== id))} />
                  ))}
                </div>
              )}
              {inactiveFavs.length > 0 && (
                <div className={activeFavs.length > 0 ? 'mt-10' : ''}>
                  <button
                    onClick={() => setShowInactive(v => !v)}
                    className="w-full flex items-center gap-2 border-t-2 border-[#14110D] pt-3 pb-1 font-['Space_Mono',monospace] text-[11px] font-bold uppercase tracking-[.15em] text-[#14110D] cursor-pointer bg-transparent"
                  >
                    Nicht mehr verfügbar ({inactiveFavs.length})
                    <ChevronDown size={14} className={`transition-transform ${showInactive ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-text/40 text-xs mb-4">Verkauft oder beendet. Mit dem Herz kannst du sie aus den Favoriten entfernen.</p>
                  {showInactive && (
                    <div className="listing-grid">
                      {inactiveFavs.map(listing => (
                        <ListingCard key={listing.id} listing={listing} userId={user?.id} statusOverlay={inactiveLabel(listing)} onUnfavorite={(id) => setFavorites(prev => prev.filter(f => f.id !== id))} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-none border border-[#14110D] bg-honey/20 mb-6">
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
                <div key={s.seller_id} className="bg-white rounded-none border border-[#14110D] p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <Link href={`/user/${s.seller_id}`} className="flex items-center gap-4 flex-1 min-w-0 no-underline">
                    <div className="w-14 h-14 rounded-none border border-[#14110D] bg-honey/30 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <button onClick={() => handleRemoveSeller(s.seller_id)} className="p-2 rounded-none hover:bg-red-50 transition-colors text-text/30 hover:text-red-500 flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-none border border-[#14110D] bg-honey/20 mb-6">
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
