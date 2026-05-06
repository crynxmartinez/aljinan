'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Wrench } from 'lucide-react'
import { ServiceReportData, PartReplaced, emptyServiceReportData } from '@/types/reports'

interface ServiceReportFormProps {
  data: ServiceReportData
  onChange: (data: ServiceReportData) => void
  readOnly?: boolean
}

export function ServiceReportForm({ data, onChange, readOnly = false }: ServiceReportFormProps) {
  const reportData = data || emptyServiceReportData

  const updateField = <K extends keyof ServiceReportData>(field: K, value: ServiceReportData[K]) => {
    onChange({ ...reportData, [field]: value })
  }

  const addPart = () => {
    const newPart: PartReplaced = { name: '', quantity: 1, unitCost: 0, total: 0 }
    updateField('partsReplaced', [...reportData.partsReplaced, newPart])
  }

  const updatePart = (index: number, field: keyof PartReplaced, value: string | number) => {
    const parts = [...reportData.partsReplaced]
    parts[index] = { ...parts[index], [field]: value }
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unitCost') {
      parts[index].total = parts[index].quantity * parts[index].unitCost
    }
    
    // Calculate total parts cost
    const totalPartsCost = parts.reduce((sum, p) => sum + p.total, 0)
    const laborCost = reportData.laborHours * reportData.laborRate
    const totalCost = totalPartsCost + laborCost
    
    onChange({ ...reportData, partsReplaced: parts, totalPartsCost, totalCost })
  }

  const removePart = (index: number) => {
    const parts = reportData.partsReplaced.filter((_, i) => i !== index)
    const totalPartsCost = parts.reduce((sum, p) => sum + p.total, 0)
    const laborCost = reportData.laborHours * reportData.laborRate
    const totalCost = totalPartsCost + laborCost
    
    onChange({ ...reportData, partsReplaced: parts, totalPartsCost, totalCost })
  }

  const updateLabor = (field: 'laborHours' | 'laborRate', value: number) => {
    const hours = field === 'laborHours' ? value : reportData.laborHours
    const rate = field === 'laborRate' ? value : reportData.laborRate
    const laborCost = hours * rate
    const totalCost = reportData.totalPartsCost + laborCost
    
    onChange({ ...reportData, [field]: value, laborCost, totalCost })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-orange-600">
        <Wrench className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Service Report</h3>
      </div>

      {/* Problem Description */}
      <div className="space-y-2">
        <Label htmlFor="problemDescription">Problem Description</Label>
        <Textarea
          id="problemDescription"
          value={reportData.problemDescription}
          onChange={(e) => updateField('problemDescription', e.target.value)}
          placeholder="Describe the issue that was reported..."
          rows={3}
          disabled={readOnly}
        />
      </div>

      {/* Root Cause */}
      <div className="space-y-2">
        <Label htmlFor="rootCause">Root Cause Analysis</Label>
        <Textarea
          id="rootCause"
          value={reportData.rootCause}
          onChange={(e) => updateField('rootCause', e.target.value)}
          placeholder="What caused the problem..."
          rows={2}
          disabled={readOnly}
        />
      </div>

      {/* Work Performed */}
      <div className="space-y-2">
        <Label htmlFor="workPerformed">Work Performed</Label>
        <Textarea
          id="workPerformed"
          value={reportData.workPerformed}
          onChange={(e) => updateField('workPerformed', e.target.value)}
          placeholder="Detailed description of work done..."
          rows={4}
          disabled={readOnly}
        />
      </div>

      {/* Parts Replaced */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Parts Replaced</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addPart}>
                <Plus className="h-4 w-4 mr-1" />
                Add Part
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.partsReplaced.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No parts replaced
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-5">Part Name</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Cost</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>
              {reportData.partsReplaced.map((part, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      value={part.name}
                      onChange={(e) => updatePart(index, 'name', e.target.value)}
                      placeholder="Part name"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      value={part.unitCost}
                      onChange={(e) => updatePart(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={`SAR ${part.total.toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePart(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <div className="text-sm font-medium">
                  Parts Total: SAR {reportData.totalPartsCost.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labor */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Labor</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laborHours">Hours</Label>
              <Input
                id="laborHours"
                type="number"
                min="0"
                step="0.5"
                value={reportData.laborHours}
                onChange={(e) => updateLabor('laborHours', parseFloat(e.target.value) || 0)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laborRate">Rate (SAR/hr)</Label>
              <Input
                id="laborRate"
                type="number"
                min="0"
                value={reportData.laborRate}
                onChange={(e) => updateLabor('laborRate', parseFloat(e.target.value) || 0)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Labor Cost</Label>
              <Input
                value={`SAR ${reportData.laborCost.toFixed(2)}`}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Cost */}
      <div className="flex justify-end p-4 bg-muted rounded-lg">
        <div className="text-lg font-semibold">
          Total Cost: SAR {reportData.totalCost.toFixed(2)}
        </div>
      </div>

      {/* Warranty Information */}
      <div className="space-y-2">
        <Label htmlFor="warrantyInfo">Warranty Information</Label>
        <Textarea
          id="warrantyInfo"
          value={reportData.warrantyInfo}
          onChange={(e) => updateField('warrantyInfo', e.target.value)}
          placeholder="Warranty terms for parts and labor..."
          rows={2}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}
