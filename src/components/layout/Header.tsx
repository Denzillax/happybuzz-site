'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { Search, X, Plus, User, LogOut, ChevronDown, ChevronRight, Settings, Heart, Tag, ShoppingBag, Star, Receipt, Bell, Menu, Package, UserCheck, SearchIcon, LayoutGrid, MessageCircle, CalendarDays, ShieldCheck, Gavel } from 'lucide-react'
import NotificationBell from '@/components/shared/NotificationBell'
import { MegaMenu } from '@/components/shared/MegaMenu'


const navLinks = [
  { label: 'Stöbern', href: '/search' },
  { label: 'So funktionierts', href: '/how-it-works' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimer = useRef(null)

  // Autocomplete: Kategorie-Vorschläge
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

  // Sync search query from URL
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
  }, [searchParams])
  const [favOpen, setFavOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Unread messages — direkt inline, kein dynamischer Import
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
    return () => { active = false; clearInterval(iv) }
  }, [user?.id])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const favRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (favRef.current && !favRef.current.contains(e.target as Node)) setFavOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [searchOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setUser(null)
    router.push('/')
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
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
    { href: '/listings', icon: Tag, label: 'Meine Inserate' },
    { href: '/purchases', icon: Receipt, label: 'Meine Käufe' },
    { href: '/bids', icon: Gavel, label: 'Meine Gebote' },
    { href: '/sales', icon: ShoppingBag, label: 'Meine Verkäufe' },
    { href: '/bookings', icon: CalendarDays, label: 'Buchungen' },
    { href: '/chat', icon: MessageCircle, label: 'Nachrichten' },
    { href: '/fees', icon: Receipt, label: 'Gebühren & Beiträge' },
    ...(user?.id === '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0' ? [{ divider: true }, { href: '/admin', icon: ShieldCheck, label: 'Admin Dashboard' }] : []),
  ]

  const favSubItems = [
    { href: '/favorites', icon: Package, label: 'Artikel' },
    { href: '/favorites?tab=sellers', icon: UserCheck, label: 'Verkäufer' },
    { href: '/favorites?tab=searches', icon: Search, label: 'Suchen' },
  ]

  // Shared styles
  const iconBtn = { width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', transition: 'all 0.15s', position: 'relative' as const }
  const iconBtnHover = { background: '#f5f3f0', color: '#1a1a1a' }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 68 }}>

          {/* ── Logo ── */}
          <Logo width={168} />

          {/* ── Kategorien Button ── */}
          <div className="hdr-desktop" style={{ alignItems: 'center' }}>
            <button onClick={() => setMegaMenuOpen(!megaMenuOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              border: megaMenuOpen ? '1.5px solid #F4C03F' : '1.5px solid #e8e5e0',
              borderRadius: 8, background: megaMenuOpen ? '#FDF8E8' : '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              color: '#1a1a1a', transition: 'all .15s', whiteSpace: 'nowrap',
            }}>
              <LayoutGrid size={16} />
              Kategorien
              <ChevronDown size={14} style={{ transform: megaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>
          </div>

          {/* ── Search Bar — fixed, fills space ── */}
          <div className="hdr-desktop" style={{ flex: 1, alignItems: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', background: '#fff', border: '2px solid #F4C03F', borderRadius: 8, overflow: 'hidden' }}>
              <Search size={18} style={{ marginLeft: 14, color: '#888', flexShrink: 0, alignSelf: 'center' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setShowSuggestions(false) } }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Suche nach Artikel, Verkäufer oder Artikelnummer"
                style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', color: '#1a1a1a', background: 'transparent' }}
              />
              <button onClick={() => { handleSearch(); setShowSuggestions(false) }} style={{ padding: '0 28px', background: '#F4C03F', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#1a1a1a', fontFamily: 'inherit', transition: 'background 0.15s', whiteSpace: 'nowrap' }}>
                Suchen
              </button>
            </div>
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1px solid #e8e5e0', borderRadius: '0 0 8px 8px', boxShadow: '0 6px 20px rgba(0,0,0,.08)', marginTop: 2, overflow: 'hidden' }}>
                <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.04em' }}>Kategorien</div>
                {suggestions.map(cat => (
                  <button key={cat.id}
                    onMouseDown={(e) => { e.preventDefault(); router.push(`/search?category=${cat.slug}`); setShowSuggestions(false); setSearchQuery('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: '#1a1a1a', textAlign: 'left', transition: 'background .1s' }}
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

          {/* ── Desktop Actions ── */}
          <div className="hdr-desktop" style={{ alignItems: 'center', gap: 6 }}>

            {/* Favorites — with submenu */}
              <div ref={favRef} style={{ position: 'relative' }}>
                <button onClick={() => { if (!user) { router.push('/login'); return; } setFavOpen(!favOpen); setDropdownOpen(false); }} className="hdr-icon-btn" style={{ ...iconBtn, color: favOpen ? '#D44' : '#555' }}>
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
              {user ? <NotificationBell /> : <button className="hdr-icon-btn" style={iconBtn} onClick={() => router.push('/login')}><Bell size={20} /></button>}

            {/* Inserieren */}
            <Link href="/listings/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#F4C03F', color: '#1a1a1a', fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s', fontFamily: 'inherit', marginLeft: 2 }}>
              <Plus size={16} /> Inserieren
            </Link>

            {/* User — round avatar (always visible, no flicker) */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { if (!user) { router.push('/login'); return; } setDropdownOpen(!dropdownOpen); setFavOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F4C03F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1a1a1a', transition: 'box-shadow 0.15s', boxShadow: dropdownOpen ? '0 0 0 2px #fff, 0 0 0 4px #F4C03F' : 'none', position: 'relative' }}>
                    {getInitials()}
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#e53e3e', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </div>
                  <ChevronDown size={14} style={{ color: '#888', transition: 'transform 0.15s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {dropdownOpen && (
                  <div style={{ ...dropdownStyle, width: 250, padding: '6px 0' }}>
                    {/* User info */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0ede8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#F4C03F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>
                          {getInitials()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: 0 }}>{displayName}</p>
                          <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
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
                                <span style={{ marginLeft: 'auto', background: '#F4C03F', color: '#1a1a1a', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>{unreadCount}</span>
                              )}
                            </Link>
                      ))}
                    </div>

                    {/* Settings + Logout */}
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

          {/* ── Mobile Right: DM + Hamburger ── */}
          <div className="hdr-mobile-only" style={{ marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
            {user && (
              <button onClick={() => setMobileOpen(!mobileOpen)}
                style={{ width: 34, height: 34, borderRadius: '50%', background: '#F4C03F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a1a1a', border: 'none', cursor: 'pointer', boxShadow: mobileOpen ? '0 0 0 2px #fff, 0 0 0 4px #F4C03F' : 'none' }}>
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
        <div className="hdr-mobile-only" style={{ borderTop: '1px solid #e8e5e0', background: '#fff', flexDirection: 'column', maxHeight: 'calc(100vh - 68px)', overflowY: 'auto' }}>

          {/* User Info */}
          {user && (
            <div style={{ padding: '20px 24px', background: '#FAFAF8', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F4C03F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>
                  {getInitials()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', margin: 0 }}>{displayName}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', borderRadius: 10, border: '2px solid #F4C03F', overflow: 'hidden' }}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setMobileOpen(false); } }}
                placeholder="Suchen..." style={{ flex: 1, padding: '12px 14px', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit' }} />
              <button onClick={() => { handleSearch(); setMobileOpen(false); }} style={{ padding: '0 20px', background: '#F4C03F', border: 'none', cursor: 'pointer' }}>
                <Search size={18} color="#1a1a1a" />
              </button>
            </div>
          </div>

          {/* Navigation */}
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

          {/* Divider */}
          <div style={{ height: 1, background: '#f0ede8', margin: '4px 24px' }} />

          {/* User Links */}
          {user && (
            <div style={{ padding: '4px 12px' }}>
              {[
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

          {/* Actions */}
          <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/listings/new" onClick={() => setMobileOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', background: '#F4C03F', color: '#1a1a1a', fontWeight: 700, fontSize: 15, borderRadius: 10, textDecoration: 'none' }}>
              <Plus size={18} /> Inserieren
            </Link>
            {user ? (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: 'transparent', border: '1.5px solid #e8e5e0', color: '#999', fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                <LogOut size={16} /> Abmelden
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: '#fff', border: '1.5px solid #e8e5e0', color: '#1a1a1a', fontWeight: 600, fontSize: 14, borderRadius: 10, textDecoration: 'none' }}>
                <User size={16} /> Anmelden
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
