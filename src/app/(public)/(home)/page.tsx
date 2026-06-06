import { Hero } from '@/components/home/Hero'
import { Categories } from '@/components/home/Categories'
import { HowItWorks } from '@/components/home/HowItWorks'
import { CommunityImpact } from '@/components/home/CommunityImpact'
import { WhyBeedaro } from '@/components/home/WhyBeedaro'

export default function HomePage() {
  return (
    <>
      <Hero />
      <CommunityImpact />
      <Categories />
      <HowItWorks />
      <WhyBeedaro />
    </>
  )
}
