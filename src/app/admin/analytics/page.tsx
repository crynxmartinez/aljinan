import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { getTranslations } from '@/lib/i18n/server'

export default async function AdminAnalyticsPage() {
  const t = await getTranslations()
  const ta = t.dashboard.adminAnalyticsPage

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{ta.title}</h1>
        <p className="text-muted-foreground mt-1">{ta.subtitle}</p>
      </div>

      <Card>
        <CardContent className="py-20 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{ta.comingSoon}</p>
          <p className="text-sm">{ta.comingSoonDesc}</p>
        </CardContent>
      </Card>
    </div>
  )
}
