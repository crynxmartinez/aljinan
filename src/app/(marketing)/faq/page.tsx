import { Metadata } from 'next'
import { FAQContent } from './faq-content'

export const metadata: Metadata = {
  title: 'FAQ - Safety Management Software Questions | Tasheel Saudi Arabia',
  description: 'Frequently asked questions about Tasheel safety inspection platform. Pricing, features, setup, compliance, and support for Saudi Arabia contractors. Get answers now.',
  keywords: 'safety software FAQ Saudi Arabia, contractor platform questions, inspection software pricing KSA, compliance management help, tasheel questions, safety platform support',
  alternates: {
    canonical: 'https://tasheel.sa/faq',
  },
  openGraph: {
    title: 'FAQ - Safety Management Software Questions | Tasheel',
    description: 'Frequently asked questions about Tasheel safety inspection platform. Pricing, features, setup, compliance, and support for Saudi Arabia contractors.',
    url: 'https://tasheel.sa/faq',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel FAQ - Safety Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - Safety Software Questions | Tasheel',
    description: 'Get answers about Tasheel safety inspection platform. Pricing, features, setup & support for Saudi Arabia contractors.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function FAQPage() {
  return <FAQContent />
}
