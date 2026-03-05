import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    label: string
    isPositive?: boolean
  }
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    change.isPositive !== false ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {change.isPositive !== false ? '↑' : '↓'} {Math.abs(change.value)}%
                </span>
                <span className="text-xs text-muted-foreground">{change.label}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-full', iconBgColor)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
