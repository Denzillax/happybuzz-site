import { Hero } from '@/components/home/Hero'
import { Ticker } from '@/components/layout/Ticker'
import { StatsBand } from '@/components/home/StatsBand'
import { FormatTiles } from '@/components/home/FormatTiles'
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

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Der Katalog in Zahlen: lebende Kennzahlen direkt unter dem Hero */}
      <StatsBand />
      {/* Grosse Laufschrift, wenn Platzierung "Startseite" gewaehlt ist */}
      <Ticker placement="home" />
      {/* Fuenf Formate als Direkteinstieg (Miete/Service/Gratis = USP) */}
      <FormatTiles />
      <ChallengeBanner />
      <CommunityImpact />
      <FeaturedSellers />
      <Categories />
      <SeasonalRecommendations />
      {/* Laufende Auktionen mit Countdown, nur wenn welche laufen */}
      <AuctionSpotlight />
      {/* Kaeufer-Logik: frisches Angebot zuerst, dann Social Proof,
          persoenlicher Wiedereinstieg zuletzt */}
      <NewListings />
      <PopularListings />
      <RecentlyViewed />
      {/* Enthaelt auch die "Warum wir"-Karten (frueher eigene Sektion WhyBeedaro) */}
      <HowItWorks />
    </>
  )
}
