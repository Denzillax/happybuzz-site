import { Hero } from '@/components/home/Hero'
import { Ticker } from '@/components/layout/Ticker'
import { FormatTiles } from '@/components/home/FormatTiles'
import { FaktenKacheln } from '@/components/home/FaktenKacheln'
import { EntdeckenChips } from '@/components/home/EntdeckenChips'
import { AuctionSpotlight } from '@/components/home/AuctionSpotlight'
import { ChallengeBanner } from '@/components/home/ChallengeBanner'
import { CommunityImpact } from '@/components/home/CommunityImpact'
import { Categories } from '@/components/home/Categories'
import { NewListings } from '@/components/home/NewListings'
import { PopularListings } from '@/components/home/PopularListings'
import { FeaturedSellers } from '@/components/home/FeaturedSellers'
import { RecentlyViewed } from '@/components/home/RecentlyViewed'
import { SeasonalRecommendations } from '@/components/home/SeasonalRecommendations'
import { HowItWorks } from '@/components/home/HowItWorks'

// Klar-Look: Produkt zuerst. Schmales Band, Pills, dann sofort Inserate;
// StatsBand ist raus (Zahlen leben in CommunityImpact weiter unten).
export default function HomePage() {
  return (
    <>
      {/* Laufschrift direkt unter dem Header: laeuft Rand zu Rand und
          trennt so keine Inhalts-Kacheln (Beta-Feedback Tacocat, 30.08.) */}
      <Ticker placement="home" />
      <Hero />
      {/* Vier Fakten in einer Zeile, danach Kategorien und Schnelleinstiege (19.09., Anregung marko.ch) */}
      <FaktenKacheln />
      <Categories />
      <EntdeckenChips />
      {/* Fuenf Formate als Direkteinstieg (Miete/Service/Gratis = USP) */}
      <FormatTiles />
      <NewListings />
      <AuctionSpotlight />
      <ChallengeBanner />
      <PopularListings />
      <SeasonalRecommendations />
      <CommunityImpact />
      <RecentlyViewed />
      <FeaturedSellers />
      {/* Enthaelt auch die "Warum wir"-Karten (frueher eigene Sektion WhyBeedaro) */}
      <HowItWorks />
    </>
  )
}
