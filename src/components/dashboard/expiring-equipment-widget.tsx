'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tag,
  AlertTriangle,
  Clock,
  XCircle,
  ChevronRight,
  Loader2,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'

interface ExpiringEquipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  location: string | null
  expectedExpiry: string | null
  status: string
  calculatedStatus: string
  branchId: string
  branchName?: string
  clientName?: string
}

interface ExpiringEquipmentWidgetProps {
  contractorId?: string
}

export function ExpiringEquipmentWidget({ contractorId }: ExpiringEquipmentWidgetProps) {
  const [equipment, setEquipment] = useState<ExpiringEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchExpiringEquipment = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/equipment/expiring')
        if (response.ok) {
          const data = await response.json()
          setEquipment(data)
          setError('')
        } else {
          setError('Failed to load equipment')
        }
      } catch (err) {
        setError('Failed to fetch equipment')
      } finally {
        setLoading(false)
      }
    }

    fetchExpiringEquipment()
  }, [contractorId])

  const expiredCount = equipment.filter(eq => eq.calculatedStatus === 'EXPIRED').length
  const expiringSoonCount = equipment.filter(eq => eq.calculatedStatus === 'EXPIRING_SOON').length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Tag className="h-5 w-5" />
            Equipment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return null
  }

  if (equipment.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Tag className="h-5 w-5" />
              Equipment Alerts
            </CardTitle>
            <CardDescription>
              Equipment requiring attention across all branches
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {expiredCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {expiredCount} Expired
              </Badge>
            )}
            {expiringSoonCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {expiringSoonCount} Expiring Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {equipment.slice(0, 10).map((eq) => (
            <div
              key={eq.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{eq.equipmentNumber}</span>
                  <Badge variant="outline" className="text-xs">
                    {eq.equipmentType.replace(/_/g, ' ')}
                  </Badge>
                  {eq.calculatedStatus === 'EXPIRED' ? (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Expiring Soon
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {eq.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {eq.location}
                    </span>
                  )}
                  {eq.expectedExpiry && (
                    <span>
                      Expires: {new Date(eq.expectedExpiry).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {eq.clientName && eq.branchName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {eq.clientName} - {eq.branchName}
                  </p>
                )}
              </div>
              <Link href={`/dashboard/clients/${eq.branchId.split('/')[0]}/branches/${eq.branchId}?tab=equipment`}>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
        {equipment.length > 10 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            And {equipment.length - 10} more items...
          </p>
        )}
      </CardContent>
    </Card>
  )
}
