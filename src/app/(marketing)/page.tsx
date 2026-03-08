import { Metadata } from 'next'
import { Hero } from '@/components/marketing/hero'
import { ProblemSolution } from '@/components/marketing/problem-solution'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { FeaturesGrid } from '@/components/marketing/features-grid'
import { Benefits } from '@/components/marketing/benefits'
import { Testimonials } from '@/components/marketing/testimonials'
import { Stats } from '@/components/marketing/stats'
import { CTASection } from '@/components/marketing/cta-section'

export const metadata: Metadata = {
  title: 'Tasheel - Safety Contractor Management Platform | Easy. Fast. Compliant.',
  description: 'Complete safety management platform for contractors in Saudi Arabia. Manage inspections, track certificates, and ensure compliance. Start free trial today.',
  keywords: 'safety software, contractor management, inspection tracking, certificate compliance, Saudi Arabia',
  openGraph: {
    title: 'Tasheel - Making Safety Management Effortless',
    description: 'The complete platform for safety contractors and their clients. Easy. Fast. Transparent.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Tasheel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tasheel - Safety Management Platform',
    description: 'Complete platform for safety contractors. Start free trial.',
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <FeaturesGrid />
      <Benefits />
      <Testimonials />
      <Stats />
      <CTASection />
    </>
  )
}
