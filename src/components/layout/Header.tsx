'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { Search, X, Plus, User, LogOut, ChevronDown, Settings, Heart, Tag, ShoppingBag, Star, Receipt, Bell, Menu, Package, UserCheck, MessageCircle, CalendarDays, ShieldCheck, Gavel, AlignJustify, Trophy } from 'lucide-react'
import NotificationBell from '@/components/shared/NotificationBell'
import NektarBadge from '@/components/shared/NektarBadge'
import { MegaMenu } from '@/components/shared/MegaMenu'
import { getMyRole } from '@/lib/staff'


const YELLOW = '#F4C03F'
const DARK = '#191615'
const INK = '#14110D'
const PAPER = '#FBF8F2'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimer = useRef(null)
  const [favOpen, setFavOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [canAdmin, setCanAdmin] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const favRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // ── Autocomplete ──
  const handleQueryChange = (val) => {
    setSearchQuery(val)
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    suggestTimer.current = setTimeout(async () => {
      try {
        const { searchCategories } = await import('@/lib/listings')
        const cats = await searchCategories(val.trim())
        setSuggestions(cats)
        setShowSuggestions(cats.length > 0)
      } catch { setSuggestions([]); setShowSuggestions(false) }
    }, 250)
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
  }, [searchParams])

  // ── Unread messages ──
  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    let active = true
    const load = async () => {
      try {
        const { data, error } = await supabase.rpc('get_unread_count_for_user', { p_user_id: user.id })
        if (active && !error) setUnreadCount(data || 0)
      } catch {}
    }
    load()
    const iv = setInterval(load, 30000)
    // Sofort aktualisieren beim Zurückkehren + wenn Nachrichten gelesen wurden
    const onRefresh = () => load()
    window.addEventListener('focus', onRefresh)
    document.addEventListener('visibilitychange', onRefresh)
    window.addEventListener('beedaro:messages-read', onRefresh)
    return () => {
      active = false; clearInterval(iv)
      window.removeEventListener('focus', onRefresh)
      document.removeEventListener('visibilitychange', onRefresh)
      window.removeEventListener('beedaro:messages-read', onRefresh)
    }
  }, [user?.id])

  // ── Auth ──
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Admin-/Mitarbeiter-Zugang (Owner oder zugewiesene Rolle) ──
  useEffect(() => {
    if (!user) { setCanAdmin(false); return }
    if (user.id === '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0') { setCanAdmin(true); return }
    let active = true
    getMyRole(user.id).then(r => { if (active) setCanAdmin(!!r) }).catch(() => {})
    return () => { active = false }
  }, [user?.id])

  // ── Click outside ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (favRef.current && !favRef.current.contains(e.target as Node)) setFavOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setUser(null)
    router.push('/')
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSuggestions(false)
    }
  }

  const getInitials = () => {
    const name = user?.user_metadata?.full_name
    if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Benutzer'

  const menuItems = [
    { href: '/search', icon: ShoppingBag, label: 'Stöbern' },
    { href: '/how-it-works', icon: Star, label: 'So funktionierts' },
    { divider: true },
    { href: '/hive', icon: Trophy, label: 'Mein Hive' },
    { href: '/listings', icon: Tag, label: 'Meine Inserate' },
    { href: '/purchases', icon: Receipt, label: 'Meine Käufe' },
    { href: '/bids', icon: Gavel, label: 'Meine Gebote' },
    { href: '/sales', icon: ShoppingBag, label: 'Meine Verkäufe' },
    { href: '/bookings', icon: CalendarDays, label: 'Buchungen' },
    { href: '/chat', icon: MessageCircle, label: 'Nachrichten' },
    { href: '/fees', icon: Receipt, label: 'Gebühren & Beiträge' },
    ...(canAdmin ? [{ divider: true }, { href: '/admin', icon: ShieldCheck, label: 'Admin Dashboard' }] : []),
  ]

  const favSubItems = [
    { href: '/favorites', icon: Package, label: 'Artikel' },
    { href: '/favorites?tab=sellers', icon: UserCheck, label: 'Verkäufer' },
    { href: '/favorites?tab=searches', icon: Search, label: 'Suchen' },
  ]

  const dropdownStyle = { position: 'absolute' as const, right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #e5e5e5', zIndex: 100 }
  const menuItemStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 14, fontWeight: 500, color: '#444', textDecoration: 'none', transition: 'all 0.12s', cursor: 'pointer', border: 'none', background: 'none', width: '100%', fontFamily: 'inherit' }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e5e0' }}>
      <style>{`
        .hdr-desktop { display: flex !important; }
        .hdr-mobile-only { display: none !important; }
        .hdr-menu-item:hover { background: #f8f6f3 !important; color: #1a1a1a !important; }
        .hdr-icon-btn:hover { background: #f5f3f0 !important; color: #1a1a1a !important; }
        @media (max-width: 767px) {
          .hdr-desktop { display: none !important; }
          .hdr-mobile-only { display: flex !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', paddingLeft: 32, paddingRight: 32, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64 }}>

          {/* ── Logo ── */}
          <div style={{ flexShrink: 0, marginRight: 16 }}>
            <Logo width={150} />
          </div>

          {/* ── Desktop: Kategorien + Search + Icons + Avatar ── */}
          <div className="hdr-desktop" style={{ flex: 1, alignItems: 'center', gap: 12 }}>

            {/* Kategorien Button */}
            <button onClick={() => setMegaMenuOpen(!megaMenuOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              border: megaMenuOpen ? `1.5px solid ${INK}` : '1.5px solid #d8d4cd',
              borderRadius: 8, background: megaMenuOpen ? '#ECE3D2' : '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              color: INK, transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <AlignJustify size={15} />
              Alle Kategorien
              <ChevronDown size={13} style={{ transform: megaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {/* Search Bar — fills available space */}
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', background: '#fff', border: `1.5px solid ${INK}`, borderRadius: 8, overflow: 'hidden' }}>
                <Search size={17} style={{ marginLeft: 14, color: '#999', flexShrink: 0, alignSelf: 'center' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => handleQueryChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setShowSuggestions(false) } }}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Suche nach Artikel, Verkäufer oder Artikelnummer"
                  style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: DARK, background: 'transparent', minWidth: 0 }}
                />
                <button onClick={() => { handleSearch(); setShowSuggestions(false) }} style={{ padding: '0 24px', background: INK, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: PAPER, fontFamily: 'inherit', transition: 'background 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Suchen
                </button>
              </div>

              {/* Autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1px solid #e8e5e0', borderRadius: '0 0 8px 8px', boxShadow: '0 6px 20px rgba(0,0,0,.08)', marginTop: 2, overflow: 'hidden' }}>
                  <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.04em' }}>Kategorien</div>
                  {suggestions.map(cat => (
                    <button key={cat.id}
                      onMouseDown={(e) => { e.preventDefault(); router.push(`/search?category=${cat.slug}`); setShowSuggestions(false); setSearchQuery('') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: DARK, textAlign: 'left', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FDF8E8'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Search size={14} style={{ color: '#999' }} />
                      <span>{cat.name}</span>
                      {cat.parent_id && <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto' }}>in Kategorie</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Action Icons ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* Favorites */}
              <div ref={favRef} style={{ position: 'relative' }}>
                <button onClick={() => { if (!user) { router.push('/login'); return; } setFavOpen(!favOpen); setDropdownOpen(false); }} className="hdr-icon-btn" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: favOpen ? '#D44' : '#666', transition: 'all 0.15s' }}>
                  <Heart size={20} fill={favOpen ? '#D44' : 'none'} />
                </button>
                {favOpen && (
                  <div style={{ ...dropdownStyle, width: 200, padding: '6px 0' }}>
                    {favSubItems.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setFavOpen(false)}
                        className="hdr-menu-item"
                        style={menuItemStyle}>
                        <item.icon size={16} style={{ color: '#888' }} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              {user ? <NotificationBell /> : <button className="hdr-icon-btn" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', transition: 'all 0.15s' }} onClick={() => router.push('/login')}><Bell size={20} /></button>}

              {/* Chat */}
              <button className="hdr-icon-btn" onClick={() => { if (!user) { router.push('/login'); return; } router.push('/chat') }} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', transition: 'all 0.15s', position: 'relative' }}>
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, background: '#c62828', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #fff' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
            </div>

            {/* ── Nektar/Level-Badge (Desktop) ── */}
            {user && <div style={{ marginLeft: 10 }}><NektarBadge /></div>}

            {/* ── Avatar — separated to far right ── */}
            <div ref={dropdownRef} style={{ position: 'relative', marginLeft: 12, flexShrink: 0 }}>
              <button
                onClick={() => { if (!user) { router.push('/login'); return; } setDropdownOpen(!dropdownOpen); setFavOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: user ? YELLOW : '#EDEDEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: user ? DARK : '#666', transition: 'box-shadow 0.15s', boxShadow: dropdownOpen ? `0 0 0 2px #fff, 0 0 0 4px ${YELLOW}` : 'none' }}>
                  {user ? getInitials() : <User size={18} />}
                </div>
                {user && <ChevronDown size={14} style={{ color: '#888', transition: 'transform 0.15s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />}
              </button>

              {dropdownOpen && (
                <div style={{ ...dropdownStyle, width: 250, padding: '6px 0' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0ede8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: YELLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: DARK, flexShrink: 0 }}>
                        {getInitials()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: DARK, margin: 0 }}>{displayName}</p>
                        <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    {menuItems.map((item, i) => (
                      item.divider
                        ? <div key={`div-${i}`} style={{ height: 1, background: '#f0ede8', margin: '6px 0' }} />
                        : <Link key={item.href} href={item.href} onClick={() => setDropdownOpen(false)}
                            className="hdr-menu-item"
                            style={menuItemStyle}>
                            <item.icon size={16} style={{ color: '#888' }} />
                            {item.label}
                            {item.label === 'Nachrichten' && unreadCount > 0 && (
                              <span style={{ marginLeft: 'auto', background: YELLOW, color: DARK, fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>{unreadCount}</span>
                            )}
                          </Link>
                    ))}
                  </div>
                  <div style={{ padding: '6px 0', borderTop: '1px solid #f0ede8' }}>
                    <Link href="/settings" onClick={() => setDropdownOpen(false)}
                      className="hdr-menu-item"
                      style={menuItemStyle}>
                      <Settings size={16} style={{ color: '#888' }} /> Einstellungen
                    </Link>
                    <button onClick={handleLogout}
                      className="hdr-menu-item"
                      style={{ ...menuItemStyle, color: '#999' }}>
                      <LogOut size={16} /> Abmelden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile Right: Avatar + Hamburger ── */}
          <div className="hdr-mobile-only" style={{ marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
            {user && <NektarBadge />}
            {user && (
              <button onClick={() => setMobileOpen(!mobileOpen)}
                style={{ width: 34, height: 34, borderRadius: '50%', background: YELLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: DARK, border: 'none', cursor: 'pointer', boxShadow: mobileOpen ? `0 0 0 2px #fff, 0 0 0 4px ${YELLOW}` : 'none' }}>
                {getInitials()}
              </button>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              style={{ width: 40, height: 40, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <MegaMenu open={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="hdr-mobile-only" style={{ borderTop: '1px solid #e8e5e0', background: '#fff', flexDirection: 'column', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {user && (
            <div style={{ padding: '20px 24px', background: '#FAFAF8', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: YELLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: DARK, flexShrink: 0 }}>
                  {getInitials()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: DARK, margin: 0 }}>{displayName}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', borderRadius: 8, border: `1.5px solid ${INK}`, overflow: 'hidden' }}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setMobileOpen(false); } }}
                placeholder="Suchen..." style={{ flex: 1, padding: '12px 14px', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit' }} />
              <button onClick={() => { handleSearch(); setMobileOpen(false); }} style={{ padding: '0 20px', background: INK, border: 'none', cursor: 'pointer' }}>
                <Search size={18} color={PAPER} />
              </button>
            </div>
          </div>
          <div style={{ padding: '0 12px' }}>
            {[
              { href: '/search', icon: ShoppingBag, label: 'Stöbern' },
              { href: '/how-it-works', icon: Star, label: 'So funktionierts' },
            ].map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', fontSize: 15, fontWeight: 600, color: '#333', textDecoration: 'none', borderRadius: 8 }}>
                <link.icon size={18} style={{ color: '#999' }} />
                {link.label}
              </Link>
            ))}
          </div>
          <div style={{ height: 1, background: '#f0ede8', margin: '4px 24px' }} />
          {user && (
            <div style={{ padding: '4px 12px' }}>
              {[
                { href: '/hive', icon: Trophy, label: 'Mein Hive' },
                { href: '/listings', icon: Tag, label: 'Meine Inserate' },
                { href: '/purchases', icon: Receipt, label: 'Meine Käufe' },
                { href: '/bids', icon: Gavel, label: 'Meine Gebote' },
                { href: '/sales', icon: ShoppingBag, label: 'Meine Verkäufe' },
                { href: '/bookings', icon: CalendarDays, label: 'Buchungen' },
                { href: '/chat', icon: MessageCircle, label: 'Nachrichten' },
                { href: '/favorites', icon: Heart, label: 'Favoriten' },
                { href: '/settings', icon: Settings, label: 'Einstellungen' },
              ].map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', fontSize: 15, fontWeight: 600, color: '#333', textDecoration: 'none', borderRadius: 8 }}>
                  <link.icon size={18} style={{ color: '#999' }} />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: 'transparent', border: '1.5px solid #e8e5e0', color: '#999', fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                <LogOut size={16} /> Abmelden
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: '#fff', border: '1.5px solid #e8e5e0', color: DARK, fontWeight: 600, fontSize: 14, borderRadius: 10, textDecoration: 'none' }}>
                <User size={16} /> Anmelden
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
