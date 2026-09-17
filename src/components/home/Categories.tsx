'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Wischleiste: Pfeile und Ausblend-Raender nur, wo es weitergeht
  const rowRef = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const [less, setLess] = useState(false)
  const messen = () => {
    const el = rowRef.current; if (!el) return
    setLess(el.scrollLeft > 4)
    setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }
  useEffect(() => {
    messen()
    const el = rowRef.current
    el?.addEventListener('scroll', messen, { passive: true })
    window.addEventListener('resize', messen)
    return () => { el?.removeEventListener('scroll', messen); window.removeEventListener('resize', messen) }
  }, [categories.length])
  const schieben = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * Math.max(240, rowRef.current.clientWidth * 0.7), behavior: 'smooth' })

  if (!categories.length) return null

  const kuratiert = KURATIERT
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean)
  const rest = categories.filter((c) => !KURATIERT.includes(c.slug))
  const shown = [...kuratiert, ...rest]


  return (
    <section style={{ padding: '10px 24px 6px', maxWidth: 1280, margin: '0 auto' }}>
      <div className={'cat-pills-wrap' + (more ? ' has-more' : '') + (less ? ' has-less' : '')}>
      {less && <button type="button" className="cat-scroll-btn left" aria-label="Kategorien zurück" onClick={() => schieben(-1)}><ChevronLeft size={16} /></button>}
      {more && <button type="button" className="cat-scroll-btn right" aria-label="Weitere Kategorien" onClick={() => schieben(1)}><ChevronRight size={16} /></button>}
      <div className="cat-pills" ref={rowRef}>
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
      </div>
    </section>
  )
}
