import { Hero } from '@/components/home/Hero'
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
      <ChallengeBanner />
      <CommunityImpact />
      <FeaturedSellers />
      <Categories />
      <SeasonalRecommendations />
      <RecentlyViewed />
      <NewListings />
      <PopularListings />
      <HowItWorks />
      <WhyBeedaro />
    </>
  )
}
