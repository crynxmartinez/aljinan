import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, Users, Zap, Shield, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Tasheel - Saudi Arabia\'s Leading Safety Management Platform',
  description: 'Tasheel simplifies safety management for contractors across Saudi Arabia. Trusted by 50+ contractors for fire safety, HVAC, electrical & building inspections. Learn our mission and values.',
  keywords: 'safety platform Saudi Arabia, contractor software KSA, inspection management Riyadh, compliance software Saudi contractors, building safety management, about tasheel',
  alternates: {
    canonical: 'https://tasheel.sa/about',
  },
  openGraph: {
    title: 'About Tasheel - Saudi Arabia\'s Leading Safety Management Platform',
    description: 'Tasheel simplifies safety management for contractors across Saudi Arabia. Trusted by 50+ contractors for fire safety, HVAC & electrical inspections.',
    url: 'https://tasheel.sa/about',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About Tasheel - Safety Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Tasheel - Saudi Arabia\'s Safety Platform',
    description: 'Simplifying safety management for contractors across Saudi Arabia. Learn our mission and values.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: 'Simplicity First',
      description: 'We believe powerful software should be easy to use. No complexity, no confusion.',
    },
    {
      icon: Shield,
      title: 'Built for Saudi Arabia',
      description: 'Designed specifically for the Saudi market with local compliance and regulations in mind.',
    },
    {
      icon: Users,
      title: 'Customer Success',
      description: 'Your success is our success. We\'re committed to helping you grow your business.',
    },
    {
      icon: Target,
      title: 'Continuous Innovation',
      description: 'We constantly improve and add features based on your feedback and needs.',
    },
  ]

  return (
    <div className="py-16 md:py-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Our Mission: Making Safety Management Effortless
          </h1>
          <p className="text-xl text-muted-foreground">
            Simplifying every transaction between safety contractors and their clients
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              <Link href="/" className="text-primary hover:underline font-semibold">Tasheel</Link> was born from a simple observation: safety contractors spend too much time on paperwork 
              and not enough time on what matters—keeping people safe in Saudi Arabia.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              We built Tasheel to change that. Our platform automates the tedious tasks, streamlines communication, 
              and ensures compliance—so contractors can focus on delivering exceptional service in KSA.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Today, Tasheel serves safety contractors across Saudi Arabia, helping them manage thousands of 
              inspections, certificates, and client relationships with ease in Riyadh and beyond.
              inspections, certificates, and client relationships with ease.
            </p>
            <p className="text-lg text-muted-foreground">
              Whether you're managing fire safety, electrical inspections, HVAC maintenance, or building compliance, 
              Tasheel makes every transaction easy, fast, and compliant.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="bg-white p-8 rounded-lg border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">50+</div>
              <div className="text-sm md:text-base text-gray-300">Active Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">500+</div>
              <div className="text-sm md:text-base text-gray-300">Work Orders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">10K+</div>
              <div className="text-sm md:text-base text-gray-300">Certificates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">99%</div>
              <div className="text-sm md:text-base text-gray-300">On-Time Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-24">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Growing Community
          </h2>
          <p className="text-xl mb-8 text-orange-50">
            Start simplifying your safety operations with <Link href="/" className="text-white hover:underline font-semibold">Tasheel</Link> today
          </p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100" asChild>
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
