'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

const YELLOW = '#F4C03F'
const DARK = '#191615'

export function FloatingButton() {
  const [hover, setHover] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Auf den Inserat-Formular-Routen ausblenden (redundant + kollidiert mit Sticky-Bar)
  if (pathname === '/listings/new' || pathname?.endsWith('/edit') || pathname?.startsWith('/chat')) return null

  return (
    <button
      onClick={() => router.push('/listings/new')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fab-btn"
      aria-label="Inserieren"
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 40,
        width: hover ? 160 : 50, height: 50, borderRadius: 999,
        background: YELLOW, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: hover ? 8 : 0, padding: 0, whiteSpace: 'nowrap',
        boxShadow: hover
          ? '0 8px 28px rgba(244,192,63,0.5)'
          : '0 4px 16px rgba(244,192,63,0.35)',
        transition: 'width 0.28s cubic-bezier(.34,1.56,.64,1), gap 0.28s ease, box-shadow 0.28s ease',
      }}
    >
      <Plus
        size={22} color={DARK} strokeWidth={2.5}
        style={{ flexShrink: 0, transition: 'transform 0.28s ease', transform: hover ? 'rotate(90deg)' : 'none' }}
      />
      <span style={{
        color: DARK, fontWeight: 800, fontSize: 15,
        fontFamily: "'Manrope', sans-serif",
        maxWidth: hover ? 120 : 0, opacity: hover ? 1 : 0,
        overflow: 'hidden', transition: 'max-width 0.28s ease, opacity 0.2s ease',
      }}>Inserieren</span>
    </button>
  )
}
