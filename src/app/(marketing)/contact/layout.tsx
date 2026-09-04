import { Metadata } from 'next'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { getLocale, getTranslationsForLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = getTranslationsForLocale(locale).seo.contact
  const url = 'https://tasheel.sa/contact'

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: url,
      languages: { ar: url, en: url },
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url,
      siteName: 'Tasheel',
      images: [
        {
          url: 'https://tasheel.sa/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Contact Tasheel - Safety Management Platform',
        },
      ],
      locale: seo.ogLocale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitterTitle,
      description: seo.twitterDescription,
      images: ['https://tasheel.sa/images/og-image.jpg'],
      creator: '@tasheel_sa',
      site: '@tasheel_sa',
    },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocalBusinessSchema />
      {children}
    </>
  )
}
