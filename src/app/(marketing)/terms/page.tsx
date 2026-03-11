import { Metadata } from 'next'
import { TermsContent } from './terms-content'

export const metadata: Metadata = {
  title: 'Terms of Service - User Agreement | Tasheel Saudi Arabia',
  description: 'Tasheel terms of service for safety management platform users in Saudi Arabia. Subscription terms, acceptable use, and service agreement for contractors.',
  keywords: 'terms of service Saudi Arabia, contractor software agreement, safety platform terms KSA, tasheel user agreement',
  alternates: {
    canonical: 'https://tasheel.sa/terms',
  },
  openGraph: {
    title: 'Terms of Service - User Agreement | Tasheel',
    description: 'Tasheel terms of service for safety management platform users in Saudi Arabia.',
    url: 'https://tasheel.sa/terms',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel Terms of Service',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Tasheel',
    description: 'User agreement for safety management platform in Saudi Arabia.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function TermsPage() {
  return <TermsContent />
}
