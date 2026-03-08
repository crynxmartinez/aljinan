import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FAQSchema } from '@/components/seo/faq-schema'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How do I sign up for Tasheel?',
        answer: 'Click the "Get Started" or "Sign Up" button on our homepage, fill out the registration form with your company details, and you\'ll be up and running in under 2 minutes. No credit card required for the free trial.',
      },
      {
        question: 'Is there a free trial?',
        answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.',
      },
      {
        question: 'How long does it take to set up?',
        answer: 'Most contractors are fully set up within 30 minutes. You can start creating work orders and adding clients immediately after signing up.',
      },
    ],
  },
  {
    category: 'Features',
    questions: [
      {
        question: 'Can my clients access the platform?',
        answer: 'Yes! Each client gets their own secure portal where they can view projects, certificates, invoices, and communicate with your team 24/7.',
      },
      {
        question: 'Does it work on mobile devices?',
        answer: 'Absolutely. Tasheel is fully responsive and works seamlessly on smartphones, tablets, and desktops. Perfect for field work.',
      },
      {
        question: 'Can I upload existing certificates and documents?',
        answer: 'Yes, you can easily upload and organize all your existing certificates, inspection reports, and documents into Tasheel.',
      },
      {
        question: 'How does certificate expiry tracking work?',
        answer: 'Tasheel automatically monitors all certificate expiry dates and sends you notifications 30, 14, and 7 days before expiration, ensuring you never miss a renewal.',
      },
    ],
  },
  {
    category: 'Billing & Pricing',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept major credit cards (Visa, Mastercard), bank transfers, and STC Pay for your convenience.',
      },
      {
        question: 'Can I cancel anytime?',
        answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.',
      },
      {
        question: 'Do you offer discounts for annual plans?',
        answer: 'Yes, we offer significant discounts for annual subscriptions. Contact our sales team for pricing details.',
      },
      {
        question: 'What happens to my data if I cancel?',
        answer: 'You can export all your data before canceling. We retain your data for 30 days after cancellation in case you want to reactivate.',
      },
    ],
  },
  {
    category: 'Support & Security',
    questions: [
      {
        question: 'How do I get help if I have questions?',
        answer: 'You can contact us at support@tasheel.sa, use the in-app chat, or call us during business hours. We typically respond within a few hours.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, we use enterprise-grade encryption, secure data centers, and regular backups. Your data is protected with the highest security standards.',
      },
      {
        question: 'Do you provide training?',
        answer: 'Yes, we offer free onboarding sessions and video tutorials to help you and your team get started quickly.',
      },
      {
        question: 'Can I import data from other systems?',
        answer: 'Yes, we can help you migrate data from spreadsheets or other systems. Contact our support team for assistance.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'Do I need to install any software?',
        answer: 'No, Tasheel is a cloud-based platform accessible through any web browser. No installation required.',
      },
      {
        question: 'Can multiple team members use the same account?',
        answer: 'Yes, you can add unlimited team members with different permission levels based on their roles.',
      },
      {
        question: 'Does Tasheel integrate with other tools?',
        answer: 'We\'re constantly adding integrations. Contact us if you have specific integration requirements.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="py-16 md:py-24">
      <FAQSchema />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about <Link href="/" className="text-primary hover:underline">Tasheel</Link> and our safety management platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold mb-6">{category.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gray-50 p-8 rounded-lg border">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? <Link href="/" className="text-primary hover:underline">Visit our homepage</Link> or contact our support team.
            </p>
            <Button asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
