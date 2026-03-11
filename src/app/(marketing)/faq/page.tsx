import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FAQSchema } from '@/components/seo/faq-schema'
import { TranslatedContent } from '@/components/i18n/translated-content'

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
  return (
    <TranslatedContent>
      {(t) => (
        <div className="py-16 md:py-24">
      <FAQSchema />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t.pages.faq.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.pages.faq.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {t.pages.faq.categories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gray-50 p-8 rounded-lg border">
            <h3 className="text-xl font-bold mb-2">{t.pages.faq.stillHaveQuestions}</h3>
            <p className="text-muted-foreground mb-6">
              {t.pages.faq.cantFind}
            </p>
            <Button asChild>
              <Link href="/contact">{t.pages.faq.contactButton}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
      )}
    </TranslatedContent>
  )
}
