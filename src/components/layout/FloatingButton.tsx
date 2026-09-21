'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

const YELLOW = '#F4C03F'

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
        // Meeko (Denis 20.09.2026: nicht in Butter): dunkler Hauptknopf wie "Inserieren" in Header, Fuss und Bottom-Nav
        background: '#F4C03F', border: '1px solid #1D1D1D', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: hover ? 8 : 0, padding: 0, whiteSpace: 'nowrap',
        boxShadow: 'inset 0 -4px 0 rgba(29,29,29,.16)',
        transition: 'width 0.28s cubic-bezier(.34,1.56,.64,1), gap 0.28s ease, box-shadow 0.28s ease',
      }}
    >
      <Plus
        size={22} color="#1D1D1D" strokeWidth={2.5}
        style={{ flexShrink: 0, transition: 'transform 0.28s ease', transform: hover ? 'rotate(90deg)' : 'none' }}
      />
      <span style={{
        color: '#1D1D1D', fontWeight: 600, fontSize: 15,
        fontFamily: "'Instrument Sans', 'Manrope', sans-serif",
        maxWidth: hover ? 120 : 0, opacity: hover ? 1 : 0,
        overflow: 'hidden', transition: 'max-width 0.28s ease, opacity 0.2s ease',
      }}>Inserieren</span>
    </button>
  )
}
