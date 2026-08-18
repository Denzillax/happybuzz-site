import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

// Minimal-Rahmen fuer Rechtsseiten (Impressum/AGB/Datenschutz): bewusst OHNE
// SiteGate und ohne Marktplatz-Header/-Footer. So sind die Seiten auch
// waehrend Beta-Sperre und Wartung erreichbar (Impressumspflicht), bieten
// aber keine Navigation in den gesperrten Rest der Seite.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9F4EC' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e5e0', padding: '14px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo width={140} />
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#0B5E5C', textDecoration: 'none' }}>Zu beedaro.ch</Link>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ background: '#fff', borderTop: '1px solid #e8e5e0', padding: '14px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#888' }}>© 2026 BEEDARO, eine Marke von MOQRO by Denis Mihaljevic · CHE-237.380.784</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <Link href="/terms" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>AGB</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Datenschutz</Link>
            <Link href="/imprint" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Impressum</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
