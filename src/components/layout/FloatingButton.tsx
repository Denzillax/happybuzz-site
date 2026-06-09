'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const YELLOW = '#F4C03F'
const DARK = '#191615'

export function FloatingButton() {
  const [hover, setHover] = useState(false)
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/listings/new')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fab-btn"
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 40,
        width: 56, height: 56, borderRadius: '50%',
        background: YELLOW, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hover
          ? '0 8px 28px rgba(244,192,63,0.5)'
          : '0 4px 16px rgba(244,192,63,0.35)',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.2s ease',
      }}
    >
      <Plus size={26} color={DARK} strokeWidth={2.5} />
    </button>
  )
}
