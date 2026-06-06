import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="no-print"><Header /></div>
      <main className="min-h-screen">{children}</main>
      <div className="no-print"><Footer /></div>
    </>
  )
}
