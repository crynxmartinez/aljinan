'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface StatusBarChartProps {
  data: {
    labels: string[]
    values: number[]
  }
  title?: string
  description?: string
}

export function StatusBarChart({
  data,
  title = 'Work Orders by Status',
  description = 'Distribution of work orders across different stages',
}: StatusBarChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Work Orders',
        data: data.values,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Scheduled - Blue
          'rgba(251, 191, 36, 0.8)',   // In Progress - Amber
          'rgba(168, 85, 247, 0.8)',   // For Review - Purple
          'rgba(34, 197, 94, 0.8)',    // Completed - Green
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(168, 85, 247)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
