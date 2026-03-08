import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Target, Users, Zap, Shield, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Tasheel - Simplifying Safety Management',
  description: 'Learn about Tasheel\'s mission to make safety management easy, fast, and efficient for contractors and clients across Saudi Arabia.',
  keywords: 'about tasheel, safety platform, contractor software Saudi Arabia',
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
    <div className="min-h-screen flex flex-col">
      <Navbar variant="marketing" />
      <main className="flex-1 py-16 md:py-24">
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
              Tasheel was born from a simple observation: safety contractors spend too much time on paperwork 
              and not enough time on what matters—keeping people safe.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              We built Tasheel to change that. Our platform automates the tedious tasks, streamlines communication, 
              and ensures compliance—so contractors can focus on delivering exceptional service.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Today, Tasheel serves safety contractors across Saudi Arabia, helping them manage thousands of 
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
            Start simplifying your safety operations today
          </p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100" asChild>
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  )
}
