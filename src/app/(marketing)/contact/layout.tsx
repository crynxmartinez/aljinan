import { Metadata } from 'next'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'

export const metadata: Metadata = {
  title: 'Contact Tasheel - Safety Software Support in Riyadh, Saudi Arabia',
  description: 'Contact Tasheel for safety management platform support. Located in Riyadh, Saudi Arabia. Email: info@tasheel.sa | Phone: +966 50 123 4567. Free consultation available for contractors.',
  keywords: 'contact tasheel Riyadh, safety software support Saudi Arabia, contractor platform help KSA, Riyadh safety management company, tasheel contact information',
  alternates: {
    canonical: 'https://tasheel.sa/contact',
  },
  openGraph: {
    title: 'Contact Tasheel - Safety Software Support in Riyadh',
    description: 'Contact Tasheel for safety management platform support. Located in Riyadh, Saudi Arabia. Email: info@tasheel.sa | Phone: +966 50 123 4567.',
    url: 'https://tasheel.sa/contact',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Tasheel - Safety Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Tasheel - Riyadh, Saudi Arabia',
    description: 'Safety management platform support. Email: info@tasheel.sa | Phone: +966 50 123 4567.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocalBusinessSchema />
      {children}
    </>
  )
}
