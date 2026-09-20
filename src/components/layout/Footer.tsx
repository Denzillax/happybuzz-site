'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import PunktSchriftzug from '@/components/home/PunktSchriftzug'

// Meeko-Design (20.09.2026): der Fuss ist eine Lavendel-Tafel mit Ink-Rand. Oben der Aufruf zum Inserieren, darunter
// Marke und die drei Linkspalten, unten die Rechtszeile. Inhalt und Links wie vorher.
// Styles: globals.css, Block FUSS MEEKO (ft-*). Die Klassen ftr-grid und ftr-bottom bleiben für die Handy-Regeln.
const links = [
  { titel: 'Marktplatz', eintraege: [
    { label: 'Stöbern', href: '/search' },
    { label: 'Inserieren', href: '/listings/new' },
    { label: 'So funktionierts', href: '/how-it-works' },
  ] },
  { titel: 'Über uns', eintraege: [
    { label: 'Über BEEDARO', href: '/about' },
    { label: 'Bee-Impact', href: '/impact' },
    { label: 'Jobs', href: '/about#jobs' },
  ] },
  { titel: 'Support', eintraege: [
    { label: 'Hilfe & FAQ', href: '/help' },
    { label: 'Kontakt', href: '/contact' },
    { label: 'Datenschutz', href: '/privacy' },
  ] },
]

// Wörter des Kachel-Schriftzugs mit ihrer Farbe (Denis 20.09.2026: das Wort trägt die echte Farbe dessen, wofür es steht).
// Es sind die Pastelltöne der Seite, ohne Rand um die Kacheln. Sichtbar werden sie auf der dunklen Tafel (.ft-kacheln).
const KACHEL_WORTE: [string, string][] = [
  ['beedaro', '#DBF5F0'],     // Marke: Mint wie Hero und App-Icon
  ['kaufen', '#FBEBEA'],      // Festpreis: Rosé
  ['bieten', '#E3E3FF'],      // Auktion: Lavendel
  ['mieten', '#E3F2FF'],      // Miete: Himmel
  ['buchen', '#FFE3FB'],      // Service: Rosa
  ['verschenken', '#FFE7A9'], // Gratis: Butter
]

export function Footer() {
  return (
    <footer className="ft">
      {/* Lookbook-Effekt in Kacheln (Denis 20.09.2026): B-Zeichen und Wortmarke aus kleinen Quadraten. Sie setzen sich
          zusammen, während der Fuss ins Bild kommt, weichen dem Mauszeiger in einem grossen Kreis aus, und das Wort wechselt
          alle paar Sekunden. Jedes Wort trägt die Farbe seines Formats. Reine Zier, der echte Name steht oben im Logo. */}
      <div className="ft-kacheln" aria-hidden="true">
        <PunktSchriftzug wort="beedaro" woerter={KACHEL_WORTE.map((w) => w[0])} farben={KACHEL_WORTE.map((w) => w[1])} wechsel={3200} mausRadius={16} mausKraft={1.5} schrift="Sora" gewicht={700} farbe="#1D1D1D" maxBreite={1200} {...({ zerfall: "einlauf" } as any)} biene={false} kachel logo />
      </div>
      <div className="ft-tafel">
        <div className="ft-aufruf">
          <p className="ft-satz">Dein Keller hat Inventar.<br />Wir haben Käufer.</p>
          <Link href="/listings/new" className="ft-knopf"><Plus size={17} strokeWidth={2.4} aria-hidden="true" /> Inserieren</Link>
        </div>

        <div className="ftr-grid ft-raster">
          <div>
            <Logo width={170} />
            <p className="ft-text">Secondhand mit Haltung. Der Schweizer Marktplatz für Dinge mit Geschichte.</p>
            <p className="ft-adresse">Gemeindehausstrasse 11B<br />6010 Kriens, Schweiz</p>
          </div>
          {links.map((spalte) => (
            <div key={spalte.titel}>
              <h4 className="ft-titel">{spalte.titel}</h4>
              <ul className="ft-liste">
                {spalte.eintraege.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="ftr-bottom ft-unten">
          <p>© 2026 BEEDARO, eine Marke von MOQRO by Denis Mihaljevic · CHE-237.380.784. Alle Rechte vorbehalten.</p>
          <div className="ft-recht">
            <Link href="/terms">AGB</Link>
            <Link href="/privacy">Datenschutz</Link>
            <Link href="/imprint">Impressum</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
