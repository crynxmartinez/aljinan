'use client'

import { useTranslation } from '@/lib/i18n/use-translation'

type PrivacySection = {
  title: string
  content: string
  list?: string[]
  contact?: { email: string; phone: string; address: string }
}

export function PrivacyContent() {
  const { t } = useTranslation()

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.pages.privacy.title}</h1>
          <p className="text-muted-foreground mb-12">{t.pages.privacy.lastUpdated}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            {(t.pages.privacy.sections as unknown as readonly PrivacySection[]).map((section, index) => {
              return (
                <section key={index}>
                  <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                  <p className="text-muted-foreground mb-4">{section.content}</p>
                  {section.list && (
                    <ul className="list-disc ps-6 space-y-2 text-muted-foreground">
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
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
