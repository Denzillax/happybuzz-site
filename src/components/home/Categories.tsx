'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { colors, fonts } from '@/lib/theme'
import { SectionHeader } from './SectionHeader'

const BODY = fonts.body

// Auf der Startseite nur die wichtigsten Kategorien zeigen (Rest via "Alle Kategorien")
const SHOWN = 8

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

  // Wichtigste Kategorien + Dienstleistungen (Differenzierungs-Kategorie) immer zeigen
  const shown = categories.slice(0, SHOWN)
  const service = categories.find((c) => c.slug === 'dienstleistungen')
  if (service && !shown.some((c) => c.id === service.id)) shown.push(service)
  // Tierbedarf ist neu im Katalog: immer zeigen und markieren
  const tierbedarf = categories.find((c) => c.slug?.startsWith('tierbedarf'))
  if (tierbedarf && !shown.some((c) => c.id === tierbedarf.id)) shown.push(tierbedarf)

  return (
    <section style={{ padding: '40px 24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .cat-circle-item:hover .cat-circle-icon { background: ${colors.teal}; color: #fff; transform: scale(1.06); }
        .cat-circle-item:hover .cat-circle-label { color: ${colors.teal}; }
        @media (max-width: 767px) {
          .cat-circles { gap: 22px 14px !important; }
        }
      `}</style>

      {/* Header */}
      <SectionHeader title="Kategorien" href="/search" linkLabel="Alle Kategorien" />

      {/* Horizontal scrollable circles */}
      <div className="cat-circles" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: 32,
      }}>
        {shown.map((cat) => (
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
            <div style={{ position: 'relative' }}>
              <div className="cat-circle-icon" style={{
                width: 64, height: 64, borderRadius: '50%',
                background: colors.greenSoft,
                color: colors.teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                <CategoryIcon name={cat.icon || 'Package'} size={26} />
              </div>
              {cat.slug?.startsWith('tierbedarf') && (
                <span style={{
                  position: 'absolute', top: -4, right: -10,
                  fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  fontFamily: "'Space Mono', monospace",
                  background: colors.yellow, color: colors.dark,
                  border: `1px solid ${colors.dark}`, padding: '2px 6px',
                }}>
                  Neu
                </span>
              )}
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
