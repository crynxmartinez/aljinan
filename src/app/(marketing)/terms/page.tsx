'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/use-translation'

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
  const { t } = useTranslation()
  
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.pages.terms.title}</h1>
          <p className="text-muted-foreground mb-12">{t.pages.terms.lastUpdated}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            {t.pages.terms.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <p className="text-muted-foreground mb-4">{section.content}</p>
                {section.list && (
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    {section.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.contact && (
                  <p className="text-muted-foreground mt-4">
                    {section.contact.email}<br />
                    {section.contact.phone}<br />
                    {section.contact.address}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
