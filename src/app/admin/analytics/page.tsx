import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-wide analytics and insights</p>
      </div>

      <Card>
        <CardContent className="py-20 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm">Advanced analytics will be available here</p>
        </CardContent>
      </Card>
    </div>
  )
}
