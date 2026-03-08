import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ServiceSchema } from '@/components/seo/service-schema'
import { ClipboardList, Wrench, FileCheck, Users, BarChart3, DollarSign, Bell, Shield, Smartphone, CheckCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Safety Inspection Features - Work Orders, Certificates & Compliance | Tasheel',
  description: 'Comprehensive safety management features for Saudi Arabia contractors: automated work orders, certificate tracking, equipment inspection, client portal, digital reports & billing. Built for fire safety, HVAC & electrical inspections.',
  keywords: 'work order management Saudi Arabia, certificate compliance tracking, equipment inspection software, safety inspection reports, client portal KSA, automated billing contractors, fire safety management, HVAC inspection tracking',
  alternates: {
    canonical: 'https://tasheel.sa/features',
  },
  openGraph: {
    title: 'Safety Inspection Features - Work Orders, Certificates & Compliance | Tasheel',
    description: 'Comprehensive safety management features: automated work orders, certificate tracking, equipment inspection, client portal, digital reports & billing.',
    url: 'https://tasheel.sa/features',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel Safety Management Features',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safety Inspection Features | Tasheel',
    description: 'Automated work orders, certificate tracking, equipment inspection, client portal & more for Saudi Arabia contractors.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

const features = [
  {
    icon: ClipboardList,
    title: 'Work Order Management',
    description: 'Create, assign, and track work orders from start to finish. Manage schedules, priorities, and team assignments all in one place.',
    image: '/images/marketing/feature-work-orders.jpg',
    benefits: [
      'Drag-and-drop kanban board',
      'Automated task assignments',
      'Real-time status updates',
      'Priority management',
    ],
  },
  {
    icon: Wrench,
    title: 'Equipment Tracking',
    description: 'Monitor all your equipment status, locations, and maintenance schedules. Never lose track of critical assets.',
    image: '/images/marketing/feature-equipment.jpg',
    benefits: [
      'Equipment inventory management',
      'Location tracking',
      'Maintenance history',
      'Status monitoring',
    ],
  },
  {
    icon: FileCheck,
    title: 'Certificate Management',
    description: 'Automated expiry alerts ensure you never miss a renewal deadline. Keep all compliance documents organized.',
    image: '/images/marketing/feature-certificates.jpg',
    benefits: [
      'Automated expiry notifications',
      'Digital certificate storage',
      'Compliance tracking',
      'Quick certificate lookup',
    ],
  },
  {
    icon: Users,
    title: 'Client Portal',
    description: 'Give your clients 24/7 access to their projects, reports, and invoices. Improve transparency and communication.',
    image: '/images/marketing/feature-client-portal.jpg',
    benefits: [
      'Secure client access',
      'Real-time project visibility',
      'Document sharing',
      'Direct messaging',
    ],
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Generate professional inspection reports in seconds. Track performance metrics and business insights.',
    image: '/images/marketing/feature-reports.jpg',
    benefits: [
      'One-click report generation',
      'Custom templates',
      'Performance analytics',
      'Export to PDF',
    ],
  },
  {
    icon: DollarSign,
    title: 'Billing & Invoicing',
    description: 'Track payments, send invoices, and manage finances effortlessly. Get paid faster with integrated billing.',
    image: '/images/marketing/feature-billing.jpg',
    benefits: [
      'Automated invoice generation',
      'Payment tracking',
      'Financial reports',
      'Multiple payment methods',
    ],
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay informed with intelligent alerts for deadlines, updates, and important events.',
    image: '/images/marketing/feature-notifications.jpg',
    benefits: [
      'Email notifications',
      'In-app alerts',
      'Custom notification rules',
      'Priority alerts',
    ],
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    description: 'Enterprise-grade security with role-based access control and audit trails.',
    image: '/images/marketing/feature-security.jpg',
    benefits: [
      'Data encryption',
      'Role-based permissions',
      'Audit logs',
      'Secure backups',
    ],
  },
  {
    icon: Smartphone,
    title: 'Mobile Access',
    description: 'Work from anywhere with our mobile-responsive platform. Perfect for field work.',
    image: '/images/marketing/feature-mobile.jpg',
    benefits: [
      'Works on any device',
      'Offline mode',
      'Photo uploads',
      'GPS location tracking',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="py-16 md:py-24">
      <ServiceSchema />
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Features for Modern Safety Contractors
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Everything you need to streamline operations, ensure compliance, and grow your business. Discover why <Link href="/" className="text-primary hover:underline">Tasheel</Link> is the leading safety platform in Saudi Arabia.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="space-y-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isEven = index % 2 === 0

            return (
              <div
                key={index}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">{feature.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="relative rounded-lg overflow-hidden h-64">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-24">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl mb-8 text-orange-50">
            Join 50+ contractors already using <Link href="/" className="text-white hover:underline font-semibold">Tasheel</Link> across Saudi Arabia
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
