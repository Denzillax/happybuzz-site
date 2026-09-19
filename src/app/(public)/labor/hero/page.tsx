// Test-Route für den Bänder-Hero (Prototyp, 19.09.2026). Nicht verlinkt, nicht indexiert.
// Zum Vergleich mit der heutigen Startseite. Wird der Hero übernommen, ersetzt BandHero
// die Komponente Hero in (home)/page.tsx und diese Route kann weg.
import BandHero from '@/components/home/BandHero'
import { Categories } from '@/components/home/Categories'
import { FormatTiles } from '@/components/home/FormatTiles'
import { NewListings } from '@/components/home/NewListings'

export const metadata = { title: 'Labor: Bänder-Hero', robots: { index: false, follow: false } }

export default function LaborHero() {
  return (
    <>
      <BandHero />
      <Categories />
      <FormatTiles />
      <NewListings />
    </>
  )
}
