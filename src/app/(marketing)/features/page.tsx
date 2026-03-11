import { Metadata } from 'next'
import { FeaturesContent } from './features-content'

export const metadata: Metadata = {
  title: 'Safety Inspection Features - Work Orders, Certificates & Compliance | Tasheel',
  description: 'Comprehensive safety management features for Saudi Arabia contractors: automated work orders, certificate tracking, equipment inspection, client portal, digital reports & billing. Built for fire safety, HVAC & electrical inspections.',
  keywords: 'work order management Saudi Arabia, certificate compliance tracking, equipment inspection software, safety inspection reports, client portal KSA, automated billing contractors, fire safety management, HVAC inspection tracking',
  alternates: {
    canonical: 'https://tasheel.sa/features',
  },
  openGraph: {
    title: 'Safety Inspection Features - Work Orders, Certificates & Compliance | Tasheel',
    description: 'Comprehensive safety management features: automated work orders, certificate tracking, equipment inspection, client portal, digital reports & billing.',
    url: 'https://tasheel.sa/features',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel Safety Management Features',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safety Inspection Features | Tasheel',
    description: 'Automated work orders, certificate tracking, equipment inspection, client portal & more for Saudi Arabia contractors.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function FeaturesPage() {
  return <FeaturesContent />
}
