import { Metadata } from 'next'
import Link from 'next/link'
import { TranslatedContent } from '@/components/i18n/translated-content'

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
  return (
    <TranslatedContent>
      {(t) => (
        <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.pages.privacy.title}</h1>
          <p className="text-muted-foreground mb-12">{t.pages.privacy.lastUpdated}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            {t.pages.privacy.sections.map((section, index) => {
              const sectionWithList = section as any
              const sectionWithContact = section as any
              return (
                <section key={index}>
                  <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                  <p className="text-muted-foreground mb-4">{section.content}</p>
                  {sectionWithList.list && (
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      {sectionWithList.list.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {sectionWithContact.contact && (
                    <p className="text-muted-foreground mt-4">
                      {sectionWithContact.contact.email}<br />
                      {sectionWithContact.contact.phone}<br />
                      {sectionWithContact.contact.address}
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </div>
      )}
    </TranslatedContent>
  )
}
