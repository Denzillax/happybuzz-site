'use client'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

const MONO = "'Manrope', sans-serif"

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
    <footer style={{ background: '#FFFFFF', color: '#191615', borderTop: '1px solid #E4E0D8' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 24px' }}>
        {/* Top Grid */}
        <div className="ftr-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <Logo width={170} />
            <p style={{ fontSize: 14, color: 'rgba(25,22,21,.6)', lineHeight: 1.6, marginTop: 16, maxWidth: 280 }}>
              Secondhand mit Haltung. Der Schweizer Marktplatz für Dinge mit Geschichte.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(25,22,21,.45)', marginTop: 16, lineHeight: 1.5 }}>
              Gemeindehausstrasse 11B<br />
              6010 Kriens, Schweiz
            </p>
          </div>

          {/* Marktplatz */}
          <div>
            <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: '#191615', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
              Marktplatz
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.marktplatz.map(l => (
                <li key={l.href} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: 'rgba(25,22,21,.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#0E9493'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(25,22,21,.6)'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: '#191615', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
              Über uns
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.unternehmen.map(l => (
                <li key={l.href} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: 'rgba(25,22,21,.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#0E9493'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(25,22,21,.6)'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: '#191615', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.support.map(l => (
                <li key={l.href} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: 'rgba(25,22,21,.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#0E9493'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(25,22,21,.6)'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="ftr-bottom" style={{ borderTop: '1px solid #E4E0D8', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: 'rgba(25,22,21,.45)', margin: 0 }}>
            © 2026 BEEDARO, eine Marke von MOQRO by Denis Mihaljevic · CHE-237.380.784. Alle Rechte vorbehalten.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/terms" style={{ fontSize: 12, color: 'rgba(25,22,21,.45)', textDecoration: 'none' }}>AGB</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(25,22,21,.45)', textDecoration: 'none' }}>Datenschutz</Link>
            <Link href="/imprint" style={{ fontSize: 12, color: 'rgba(25,22,21,.45)', textDecoration: 'none' }}>Impressum</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
