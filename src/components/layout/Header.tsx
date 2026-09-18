'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { Search, X, Plus, User, LogOut, ChevronDown, Settings, Heart, Tag, ShoppingBag, Star, Receipt, Bell, Menu, Package, UserCheck, MessageCircle, CalendarDays, ShieldCheck, Gavel, AlignJustify, Trophy, Sparkles } from 'lucide-react'
import NotificationBell from '@/components/shared/NotificationBell'
import NektarBadge from '@/components/shared/NektarBadge'
import { MegaMenu } from '@/components/shared/MegaMenu'
import { getMyRole } from '@/lib/staff'


const YELLOW = '#F4C03F'
const PETROL = '#0B5E5C'
const KI_FARBE = '#0E9493' // KI-Modus im Suchfeld: helleres Teal (Denis 17.09.)
const KI_KEY = 'beedaro_ki_suche'
const DARK = '#191615'
const INK = '#14110D'
const PAPER = '#FFFFFF'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // KI-Schalter im Suchfeld (Denis 16.09.): an = Enter/Suchen gehen in die KI-Suche. Pro Geraet gemerkt.
  const [kiModus, setKiModus] = useState(false)
  useEffect(() => { try { setKiModus(localStorage.getItem(KI_KEY) === '1') } catch {} }, [])
  const toggleKi = () => { setKiModus(v => { const n = !v; try { localStorage.setItem(KI_KEY, n ? '1' : '0') } catch {}; return n }) }
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimer = useRef<any>(null)
  const [favOpen, setFavOpen] = useState(false)
  // Textmenues oben rechts (Ricardo-Vorbild, Denis 15.09.): genau eines offen
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menusRef = useRef<HTMLDivElement>(null)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [canAdmin, setCanAdmin] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const favRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // ── Autocomplete ──
  const handleQueryChange = (val: string) => {
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
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) setOpenMenu(null)
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
    const q = searchQuery.trim()
    if (kiModus) {
      router.push('/search?ki=1' + (q ? '&q=' + encodeURIComponent(q) : ''))
      setSearchQuery('')
      setShowSuggestions(false)
      return
    }
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
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

  const menuItems: any[] = [
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

  const dropdownStyle = { position: 'absolute' as const, right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #e5e5e5', zIndex: 100 }
  const menuItemStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 14, fontWeight: 500, color: '#444', textDecoration: 'none', transition: 'all 0.12s', cursor: 'pointer', border: 'none', background: 'none', width: '100%', fontFamily: 'inherit' }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Zeile 1 (sticky): Marke, Kategorien, Aktionen. Zeile 2 (scrollt mit):
          Suche ueber die volle Breite (Ricardo-Vorbild, Denis 15.09.). */}
      {/* position/zIndex: backdrop-filter macht beide Zeilen zu Stapelkontexten, sonst liegen die Dropdowns hinter der Suchzeile */}
      <div className="hdr-top" style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)' }}>
      <style>{`
        .hdr-desktop { display: flex !important; }
        .hdr-sep { width: 1px; height: 26px; background: #E4E0D8; flex-shrink: 0; margin: 0 6px; }
        .hdr-searchrow { position: relative; z-index: 1; background: rgba(255,255,255,0.98); backdrop-filter: blur(12px); border-bottom: 1px solid #e8e5e0; }
        .hdr-menu-btn:hover, .hdr-menu-btn[aria-expanded="true"] { background: #F4F4F2 !important; filter: none !important; }
        .hdr-menu-btn:hover svg, .hdr-menu-btn[aria-expanded="true"] svg { stroke: #0E9493 !important; color: #0E9493 !important; }
        .hdr-mobile-only { display: none !important; }
        .hdr-menu-item:hover { background: #F4F4F2 !important; color: #14110D !important; filter: none !important; }
        .hdr-menu-item:hover svg { stroke: #0E9493 !important; color: #0E9493 !important; }
        .hdr-icon-btn:hover, .hdr-icon-btn[aria-expanded="true"], .hdr-icon-btn[aria-current="page"] { background: #F4F4F2 !important; filter: none !important; }
        .hdr-icon-btn:hover svg, .hdr-icon-btn[aria-expanded="true"] svg, .hdr-icon-btn[aria-current="page"] svg { stroke: #0E9493 !important; color: #0E9493 !important; }
        @media (max-width: 767px) {
          .hdr-desktop { display: none !important; }
          .hdr-mobile-only { display: flex !important; }
          /* 375px-Rechnung: Logo 150 + Abstand 16 + Icons 188 = 354, Platz war
             aber nur 311 (2x32 Padding), darum scrollte die ganze Seite
             horizontal. Weniger Padding + kleineres Logo statt Overflow.
             Achtung: kein Groesser-Zeichen in diesem Kommentar, der Server
             escaped es im style-Tag und die Hydration bricht. */
          .hdr-wrap { padding-left: 12px !important; padding-right: 12px !important; }
          .hdr-logo { margin-right: 8px !important; }
          .hdr-logo img { width: 122px !important; }
          .hdr-mobile-only { gap: 3px !important; }
          .hdr-mobile-search { display: flex !important; }
          .hdr-top { border-bottom: 1px solid #e8e5e0; }
        }
      `}</style>

      <div className="hdr-wrap" style={{ maxWidth: 1280, margin: '0 auto', paddingLeft: 32, paddingRight: 32, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 58 }}>

          {/* ── Logo: klickbar zur Startseite ── */}
          {/* Logo verlinkt selbst auf "/" (Logo.tsx) - hier NICHT nochmal in
              einen Link wickeln, sonst <a> in <a> = Hydration-Fehler. */}
          <span className="hdr-logo" style={{ flexShrink: 0, marginRight: 16, display: 'inline-flex' }}>
            <Logo width={150} />
          </span>

          {/* ── Desktop: Kategorien + Search + Icons + Avatar ── */}
          <div className="hdr-desktop" style={{ flex: 1, alignItems: 'center', gap: 4 }}>

            {/* Kategorien (Mega-Menue) */}
            <button className="hdr-menu-btn" aria-expanded={megaMenuOpen} onClick={() => setMegaMenuOpen(!megaMenuOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              border: '1px solid #E4E0D8',
              borderRadius: 999, background: megaMenuOpen ? '#F4F4F2' : '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              color: INK, transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <AlignJustify size={15} />
              Kategorien
              <ChevronDown size={13} style={{ transform: megaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            <div style={{ flex: 1 }} />

            {/* Textmenues nach Rolle: Inserieren / Kaufen / Favoriten, dann
                Glocke + Chat, dann Profil. Nicht eingeloggt: alles fuehrt zum Login. */}
            <div ref={menusRef} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {[
                { key: 'inserieren', label: 'Inserieren', icon: Plus, honey: false, items: [
                  { href: '/listings/new', icon: Plus, label: 'Neues Inserat' },
                  { href: '/listings', icon: Tag, label: 'Meine Inserate' },
                  { href: '/sales', icon: ShoppingBag, label: 'Meine Verkäufe' },
                  { href: '/fees', icon: Receipt, label: 'Gebühren & Beiträge' },
                ] },
                { key: 'kaufen', label: 'Kaufen', icon: ShoppingBag, honey: false, items: [
                  { href: '/search', icon: Search, label: 'Stöbern' },
                  { href: '/purchases', icon: Receipt, label: 'Meine Käufe' },
                  { href: '/bids', icon: Gavel, label: 'Meine Gebote' },
                  { href: '/bookings', icon: CalendarDays, label: 'Buchungen' },
                ] },
                { key: 'favoriten', label: 'Favoriten', icon: Heart, honey: false, items: favSubItems },
              ].map(menu => {
                const open = openMenu === menu.key
                const MenuIcon = menu.icon
                return (
                  <div key={menu.key} style={{ position: 'relative' }}>
                    <button
                      onClick={() => { if (!user) { router.push('/login'); return; } setOpenMenu(open ? null : menu.key) }}
                      className={menu.honey ? 'cta-pill' : 'hdr-menu-btn'}
                      aria-expanded={open}
                      style={menu.honey
                        ? { display: 'inline-flex', alignItems: 'center', gap: 6, background: YELLOW, color: DARK, fontWeight: 700, fontSize: 13.5, padding: '9px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', marginRight: 4 }
                        : { display: 'inline-flex', alignItems: 'center', gap: 6, background: open ? '#F4F4F2' : 'transparent', color: INK, fontWeight: 600, fontSize: 13.5, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                    >
                      <MenuIcon size={16} strokeWidth={menu.honey ? 2.4 : 2} />
                      {menu.label}
                      <ChevronDown size={13} style={{ opacity: .7, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    {open && (
                      <div style={{ ...dropdownStyle, width: 220, padding: '6px 0' }}>
                        {menu.items.map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setOpenMenu(null)} className="hdr-menu-item" style={menuItemStyle}>
                            <item.icon size={16} style={{ color: '#888' }} />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="hdr-sep" />

              {/* Glocke + Chat: bleiben Symbole, die Zaehler brauchen den Platz */}
              {user ? <NotificationBell /> : <button className="hdr-icon-btn" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', transition: 'all 0.15s' }} onClick={() => router.push('/login')}><Bell size={20} /></button>}
              <button className="hdr-icon-btn" aria-current={pathname?.startsWith('/chat') ? 'page' : undefined} onClick={() => { if (!user) { router.push('/login'); return; } router.push('/chat') }} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', transition: 'all 0.15s', position: 'relative' }}>
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 12, background: '#c62828', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #fff' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              <div className="hdr-sep" />

              {/* Profil: Avatar + Vorname, Menue mit Hive (Level), Einstellungen, Admin, Abmelden */}
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenMenu(openMenu === 'profil' ? null : 'profil')}
                    className="hdr-menu-btn"
                    aria-expanded={openMenu === 'profil'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: openMenu === 'profil' ? '#F4F4F2' : 'transparent', color: INK, fontWeight: 600, fontSize: 13.5, padding: '4px 10px 4px 4px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                  >
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: YELLOW, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, color: DARK }}>{getInitials()}</span>
                    {displayName.split(' ')[0]}
                    <ChevronDown size={13} style={{ opacity: .7, transition: 'transform .15s', transform: openMenu === 'profil' ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {openMenu === 'profil' && (
                    <div style={{ ...dropdownStyle, width: 250, padding: '6px 0' }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0ede8' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: DARK, margin: 0 }}>{displayName}</p>
                        <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{user?.email}</p>
                        <div style={{ marginTop: 10 }}><NektarBadge /></div>
                      </div>
                      <div style={{ padding: '6px 0' }}>
                        <Link href="/hive" onClick={() => setOpenMenu(null)} className="hdr-menu-item" style={menuItemStyle}><Trophy size={16} style={{ color: '#888' }} /> Mein Hive</Link>
                        <Link href="/settings" onClick={() => setOpenMenu(null)} className="hdr-menu-item" style={menuItemStyle}><Settings size={16} style={{ color: '#888' }} /> Einstellungen</Link>
                        {canAdmin && <Link href="/admin" onClick={() => setOpenMenu(null)} className="hdr-menu-item" style={menuItemStyle}><ShieldCheck size={16} style={{ color: '#888' }} /> Admin Dashboard</Link>}
                      </div>
                      <div style={{ padding: '6px 0', borderTop: '1px solid #f0ede8' }}>
                        <button onClick={handleLogout} className="hdr-menu-item" style={{ ...menuItemStyle, color: '#999' }}><LogOut size={16} /> Abmelden</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hdr-menu-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: INK, fontWeight: 600, fontSize: 13.5, padding: '8px 10px', borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  <User size={16} /> Anmelden
                </Link>
              )}
            </div>
          </div>

          {/* ── Mobile Right: Avatar + Hamburger ── */}
          <div className="hdr-mobile-only" style={{ marginLeft: 'auto', alignItems: 'center', gap: 6 }}>
            {user && <NektarBadge />}
            {user && <NotificationBell />}
            {user && (
              <button onClick={() => setMobileOpen(!mobileOpen)}
                style={{ width: 34, height: 34, borderRadius: '50%', background: YELLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: DARK, border: 'none', cursor: 'pointer', boxShadow: mobileOpen ? `0 0 0 2px #fff, 0 0 0 4px ${YELLOW}` : 'none' }}>
                {getInitials()}
              </button>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {/* Mobile Suchpille: fuehrt zur Suchseite; Sparkles rechts oeffnet dort
            direkt das KI-Panel (getrennte Links, KEIN Link im Link) */}
        {pathname !== '/search' && (
          <div className="hdr-mobile-search" style={{ display: 'none', alignItems: 'center', background: '#F2EEE7', borderRadius: 999, margin: '0 0 10px' }}>
            <Link href="/search" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', textDecoration: 'none', color: '#8A8580', fontSize: 14, fontWeight: 500 }}>
              <Search size={16} style={{ flexShrink: 0 }} /> Was suchst du?
            </Link>
          </div>
        )}
        <MegaMenu open={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="hdr-mobile-only" style={{ borderTop: '1px solid #e8e5e0', background: '#fff', flexDirection: 'column', maxHeight: 'calc(100vh / var(--bd-zoom, 1) - 64px)', overflowY: 'auto' }}>
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
          {/* Suchfeld bewusst NICHT hier: mobil sucht man ueber den
              Suche-Tab der Bottom-Nav, das Feld sitzt oben auf /search */}
          <div style={{ padding: '8px 12px 0' }}>
            {[
              { href: '/search', icon: ShoppingBag, label: 'Stöbern' },
              { href: '/how-it-works', icon: Star, label: 'So funktionierts' },
            ].map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', fontSize: 15, fontWeight: 600, color: '#333', textDecoration: 'none', borderRadius: 12 }}>
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
                { href: '/fees', icon: Receipt, label: 'Gebühren & Beiträge' },
                { href: '/favorites', icon: Heart, label: 'Favoriten' },
                { href: '/settings', icon: Settings, label: 'Einstellungen' },
                ...(canAdmin ? [{ href: '/admin', icon: ShieldCheck, label: 'Admin Dashboard' }] : []),
              ].map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', fontSize: 15, fontWeight: 600, color: '#333', textDecoration: 'none', borderRadius: 12 }}>
                  <link.icon size={18} style={{ color: '#999' }} />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: 'transparent', border: '1.5px solid #e8e5e0', color: '#999', fontWeight: 600, fontSize: 14, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                <LogOut size={16} /> Abmelden
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: '#fff', border: '1.5px solid #e8e5e0', color: DARK, fontWeight: 600, fontSize: 14, borderRadius: 12, textDecoration: 'none' }}>
                <User size={16} /> Anmelden
              </Link>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ── Zeile 2: Suche ueber die volle Breite (nur Desktop) ── */}
      <div className="hdr-searchrow hdr-desktop">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4px 32px 10px', width: '100%', boxSizing: 'border-box' }}>
            {/* Klar-Look Suchleiste: runde Chip-Pille, Honey-Knopf innen */}
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', background: '#fff', border: `2px solid ${kiModus ? KI_FARBE : YELLOW}`, borderRadius: 999, overflow: 'hidden', height: 48, transition: 'border-color .15s' }}>
                <Search size={18} style={{ marginLeft: 18, alignSelf: 'center', color: '#8A8580', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  className="pille-input"
                  type="text"
                  value={searchQuery}
                  onChange={e => handleQueryChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setShowSuggestions(false) } }}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={kiModus ? 'Beschreib, was du suchst: Rennvelo unter 300 Franken, etwas zum Spielen aus den 90ern' : 'Was suchst du?'}
                  style={{ flex: 1, padding: '0 12px', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', color: DARK, background: 'transparent', minWidth: 0 }}
                />
                {/* KI-Schalter: an = Enter/Suchen beschreiben statt Wortsuche */}
                <button
                  type="button"
                  onClick={toggleKi}
                  aria-pressed={kiModus}
                  title={kiModus ? 'KI-Suche an: Enter sucht nach der Bedeutung' : 'KI-Suche aus: Enter sucht nach Wörtern'}
                  style={{ alignSelf: 'center', marginRight: 8, display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 11px', borderRadius: 999, border: `1.5px solid ${kiModus ? KI_FARBE : '#D8D3CB'}`, background: kiModus ? KI_FARBE : '#fff', color: kiModus ? '#fff' : '#6B655F', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }}
                >
                  <Sparkles size={14} /> KI {kiModus ? 'an' : 'aus'}
                </button>
                <button className="eckig" onClick={() => { handleSearch(); setShowSuggestions(false) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 26px', background: kiModus ? KI_FARBE : YELLOW, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 15, color: kiModus ? '#fff' : DARK, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background .15s' }}>
                  {kiModus ? <Sparkles size={17} strokeWidth={2.5} /> : <Search size={17} strokeWidth={2.5} />} Suchen
                </button>
              </div>

              {/* Autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1px solid #e8e5e0', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,.08)', marginTop: 6, overflow: 'hidden' }}>
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

        </div>
      </div>
    </header>
  )
}
