import { ClipboardList, Wrench, FileCheck, Users, BarChart3, DollarSign } from 'lucide-react'
import Image from 'next/image'

export function FeaturesGrid() {
  const features = [
    {
      icon: ClipboardList,
      title: 'Work Order Management',
      description: 'Create, assign, and track work orders from start to finish',
      image: '/images/marketing/feature-work-orders.jpg',
    },
    {
      icon: Wrench,
      title: 'Equipment Tracking',
      description: 'Monitor equipment status, locations, and maintenance schedules',
      image: '/images/marketing/feature-equipment.jpg',
    },
    {
      icon: FileCheck,
      title: 'Certificate Management',
      description: 'Automated expiry alerts. Never miss a renewal deadline',
      image: '/images/marketing/feature-certificates.jpg',
    },
    {
      icon: Users,
      title: 'Client Portal',
      description: 'Give clients 24/7 access to their projects, reports, and invoices',
      image: '/images/marketing/feature-client-portal.jpg',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Generate professional inspection reports in seconds',
      image: '/images/marketing/feature-reports.jpg',
    },
    {
      icon: DollarSign,
      title: 'Billing & Invoicing',
      description: 'Track payments, send invoices, manage finances effortlessly',
      image: '/images/marketing/feature-billing.jpg',
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need in One Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern safety contractors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group bg-white border rounded-lg hover:shadow-lg hover:border-orange-200 transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
