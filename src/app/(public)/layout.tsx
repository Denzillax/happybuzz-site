import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { FloatingButton } from '@/components/layout/FloatingButton'
import { BannedGate } from '@/components/layout/BannedGate'
import SiteGate from '@/components/shared/SiteGate'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // SiteGate: Betriebsmodus live/beta/wartung (Admin → Übersicht).
    // /login liegt ausserhalb dieses Layouts und bleibt immer erreichbar.
    <SiteGate>
      <div className="no-print"><AnnouncementBar /></div>
      {/* Suspense: Header nutzt useSearchParams — nötig für statisches Prerendering */}
      <div className="no-print"><Suspense fallback={<div style={{ height: 64 }} />}><Header /></Suspense></div>
      <main className="min-h-screen">{children}</main>
      <div className="no-print"><Footer /></div>
      <div className="no-print fab-desktop-only"><FloatingButton /></div>
      <div className="no-print bottom-nav-mobile"><BottomNav /></div>
      <BannedGate />
    </SiteGate>
  )
}
