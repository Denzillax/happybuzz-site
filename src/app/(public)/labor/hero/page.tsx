// Test-Route für den Bänder-Hero (Prototyp, 19.09.2026). Nicht verlinkt, nicht indexiert.
// Zum Vergleich mit der heutigen Startseite. Wird der Hero übernommen, ersetzt BandHero
// die Komponente Hero in (home)/page.tsx und diese Route kann weg.
import LaborHero from './LaborHero'

export const metadata = { title: 'Labor: Bänder-Hero', robots: { index: false, follow: false } }

export default function Page() {
  return <LaborHero />
}
