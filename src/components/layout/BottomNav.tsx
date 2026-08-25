'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { Home, Search, Plus, Heart, User } from 'lucide-react'

const YELLOW = '#F4C03F'
const DARK = '#191615'

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

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid #e8e5e0',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        maxWidth: 480, margin: '0 auto', height: 56,
      }}>
        {tabs.map(tab => {
          const active = isActive(tab.href)

          if (tab.isCenter) {
            return (
              <button key={tab.href} onClick={() => router.push(tab.href)} aria-label="Inserieren" style={{
                width: 50, height: 50, borderRadius: '50%',
                background: YELLOW, border: '3px solid #fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(244,192,63,0.45)',
                transform: 'translateY(-8px)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
                <Plus size={26} color={DARK} strokeWidth={2.5} />
              </button>
            )
          }

          if (tab.isProfile && user) {
            return (
              <button key={tab.href} onClick={() => router.push(tab.href)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: active ? YELLOW : '#e8e5e0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: active ? DARK : '#888',
                  transition: 'all 0.15s',
                }}>
                  {getInitials()}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? DARK : '#999', fontFamily: 'inherit' }}>
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <button key={tab.href} onClick={() => router.push(tab.href)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
              transition: 'all 0.15s',
            }}>
              <tab.icon size={22} color={active ? DARK : '#999'} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? DARK : '#999', fontFamily: 'inherit' }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
