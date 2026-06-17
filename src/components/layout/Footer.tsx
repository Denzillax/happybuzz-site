'use client'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

const MONO = "'Space Mono', ui-monospace, monospace"

const links = {
  marktplatz: [
    { label: 'Stöbern', href: '/search' },
    { label: 'Inserieren', href: '/listings/new' },
    { label: 'So funktionierts', href: '/how-it-works' },
  ],
  unternehmen: [
    { label: 'Über BEEDARO', href: '/about' },
    { label: 'Bee-Impact', href: '/impact' },
    { label: 'Jobs', href: '/about#jobs' },
  ],
  support: [
    { label: 'Hilfe & FAQ', href: '/help' },
    { label: 'Kontakt', href: '/contact' },
    { label: 'Datenschutz', href: '/privacy' },
  ],
}

export function Footer() {
  return (
    <footer style={{ background: '#14110D', color: '#fff' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 24px' }}>
        {/* Top Grid */}
        <div className="ftr-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <Logo width={170} white />
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginTop: 16, maxWidth: 280 }}>
              Secondhand, aber mit Haltung. Der Schweizer Marktplatz für Dinge mit Geschichte.
            </p>
            <p style={{ fontSize: 13, color: '#555', marginTop: 16, lineHeight: 1.5 }}>
              Gemeindehausstrasse 11B<br />
              6010 Kriens, Schweiz
            </p>
          </div>

          {/* Marktplatz */}
          <div>
            <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: 'rgba(251,248,242,0.92)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>
              Marktplatz
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.marktplatz.map(l => (
                <li key={l.href} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: '#888', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#F4C03F'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: 'rgba(251,248,242,0.92)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>
              Über uns
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.unternehmen.map(l => (
                <li key={l.href} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: '#888', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#F4C03F'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: 'rgba(251,248,242,0.92)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.support.map(l => (
                <li key={l.href} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: '#888', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#F4C03F'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="ftr-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
            © 2026 BEEDARO. Alle Rechte vorbehalten.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/terms" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>AGB</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>Datenschutz</Link>
            <Link href="/imprint" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>Impressum</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
