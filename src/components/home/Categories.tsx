'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { ChevronRight } from 'lucide-react'
import { colors, fonts } from '@/lib/theme'

const YELLOW = colors.yellow
const DARK = colors.dark
const BODY = fonts.body
const HEAD = fonts.head

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
    <section style={{ padding: '40px 24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .cat-circle-item:hover .cat-circle-icon { background: ${colors.teal}; border-color: ${colors.teal}; color: #fff; transform: scale(1.05); box-shadow: 0 6px 16px rgba(14,148,147,.25); }
        .cat-circle-item:hover .cat-circle-label { color: ${colors.teal}; }
        @media (max-width: 767px) {
          .cat-header { padding: 0 4px !important; }
          .cat-header h2 { font-size: 20px !important; }
          .cat-circles { gap: 16px 12px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="cat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: HEAD, color: DARK, margin: 0 }}>
          Kategorien
        </h2>
        <Link href="/search" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 14, fontWeight: 600, color: YELLOW,
          textDecoration: 'none', fontFamily: BODY,
        }}>
          Alle Kategorien <ChevronRight size={16} />
        </Link>
      </div>

      {/* Horizontal scrollable circles */}
      <div className="cat-circles" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: 24,
      }}>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.slug}`}
            className="cat-circle-item"
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8,
              textDecoration: 'none', color: 'inherit',
              flexShrink: 0,
              width: 100,
            }}
          >
            <div className="cat-circle-icon" style={{
              width: 64, height: 64, borderRadius: '50%',
              background: colors.sand,
              border: `1px solid ${colors.borderLt}`,
              color: colors.dark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              <CategoryIcon name={cat.icon || 'Package'} size={26} />
            </div>
            <span lang="de" className="cat-circle-label" style={{
              fontSize: 11, fontWeight: 600, fontFamily: BODY,
              color: colors.muted, textAlign: 'center',
              transition: 'color 0.2s ease',
              lineHeight: 1.25,
              width: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              hyphens: 'auto',
              overflowWrap: 'break-word',
            }}>
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
