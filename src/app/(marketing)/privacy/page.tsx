'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/use-translation'

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
  const { t } = useTranslation()
  
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.pages.privacy.title}</h1>
          <p className="text-muted-foreground mb-12">{t.pages.privacy.lastUpdated}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, including your name, email address, 
                company name, phone number, and any other information you choose to provide when using <Link href="/" className="text-primary hover:underline">Tasheel</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal data 
                against unauthorized or unlawful processing, accidental loss, destruction, or damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal data for as long as necessary to fulfill the purposes outlined in 
                this privacy policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our service and 
                hold certain information to improve and analyze our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
              <p className="text-muted-foreground">
                We may employ third-party companies and individuals to facilitate our service, provide 
                the service on our behalf, or assist us in analyzing how our service is used.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please <Link href="/" className="text-primary hover:underline">contact us</Link> at:
              </p>
              <p className="text-muted-foreground mt-4">
                Email: privacy@tasheel.sa<br />
                Phone: +966 50 123 4567<br />
                Address: King Fahd Road, Riyadh 12345, Saudi Arabia
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
