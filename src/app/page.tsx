import { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Hero } from '@/components/marketing/hero'
import { ProblemSolution } from '@/components/marketing/problem-solution'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { FeaturesGrid } from '@/components/marketing/features-grid'
import { Benefits } from '@/components/marketing/benefits'
import { Testimonials } from '@/components/marketing/testimonials'
import { Stats } from '@/components/marketing/stats'
import { CTASection } from '@/components/marketing/cta-section'

export const metadata: Metadata = {
  title: 'Tasheel - Safety Management Software for Saudi Arabia Contractors | Free Trial',
  description: 'Leading safety inspection & compliance platform for contractors in Saudi Arabia. Manage fire safety, HVAC, electrical inspections. Automated certificates, work orders & client portal. Start free trial.',
  keywords: 'safety management software Saudi Arabia, contractor platform KSA, fire safety inspection software Riyadh, building compliance system, HVAC inspection management, electrical safety compliance, certificate tracking, work order management Saudi Arabia',
  alternates: {
    canonical: 'https://tasheel.sa/',
  },
  openGraph: {
    title: 'Tasheel - Safety Management Software for Saudi Arabia Contractors',
    description: 'Leading safety inspection & compliance platform for contractors in Saudi Arabia. Automated certificates, work orders & client portal.',
    url: 'https://tasheel.sa/',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel - Safety Management Platform for Saudi Arabia',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tasheel - Safety Management Software for Saudi Arabia',
    description: 'Leading safety inspection & compliance platform. Automated certificates, work orders & client portal. Start free trial.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="marketing" />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <FeaturesGrid />
        <Benefits />
        <Testimonials />
        <Stats />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
