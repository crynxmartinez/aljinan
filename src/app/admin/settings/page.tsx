import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, UserCog, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminSettingsPage() {
  const settingsCards = [
    {
      title: 'Admin Users',
      description: 'Manage platform administrators and their permissions',
      href: '/admin/settings/admins',
      icon: UserCog,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure platform-wide settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription className="text-xs">{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
