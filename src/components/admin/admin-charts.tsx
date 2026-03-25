'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface AdminChartsProps {
  requestsByMonth: { month: string; count: number }[]
  requestsByStatus: { status: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  Requested: '#f59e0b',
  Quoted: '#8b5cf6',
  Scheduled: '#3b82f6',
  'In Progress': '#06b6d4',
  Completed: '#22c55e',
  Rejected: '#ef4444',
  Cancelled: '#6b7280',
  Other: '#94a3b8',
}

export function AdminCharts({ requestsByMonth, requestsByStatus }: AdminChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mt-6">
      {/* Requests Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={requestsByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No request data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={requestsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                >
                  {requestsByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || STATUS_COLORS.Other}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No request data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
