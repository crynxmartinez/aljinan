'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, FileText, UserPlus, Clock } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'contractor_registered' | 'client_added' | 'request_created' | 'request_completed'
  title: string
  description: string
  timestamp: string
  contractorName?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const typeConfig = {
  contractor_registered: { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100', label: 'New Contractor' },
  client_added: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100', label: 'New Client' },
  request_created: { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100', label: 'New Request' },
  request_completed: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Completed' },
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = typeConfig[activity.type]
              const Icon = config.icon
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    {activity.contractorName && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{activity.contractorName}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {timeAgo(activity.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
