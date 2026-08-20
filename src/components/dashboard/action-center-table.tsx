'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  Tag,
  FileCheck,
  Loader2,
  ChevronRight,
  CalendarX,
  Building2,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/use-translation'

// Types for each alert category
interface DelayedWorkOrder {
  id: string
  workOrderNumber?: number | null
  description: string
  scheduledDate: string
  daysOverdue: number
  assignedTo: string | null
  branchId: string
  branchName: string
  clientId: string
  clientName: string
}

interface ExpiringEquipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  location: string | null
  expectedExpiry: string | null
  daysLeft: number
  isExpired: boolean
  branchId: string
  branchName: string
  clientId: string
  clientName: string
}

interface ExpiringContract {
  id: string
  title: string
  endDate: string | null
  daysLeft: number
  isExpired: boolean
  autoRenew: boolean
  branchId: string
  branchName: string
  clientId: string
  clientName: string
}

interface ActionCenterData {
  delayedWorkOrders: DelayedWorkOrder[]
  expiringEquipment: ExpiringEquipment[]
  expiringContracts: ExpiringContract[]
}

interface ActionCenterTableProps {
  userRole: 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER'
}

export function ActionCenterTable({ userRole }: ActionCenterTableProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.actionCenter
  const showClientColumn = userRole === 'CONTRACTOR' || userRole === 'TEAM_MEMBER'
  const [data, setData] = useState<ActionCenterData>({
    delayedWorkOrders: [],
    expiringEquipment: [],
    expiringContracts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('delayed-work-orders')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/action-center')
        if (response.ok) {
          const result = await response.json()
          setData(result)
          setError('')
        } else {
          setError(ta.failedToLoad)
        }
      } catch {
        setError(ta.failedToFetch)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const delayedCount = data.delayedWorkOrders.length
  const equipmentCount = data.expiringEquipment.length
  const contractsCount = data.expiringContracts.length
  const totalAlerts = delayedCount + equipmentCount + contractsCount

  // Don't render if no alerts
  if (!loading && totalAlerts === 0) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            {ta.actionCenter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return null
  }

  // Build link based on user role
  const getBranchLink = (clientId: string, branchIdOrSlug: string, tab?: string) => {
    if (userRole === 'CONTRACTOR') {
      return `/dashboard/clients/${clientId}/branches/${branchIdOrSlug}${tab ? `?tab=${tab}` : ''}`
    }
    return `/portal/branches/${branchIdOrSlug}${tab ? `?tab=${tab}` : ''}`
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              {ta.actionCenter}
            </CardTitle>
            <CardDescription>
              {ta.itemsRequiringAttention}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-sm">
            {totalAlerts} {totalAlerts === 1 ? ta.alert : ta.alerts}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="delayed-work-orders" className="flex items-center gap-2">
              <CalendarX className="h-4 w-4" />
              {ta.delayedWorkOrders}
              {delayedCount > 0 && (
                <Badge variant="destructive" className="ms-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                  {delayedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expiring-equipment" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {ta.expiringEquipment}
              {equipmentCount > 0 && (
                <Badge className="ms-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs bg-amber-500">
                  {equipmentCount}
                </Badge>
              )}
            </TabsTrigger>
            {userRole === 'CONTRACTOR' && (
              <TabsTrigger value="expiring-contracts" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                {ta.expiringContracts}
                {contractsCount > 0 && (
                  <Badge className="ms-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs bg-amber-500">
                    {contractsCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Delayed Work Orders Tab */}
          <TabsContent value="delayed-work-orders" className="mt-0">
            {delayedCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarX className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{ta.noDelayedWorkOrders}</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{ta.woNumber}</TableHead>
                      {showClientColumn && <TableHead>{ta.client}</TableHead>}
                      <TableHead>{ta.branch}</TableHead>
                      <TableHead>{ta.workOrder}</TableHead>
                      <TableHead>{ta.scheduledDate}</TableHead>
                      <TableHead>{ta.daysOverdue}</TableHead>
                      {showClientColumn && <TableHead>{ta.assignedTo}</TableHead>}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.delayedWorkOrders.map((wo) => (
                      <TableRow key={wo.id}>
                        <TableCell className="font-medium">
                          {wo.workOrderNumber ? `أمر-${String(wo.workOrderNumber).padStart(4, '0')}` : '-'}
                        </TableCell>
                        {showClientColumn && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{wo.clientName}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{wo.branchName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {wo.description}
                        </TableCell>
                        <TableCell>
                          {new Date(wo.scheduledDate).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {wo.daysOverdue} {wo.daysOverdue === 1 ? ta.day : ta.days}
                          </Badge>
                        </TableCell>
                        {showClientColumn && (
                          <TableCell className="text-muted-foreground">
                            {wo.assignedTo || ta.unassigned}
                          </TableCell>
                        )}
                        <TableCell>
                          <Link href={getBranchLink(wo.clientId, wo.branchId, 'checklists')}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Expiring Equipment Tab */}
          <TabsContent value="expiring-equipment" className="mt-0">
            {equipmentCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{ta.noExpiringEquipment}</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showClientColumn && <TableHead>{ta.client}</TableHead>}
                      <TableHead>{ta.branch}</TableHead>
                      <TableHead>{ta.equipmentNumber}</TableHead>
                      <TableHead>{ta.type}</TableHead>
                      {userRole === 'CLIENT' && <TableHead>{ta.location}</TableHead>}
                      <TableHead>{ta.expiryDate}</TableHead>
                      <TableHead>{ta.status}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expiringEquipment.map((eq) => (
                      <TableRow key={eq.id}>
                        {showClientColumn && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{eq.clientName}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{eq.branchName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {eq.equipmentNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {eq.equipmentType.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        {userRole === 'CLIENT' && (
                          <TableCell className="text-muted-foreground">
                            {eq.location || '-'}
                          </TableCell>
                        )}
                        <TableCell>
                          {eq.expectedExpiry
                            ? new Date(eq.expectedExpiry).toLocaleDateString('ar-SA')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {eq.isExpired ? (
                            <Badge variant="destructive">{ta.expired}</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700">
                              {eq.daysLeft} {eq.daysLeft === 1 ? ta.dayLeft : ta.daysLeft}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={getBranchLink(eq.clientId, eq.branchId, 'equipment')}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Expiring Contracts Tab - Contractor Only */}
          {userRole === 'CONTRACTOR' && (
            <TabsContent value="expiring-contracts" className="mt-0">
              {contractsCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{ta.noExpiringContracts}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{ta.client}</TableHead>
                        <TableHead>{ta.branch}</TableHead>
                        <TableHead>{ta.contractName}</TableHead>
                        <TableHead>{ta.endDate}</TableHead>
                        <TableHead>{ta.status}</TableHead>
                        <TableHead>{ta.autoRenew}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.expiringContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{contract.clientName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{contract.branchName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {contract.title}
                          </TableCell>
                          <TableCell>
                            {contract.endDate
                              ? new Date(contract.endDate).toLocaleDateString('ar-SA')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {contract.isExpired ? (
                              <Badge variant="destructive">{ta.expired}</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">
                                {contract.daysLeft} {contract.daysLeft === 1 ? ta.dayLeft : ta.daysLeft}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {contract.autoRenew ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                {ta.yes}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                {ta.no}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link href={getBranchLink(contract.clientId, contract.branchId, 'contracts')}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
