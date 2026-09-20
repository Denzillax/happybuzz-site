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
import BLogo from '@/components/shared/BLogo'
import { getMyRole } from '@/lib/staff'


const KI_KEY = 'beedaro_ki_suche'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
  // Textmenues oben rechts (Ricardo-Vorbild, Denis 15.09.): genau eines offen
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menusRef = useRef<HTMLDivElement>(null)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [canAdmin, setCanAdmin] = useState(false)

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
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
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

  const favSubItems = [
    { href: '/favorites', icon: Package, label: 'Artikel' },
    { href: '/favorites?tab=sellers', icon: UserCheck, label: 'Verkäufer' },
    { href: '/favorites?tab=searches', icon: Search, label: 'Suchen' },
  ]

  // Meeko-Design (20.09.2026): nur das Aussehen ist neu, alle Zustände, Menüs und Wege oben sind unverändert.
  // Eine schwebende weisse Pille mit 1 px Ink-Rand trägt Marke, Kategorien, Suche, Menüs, Glocke, Chat und Profil.
  // Die frühere zweite Zeile (Suche über die volle Breite) sitzt jetzt in der Pille. Styles: globals.css, Block HEADER MEEKO (hd-*).
  const avatar = (gross: boolean) => <span className={gross ? 'hd-avatar hd-avatar-gross' : 'hd-avatar'}>{getInitials()}</span>
  const textMenus = [
    { key: 'inserieren', label: 'Inserieren', icon: Plus, items: [
      { href: '/listings/new', icon: Plus, label: 'Neues Inserat' },
      { href: '/listings', icon: Tag, label: 'Meine Inserate' },
      { href: '/sales', icon: ShoppingBag, label: 'Meine Verkäufe' },
      { href: '/fees', icon: Receipt, label: 'Gebühren & Beiträge' },
    ] },
    { key: 'kaufen', label: 'Kaufen', icon: ShoppingBag, items: [
      { href: '/search', icon: Search, label: 'Stöbern' },
      { href: '/purchases', icon: Receipt, label: 'Meine Käufe' },
      { href: '/bids', icon: Gavel, label: 'Meine Gebote' },
      { href: '/bookings', icon: CalendarDays, label: 'Buchungen' },
    ] },
    { key: 'favoriten', label: 'Favoriten', icon: Heart, items: favSubItems },
  ]

  return (
    <header className="hd">
      <div className={user ? "hd-pille hdr-wrap hd-eingeloggt" : "hd-pille hdr-wrap"}>
        {/* Logo verlinkt selbst auf "/" (Logo.tsx) - hier NICHT nochmal in einen Link wickeln, sonst <a> in <a> = Hydration-Fehler. */}
        <span className="hd-logo"><Logo width={132} /></span>

        {/* ── Desktop ── */}
        <div className="hd-desktop">
          <button className="hd-knopf eckig kein-akzent" aria-expanded={megaMenuOpen} onClick={() => setMegaMenuOpen(!megaMenuOpen)}>
            <AlignJustify size={16} />
            <span className="hd-lbl">Kategorien</span>
            <ChevronDown size={13} style={{ transform: megaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>

          {/* Suche mit KI-Schalter und Kategorie-Vorschlägen */}
          <div className="hd-suche-wrap">
            <div className={kiModus ? 'hd-suche hd-suche-ki' : 'hd-suche'}>
              <Search size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                className="pille-input"
                type="text"
                value={searchQuery}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setShowSuggestions(false) } }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={kiModus ? 'Beschreib, was du suchst: Rennvelo unter 300 Franken' : 'Was suchst du?'}
                aria-label="Suchbegriff"
              />
              {/* KI-Schalter: an = Enter/Suchen beschreiben statt Wortsuche */}
              <button type="button" onClick={toggleKi} aria-pressed={kiModus} className="hd-ki eckig kein-akzent"
                title={kiModus ? 'KI-Suche an: Enter sucht nach der Bedeutung' : 'KI-Suche aus: Enter sucht nach Wörtern'}>
                <Sparkles size={13} /> KI {kiModus ? 'an' : 'aus'}
              </button>
              <button className="hd-suchen eckig kein-akzent" aria-label="Suchen" onClick={() => { handleSearch(); setShowSuggestions(false) }}>
                {kiModus ? <Sparkles size={16} strokeWidth={2.4} /> : <Search size={16} strokeWidth={2.4} />}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="hd-klapp hd-vorschlaege">
                <div className="hd-klapp-titel">Kategorien</div>
                {suggestions.map(cat => (
                  <button key={cat.id} className="hd-punkt eckig kein-akzent"
                    onMouseDown={(e) => { e.preventDefault(); router.push(`/search?category=${cat.slug}`); setShowSuggestions(false); setSearchQuery('') }}>
                    <Search size={14} />
                    <span>{cat.name}</span>
                    {cat.parent_id && <span className="hd-leise">in Kategorie</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Textmenüs nach Rolle: Inserieren / Kaufen / Favoriten, dann Glocke + Chat, dann Profil.
              Nicht eingeloggt: alles führt zum Login. */}
          <div ref={menusRef} className="hd-menues">
            {textMenus.map(menu => {
              const open = openMenu === menu.key
              const MenuIcon = menu.icon
              return (
                <div key={menu.key} style={{ position: 'relative' }}>
                  <button className="hd-text eckig kein-akzent" aria-expanded={open} title={menu.label}
                    onClick={() => { if (!user) { router.push('/login'); return; } setOpenMenu(open ? null : menu.key) }}>
                    {menu.key === 'favoriten' ? <BLogo herz size={15} title="" /> : <MenuIcon size={16} strokeWidth={2} />}
                    <span className="hd-lbl">{menu.label}</span>
                    <ChevronDown className="hd-lbl" size={13} style={{ opacity: .7, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {open && (
                    <div className="hd-klapp" style={{ width: 230 }}>
                      {menu.items.map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setOpenMenu(null)} className="hd-punkt">
                          <item.icon size={16} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="hd-sep" />

            {/* Glocke + Chat: bleiben Symbole, die Zähler brauchen den Platz */}
            {user ? <NotificationBell /> : <button className="hd-icon eckig kein-akzent" aria-label="Benachrichtigungen" onClick={() => router.push('/login')}><Bell size={20} /></button>}
            <button className="hd-icon eckig kein-akzent" aria-label="Nachrichten" aria-current={pathname?.startsWith('/chat') ? 'page' : undefined} onClick={() => { if (!user) { router.push('/login'); return; } router.push('/chat') }}>
              <MessageCircle size={20} />
              {unreadCount > 0 && <span className="hd-zahl">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            <div className="hd-sep" />

            {/* Profil: Avatar + Vorname, Menü mit Hive (Level), Einstellungen, Admin, Abmelden */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button className="hd-text hd-profil eckig kein-akzent" aria-expanded={openMenu === 'profil'} onClick={() => setOpenMenu(openMenu === 'profil' ? null : 'profil')}>
                  {avatar(false)}
                  <span className="hd-lbl">{displayName.split(' ')[0]}</span>
                  <ChevronDown size={13} style={{ opacity: .7, transition: 'transform .15s', transform: openMenu === 'profil' ? 'rotate(180deg)' : 'none' }} />
                </button>
                {openMenu === 'profil' && (
                  <div className="hd-klapp" style={{ width: 260 }}>
                    <div className="hd-klapp-kopf">
                      <p className="hd-name">{displayName}</p>
                      <p className="hd-mail">{user?.email}</p>
                      <div style={{ marginTop: 10 }}><NektarBadge /></div>
                    </div>
                    <Link href="/hive" onClick={() => setOpenMenu(null)} className="hd-punkt"><Trophy size={16} /> Mein Hive</Link>
                    <Link href="/settings" onClick={() => setOpenMenu(null)} className="hd-punkt"><Settings size={16} /> Einstellungen</Link>
                    {canAdmin && <Link href="/admin" onClick={() => setOpenMenu(null)} className="hd-punkt"><ShieldCheck size={16} /> Admin Dashboard</Link>}
                    <div className="hd-linie" />
                    <button onClick={handleLogout} className="hd-punkt eckig kein-akzent"><LogOut size={16} /> Abmelden</button>
                  </div>
                )}
              </div>
            ) : (
              /* Ausgeloggt (Denis 20.09.2026): nur das Symbol, im selben Kreis, in dem nach dem Anmelden das Profilbild sitzt */
              <Link href="/login" className="hd-anmelden" aria-label="Anmelden" title="Anmelden"><span className="hd-avatar"><User size={17} strokeWidth={2.1} /></span></Link>
            )}
          </div>
        </div>

        {/* ── Handy rechts: Nektar, Glocke, Avatar, Menü ── */}
        <div className="hd-mobil">
          {user && <NektarBadge />}
          {user && <NotificationBell />}
          <button className="hd-knopf hd-menue-knopf eckig kein-akzent" aria-label={mobileOpen ? 'Menü schliessen' : 'Menü öffnen'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="hd-unter">
        {/* Suchfeld am Handy: führt zur Suchseite */}
        {pathname !== '/search' && !mobileOpen && (
          <Link href="/search" className="hd-msuche"><Search size={16} style={{ flexShrink: 0 }} /> Was suchst du?</Link>
        )}
        <MegaMenu open={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

        {/* ── Menü am Handy ── */}
        {mobileOpen && (
          <div className="hd-mmenue">
            {user && (
              <div className="hd-mkopf">
                {avatar(true)}
                <div style={{ minWidth: 0 }}>
                  <p className="hd-name">{displayName}</p>
                  <p className="hd-mail">{user.email}</p>
                </div>
              </div>
            )}
            {/* Suchfeld bewusst NICHT hier: mobil sucht man über den Suche-Tab der Bottom-Nav, das Feld sitzt oben auf /search */}
            {[{ href: '/search', icon: ShoppingBag, label: 'Stöbern' }, { href: '/how-it-works', icon: Star, label: 'So funktionierts' }].map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="hd-mpunkt"><link.icon size={18} />{link.label}</Link>
            ))}
            {user && <div className="hd-linie" />}
            {user && [
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
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="hd-mpunkt"><link.icon size={18} />{link.label}</Link>
            ))}
            <div className="hd-mschluss">
              {user ? (
                <button className="hd-knopf eckig kein-akzent" onClick={() => { handleLogout(); setMobileOpen(false); }}><LogOut size={16} /> Abmelden</button>
              ) : (
                <Link href="/login" className="hd-knopf hd-knopf-dunkel" onClick={() => setMobileOpen(false)}><User size={16} /> Anmelden</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
