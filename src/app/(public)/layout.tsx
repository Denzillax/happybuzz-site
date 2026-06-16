import { Header } from '@/components/layout/Header'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { FloatingButton } from '@/components/layout/FloatingButton'
import { BannedGate } from '@/components/layout/BannedGate'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="no-print"><AnnouncementBar /></div>
      <div className="no-print"><Header /></div>
      <main className="min-h-screen">{children}</main>
      <div className="no-print"><Footer /></div>
      <div className="no-print fab-desktop-only"><FloatingButton /></div>
      <div className="no-print bottom-nav-mobile"><BottomNav /></div>
      <BannedGate />
    </>
  )
}
