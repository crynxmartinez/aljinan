import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UserCog } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from '@/lib/i18n/server'

export default async function AdminSettingsPage() {
  const t = await getTranslations()
  const ts = t.dashboard.adminSettingsPage

  const settingsCards = [
    {
      title: ts.adminUsers,
      description: ts.adminUsersDesc,
      href: '/admin/settings/admins',
      icon: UserCog,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{ts.title}</h1>
        <p className="text-muted-foreground mt-1">{ts.subtitle}</p>
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
