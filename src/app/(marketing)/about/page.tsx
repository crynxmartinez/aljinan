import { Metadata } from 'next'
import { AboutContent } from './about-content'

export const metadata: Metadata = {
  title: 'About Tasheel - Saudi Arabia\'s Leading Safety Management Platform',
  description: 'Tasheel simplifies safety management for contractors across Saudi Arabia. Trusted by 50+ contractors for fire safety, HVAC, electrical & building inspections. Learn our mission and values.',
  keywords: 'safety platform Saudi Arabia, contractor software KSA, inspection management Riyadh, compliance software Saudi contractors, building safety management, about tasheel',
  alternates: {
    canonical: 'https://tasheel.sa/about',
  },
  openGraph: {
    title: 'About Tasheel - Saudi Arabia\'s Leading Safety Management Platform',
    description: 'Tasheel simplifies safety management for contractors across Saudi Arabia. Trusted by 50+ contractors for fire safety, HVAC & electrical inspections.',
    url: 'https://tasheel.sa/about',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About Tasheel - Safety Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Tasheel - Saudi Arabia\'s Safety Platform',
    description: 'Simplifying safety management for contractors across Saudi Arabia. Learn our mission and values.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function AboutPage() {
  return <AboutContent />
}
