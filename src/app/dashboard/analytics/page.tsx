'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ClipboardList, AlertCircle, TrendingUp } from 'lucide-react'
import { StatsCard } from '@/components/analytics/stats-card'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { StatusBarChart } from '@/components/analytics/status-bar-chart'
import { TypePieChart } from '@/components/analytics/type-pie-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AnalyticsData {
  stats: {
    revenue: { current: number; change: number; label: string }
    activeWorkOrders: { count: number; label: string }
    overdueWorkOrders: { count: number; label: string }
    completionRate: { rate: number; label: string }
  }
  charts: {
    revenueByMonth: { labels: string[]; values: number[] }
    workOrdersByStatus: { labels: string[]; values: number[] }
    workOrdersByType: { labels: string[]; values: number[] }
  }
  topClients: { name: string; revenue: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Failed to load analytics</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Business insights and performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`SAR ${data.stats.revenue.current.toLocaleString()}`}
          change={{
            value: data.stats.revenue.change,
            label: data.stats.revenue.label,
            isPositive: data.stats.revenue.change >= 0,
          }}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Active Work Orders"
          value={data.stats.activeWorkOrders.count}
          icon={ClipboardList}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Overdue"
          value={data.stats.overdueWorkOrders.count}
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <StatsCard
          title="Completion Rate"
          value={`${data.stats.completionRate.rate.toFixed(1)}%`}
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart
          data={data.charts.revenueByMonth}
          title="Revenue Trend"
          description="Monthly revenue over the last 6 months"
        />
        <StatusBarChart
          data={data.charts.workOrdersByStatus}
          title="Work Orders by Status"
          description="Distribution across different stages"
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <TypePieChart
          data={data.charts.workOrdersByType}
          title="Work Orders by Type"
          description="Breakdown by service type"
        />

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Highest revenue contributors</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No client data available
              </p>
            ) : (
              <div className="space-y-4">
                {data.topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">
                      SAR {client.revenue.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
