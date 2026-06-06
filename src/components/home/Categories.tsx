'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { colors, fonts, radius } from '@/lib/theme'

export function Categories() {
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, icon, sort_order')
        .is('parent_id', null)
        .order('sort_order')
      setCategories(data || [])
    }
    load()
  }, [])

  if (!categories.length) return null

  return (
    <section style={{ padding: '48px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 6, background: '#FDF6E3', color: '#D4A020', fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Entdecken
        </span>
        <h2 style={{
          fontSize: 36, fontWeight: 800, fontFamily: fonts.head,
          margin: 0, color: colors.dark,
          letterSpacing: '-0.025em',
        }}>
          In Kategorien <span style={{ color: '#F4C03F' }}>stöbern</span>
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 12,
      }}>
        {/* Alle Kategorien Kachel */}
        <Link href="/search" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '20px 12px', borderRadius: radius.md,
            background: colors.dark, border: `1px solid ${colors.dark}`,
            textAlign: 'center', height: '100%', minHeight: 110,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,.15)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CategoryIcon name="Package" size={22} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, fontFamily: fonts.body,
              color: '#fff', lineHeight: 1.3,
            }}>
              Alle Kategorien
            </span>
          </div>
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '20px 12px', borderRadius: radius.md,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                transition: 'all .15s', cursor: 'pointer',
                textAlign: 'center', height: '100%', minHeight: 110,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = colors.yellow
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = '0 4px 12px rgba(0,0,0,.06)'
                const icon = el.querySelector('[data-icon]') as HTMLElement
                if (icon) { icon.style.background = colors.yellow; icon.style.color = colors.dark }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = colors.border
                el.style.transform = 'none'
                el.style.boxShadow = 'none'
                const icon = el.querySelector('[data-icon]') as HTMLElement
                if (icon) { icon.style.background = colors.warm; icon.style.color = colors.muted }
              }}
            >
              <div
                data-icon
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: colors.warm, color: colors.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}
              >
                <CategoryIcon name={cat.icon} size={22} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, fontFamily: fonts.body,
                color: colors.dark, lineHeight: 1.3,
              }}>
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
