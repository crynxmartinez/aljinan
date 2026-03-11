'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FAQSchema } from '@/components/seo/faq-schema'
import { useTranslation } from '@/lib/i18n/use-translation'

export function FAQContent() {
  const { t } = useTranslation()

  return (
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

        <div className="max-w-2xl mx-auto mt-16 text-center bg-gray-50 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-4">
            {t.pages.faq.stillHaveQuestions}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t.pages.faq.cantFind}
          </p>
          <Button asChild>
            <Link href="/contact">{t.pages.faq.contactButton}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
