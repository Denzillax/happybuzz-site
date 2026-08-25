'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { fonts } from '@/lib/theme'

const BODY = fonts.body
const INK = '#191615'
const CHIP = '#F2EEE7'
const HONEY = '#F4C03F'

// Klar-Look: eine wischbare Pill-Zeile mit ALLEN Hauptkategorien.
// Kuratierte Reihenfolge vorne, Rest nach sort_order hinten dran.
const KURATIERT = [
  'elektronik-computer',
  'games-spielkonsolen',
  'kleidung-accessoires',
  'haushalt-wohnen',
  'handwerk-garten',
  'kind-baby',
  'dienstleistungen',
  'tierbedarf-haustiere',
]

export function Categories() {
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, icon, sort_order')
        .is('parent_id', null)
        .neq('is_active', false)
        .order('sort_order')
      setCategories(data || [])
    }
    load()
  }, [])

  if (!categories.length) return null

  const kuratiert = KURATIERT
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean)
  const rest = categories.filter((c) => !KURATIERT.includes(c.slug))
  const shown = [...kuratiert, ...rest]

  return (
    <section style={{ padding: '10px 24px 6px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="cat-pills">
        {shown.map((cat) => (
          <Link key={cat.id} href={`/search?category=${cat.slug}`} className="cat-pill" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: CHIP, color: INK, textDecoration: 'none',
            fontFamily: BODY, fontSize: 13, fontWeight: 600,
            padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'background .15s ease',
          }}>
            <CategoryIcon name={cat.icon || 'Package'} size={15} />
            {cat.name}
          </Link>
        ))}
        <Link href="/search" className="cat-pill" style={{
          display: 'inline-flex', alignItems: 'center',
          background: '#fff', color: INK, textDecoration: 'none',
          fontFamily: BODY, fontSize: 13, fontWeight: 600,
          padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
          border: '1px solid #E4E0D8',
        }}>
          Alle Kategorien
        </Link>
      </div>
    </section>
  )
}
