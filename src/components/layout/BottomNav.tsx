'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { Home, Search, Plus, Heart, User } from 'lucide-react'
import BLogo from '@/components/shared/BLogo'


export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const getInitials = () => {
    const name = user?.user_metadata?.full_name
    if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const tabs = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Suche' },
    { href: '/listings/new', icon: Plus, label: 'Inserieren', isCenter: true },
    { href: '/favorites', icon: Heart, label: 'Favoriten' },
    { href: user ? '/settings' : '/login', icon: User, label: 'Profil', isProfile: true },
  ]

  // Meeko-Design (20.09.2026): weisse Leiste mit Ink-Linie, aktiver Reiter auf einer Butter-Pille. Home ist das kachelige B,
  // Favoriten dasselbe B um 90 Grad gedreht als Herz, Inserieren ein dunkler Knopf. Styles: globals.css, BOTTOM-NAV MEEKO (bn-*).
  return (
    <nav className="bn" aria-label="Hauptnavigation">
      <div className="bn-reihe">
        {tabs.map(tab => {
          const active = isActive(tab.href)
          if (tab.isCenter) {
            return (
              <button key={tab.href} className="bn-plus eckig kein-akzent" onClick={() => router.push(tab.href)} aria-label="Inserieren">
                <Plus size={24} strokeWidth={2.4} />
              </button>
            )
          }
          return (
            <button key={tab.href} className="bn-tab eckig kein-akzent" aria-current={active ? 'page' : undefined} onClick={() => router.push(tab.href)}>
              <span className="bn-icon">
                {tab.isProfile && user ? <span className="bn-initialen">{getInitials()}</span>
                  : tab.href === '/' ? <BLogo size={19} title="" />
                  : tab.href === '/favorites' ? <BLogo herz size={18} title="" />
                  : <tab.icon size={21} strokeWidth={active ? 2.7 : 1.8} />}
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
