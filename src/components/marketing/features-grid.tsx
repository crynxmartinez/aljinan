import { ClipboardList, Wrench, FileCheck, Users, BarChart3, DollarSign } from 'lucide-react'

export function FeaturesGrid() {
  const features = [
    {
      icon: ClipboardList,
      title: 'Work Order Management',
      description: 'Create, assign, and track work orders from start to finish',
    },
    {
      icon: Wrench,
      title: 'Equipment Tracking',
      description: 'Monitor equipment status, locations, and maintenance schedules',
    },
    {
      icon: FileCheck,
      title: 'Certificate Management',
      description: 'Automated expiry alerts. Never miss a renewal deadline',
    },
    {
      icon: Users,
      title: 'Client Portal',
      description: 'Give clients 24/7 access to their projects, reports, and invoices',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Generate professional inspection reports in seconds',
    },
    {
      icon: DollarSign,
      title: 'Billing & Invoicing',
      description: 'Track payments, send invoices, manage finances effortlessly',
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
                className="group p-6 bg-white border rounded-lg hover:shadow-lg hover:border-orange-200 transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <Icon className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
