import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Construction } from 'lucide-react'
import { getTranslations } from '@/lib/i18n/server'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const t = await getTranslations()
  const ts = t.dashboard.settingsPage

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{ts.title}</h1>
        <p className="text-muted-foreground mt-1">
          {ts.subtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-600" />
            {ts.comingSoon}
          </CardTitle>
          <CardDescription>
            {ts.underConstruction}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {ts.futureUpdate}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {ts.futureDesc}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
