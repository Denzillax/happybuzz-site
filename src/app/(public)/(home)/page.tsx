import { Hero } from '@/components/home/Hero'
import { Ticker } from '@/components/layout/Ticker'
import { ChallengeBanner } from '@/components/home/ChallengeBanner'
import { CommunityImpact } from '@/components/home/CommunityImpact'
import { Categories } from '@/components/home/Categories'
import { NewListings } from '@/components/home/NewListings'
import { PopularListings } from '@/components/home/PopularListings'
import { FeaturedSellers } from '@/components/home/FeaturedSellers'
import { RecentlyViewed } from '@/components/home/RecentlyViewed'
import { SeasonalRecommendations } from '@/components/home/SeasonalRecommendations'
import { HowItWorks } from '@/components/home/HowItWorks'
import { WhyBeedaro } from '@/components/home/WhyBeedaro'

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Grosse Laufschrift, wenn Platzierung "Startseite" gewaehlt ist */}
      <Ticker placement="home" />
      <ChallengeBanner />
      <CommunityImpact />
      <FeaturedSellers />
      <Categories />
      <SeasonalRecommendations />
      {/* Kaeufer-Logik: frisches Angebot zuerst, dann Social Proof,
          persoenlicher Wiedereinstieg zuletzt */}
      <NewListings />
      <PopularListings />
      <RecentlyViewed />
      <HowItWorks />
      <WhyBeedaro />
    </>
  )
}
