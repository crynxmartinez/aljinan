import { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Hero } from '@/components/marketing/hero'
import { ProblemSolution } from '@/components/marketing/problem-solution'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { FeaturesGrid } from '@/components/marketing/features-grid'
import { CTASection } from '@/components/marketing/cta-section'
import { getLocale, getTranslationsForLocale } from '@/lib/i18n/server'
import { displayFont } from '@/lib/fonts'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = getTranslationsForLocale(locale).seo.home

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: 'https://tasheel.sa/',
      languages: { ar: 'https://tasheel.sa/', en: 'https://tasheel.sa/' },
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
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

export default function HomePage() {
  return (
    <div className={`marketing-site min-h-screen flex flex-col bg-background text-foreground ${displayFont.variable}`}>
      <Navbar variant="marketing" />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <FeaturesGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
