'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { ChevronRight } from 'lucide-react'

const YELLOW = '#F4C03F'
const DARK = '#191615'
const BODY = "'Manrope', system-ui, sans-serif"
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif"

// Subtle background tints for category circles
const circleTints = [
  '#EDE7F6', '#E8F5E9', '#FFF3E0', '#E3F2FD', '#FCE4EC',
  '#F3E5F5', '#E0F2F1', '#FFF8E1', '#F1F8E9', '#EFEBE9',
  '#EDE7F6', '#E8F5E9', '#FFF3E0', '#E3F2FD', '#FCE4EC',
]

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
        .cat-circles { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .cat-circles::-webkit-scrollbar { display: none; }
        .cat-circle-item:hover .cat-circle-icon { transform: scale(1.05); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        @media (max-width: 767px) {
          .cat-header { padding: 0 4px !important; }
          .cat-header h2 { font-size: 20px !important; }
          .cat-circles { gap: 16px !important; }
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
        display: 'flex', gap: 20,
        paddingBottom: 8,
      }}>
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.slug}`}
            className="cat-circle-item"
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8,
              textDecoration: 'none', color: 'inherit',
              flexShrink: 0,
              width: 88,
            }}
          >
            <div className="cat-circle-icon" style={{
              width: 64, height: 64, borderRadius: '50%',
              background: circleTints[i % circleTints.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              <CategoryIcon name={cat.icon || 'Package'} size={26} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, fontFamily: BODY,
              color: '#555', textAlign: 'center',
              lineHeight: 1.25,
              width: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}>
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
