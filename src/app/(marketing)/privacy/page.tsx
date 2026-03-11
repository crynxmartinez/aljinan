import { Metadata } from 'next'
import { PrivacyContent } from './privacy-content'

export const metadata: Metadata = {
  title: 'Privacy Policy - Data Protection & Security | Tasheel',
  description: 'Tasheel privacy policy for Saudi Arabia contractors. Learn how we protect your safety inspection data, certificates, and client information with enterprise-grade security.',
  keywords: 'privacy policy Saudi Arabia, data protection KSA, safety software security, contractor data privacy, tasheel privacy',
  alternates: {
    canonical: 'https://tasheel.sa/privacy',
  },
  openGraph: {
    title: 'Privacy Policy - Data Protection & Security | Tasheel',
    description: 'Tasheel privacy policy for Saudi Arabia contractors. Enterprise-grade security for your safety inspection data.',
    url: 'https://tasheel.sa/privacy',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel Privacy Policy',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Tasheel',
    description: 'Data protection & security for Saudi Arabia contractors.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
