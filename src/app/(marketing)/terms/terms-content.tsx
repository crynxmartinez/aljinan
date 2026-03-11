'use client'

import { useTranslation } from '@/lib/i18n/use-translation'

export function TermsContent() {
  const { t } = useTranslation()

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.pages.terms.title}</h1>
          <p className="text-muted-foreground mb-12">{t.pages.terms.lastUpdated}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            {t.pages.terms.sections.map((section, index) => {
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
  )
}
