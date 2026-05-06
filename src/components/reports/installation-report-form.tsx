'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Package, CheckCircle, XCircle } from 'lucide-react'
import { 
  InstallationReportData, 
  EquipmentInstalled, 
  CommissioningItem, 
  TestResult,
  emptyInstallationReportData 
} from '@/types/reports'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InstallationReportFormProps {
  data: InstallationReportData
  onChange: (data: InstallationReportData) => void
  readOnly?: boolean
}

export function InstallationReportForm({ data, onChange, readOnly = false }: InstallationReportFormProps) {
  const reportData = data || emptyInstallationReportData

  const updateField = <K extends keyof InstallationReportData>(field: K, value: InstallationReportData[K]) => {
    onChange({ ...reportData, [field]: value })
  }

  // Equipment
  const addEquipment = () => {
    const newEquipment: EquipmentInstalled = { name: '', model: '', serialNumber: '', location: '' }
    updateField('equipmentInstalled', [...reportData.equipmentInstalled, newEquipment])
  }

  const updateEquipment = (index: number, field: keyof EquipmentInstalled, value: string) => {
    const equipment = [...reportData.equipmentInstalled]
    equipment[index] = { ...equipment[index], [field]: value }
    updateField('equipmentInstalled', equipment)
  }

  const removeEquipment = (index: number) => {
    updateField('equipmentInstalled', reportData.equipmentInstalled.filter((_, i) => i !== index))
  }

  // Commissioning
  const addCommissioningItem = () => {
    const newItem: CommissioningItem = { item: '', completed: false, notes: '' }
    updateField('commissioningChecklist', [...reportData.commissioningChecklist, newItem])
  }

  const updateCommissioningItem = (index: number, field: keyof CommissioningItem, value: string | boolean) => {
    const items = [...reportData.commissioningChecklist]
    items[index] = { ...items[index], [field]: value }
    updateField('commissioningChecklist', items)
  }

  const removeCommissioningItem = (index: number) => {
    updateField('commissioningChecklist', reportData.commissioningChecklist.filter((_, i) => i !== index))
  }

  // Test Results
  const addTestResult = () => {
    const newTest: TestResult = { test: '', result: 'pass', notes: '' }
    updateField('testingResults', [...reportData.testingResults, newTest])
  }

  const updateTestResult = (index: number, field: keyof TestResult, value: string) => {
    const tests = [...reportData.testingResults]
    tests[index] = { ...tests[index], [field]: value }
    updateField('testingResults', tests)
  }

  const removeTestResult = (index: number) => {
    updateField('testingResults', reportData.testingResults.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-purple-600">
        <Package className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Installation Report</h3>
      </div>

      {/* Equipment Installed */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Equipment Installed</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addEquipment}>
                <Plus className="h-4 w-4 mr-1" />
                Add Equipment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.equipmentInstalled.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No equipment added
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Equipment</div>
                <div className="col-span-3">Model</div>
                <div className="col-span-3">Serial Number</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-1"></div>
              </div>
              {reportData.equipmentInstalled.map((eq, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <Input
                      value={eq.name}
                      onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                      placeholder="Equipment name"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={eq.model}
                      onChange={(e) => updateEquipment(index, 'model', e.target.value)}
                      placeholder="Model"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={eq.serialNumber}
                      onChange={(e) => updateEquipment(index, 'serialNumber', e.target.value)}
                      placeholder="Serial #"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={eq.location}
                      onChange={(e) => updateEquipment(index, 'location', e.target.value)}
                      placeholder="Location"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-1">
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEquipment(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <div className="space-y-2">
        <Label htmlFor="configurationDetails">Configuration Details</Label>
        <Textarea
          id="configurationDetails"
          value={reportData.configurationDetails}
          onChange={(e) => updateField('configurationDetails', e.target.value)}
          placeholder="System configuration, zones, settings..."
          rows={3}
          disabled={readOnly}
        />
      </div>

      {/* Commissioning Checklist */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Commissioning Checklist</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addCommissioningItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.commissioningChecklist.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No checklist items
            </p>
          ) : (
            <div className="space-y-3">
              {reportData.commissioningChecklist.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => updateCommissioningItem(index, 'completed', !!checked)}
                    disabled={readOnly}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.item}
                      onChange={(e) => updateCommissioningItem(index, 'item', e.target.value)}
                      placeholder="Checklist item"
                      disabled={readOnly}
                      className={item.completed ? 'line-through text-muted-foreground' : ''}
                    />
                    <Input
                      value={item.notes}
                      onChange={(e) => updateCommissioningItem(index, 'notes', e.target.value)}
                      placeholder="Notes (optional)"
                      disabled={readOnly}
                      className="text-sm"
                    />
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCommissioningItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Results */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Testing Results</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addTestResult}>
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.testingResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tests recorded
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-5">Test</div>
                <div className="col-span-2">Result</div>
                <div className="col-span-4">Notes</div>
                <div className="col-span-1"></div>
              </div>
              {reportData.testingResults.map((test, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      value={test.test}
                      onChange={(e) => updateTestResult(index, 'test', e.target.value)}
                      placeholder="Test name"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={test.result}
                      onValueChange={(value) => updateTestResult(index, 'result', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Pass
                          </div>
                        </SelectItem>
                        <SelectItem value="fail">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Fail
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      value={test.notes}
                      onChange={(e) => updateTestResult(index, 'notes', e.target.value)}
                      placeholder="Notes"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-1">
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTestResult(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Training</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="trainingProvided"
              checked={reportData.trainingProvided}
              onCheckedChange={(checked) => updateField('trainingProvided', !!checked)}
              disabled={readOnly}
            />
            <Label htmlFor="trainingProvided">Training was provided to client</Label>
          </div>
          {reportData.trainingProvided && (
            <Textarea
              value={reportData.trainingNotes}
              onChange={(e) => updateField('trainingNotes', e.target.value)}
              placeholder="Training details, attendees, topics covered..."
              rows={2}
              disabled={readOnly}
            />
          )}
        </CardContent>
      </Card>

      {/* Warranty */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Warranty Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warrantyStartDate">Start Date</Label>
              <Input
                id="warrantyStartDate"
                type="date"
                value={reportData.warrantyStartDate}
                onChange={(e) => updateField('warrantyStartDate', e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyEndDate">End Date</Label>
              <Input
                id="warrantyEndDate"
                type="date"
                value={reportData.warrantyEndDate}
                onChange={(e) => updateField('warrantyEndDate', e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Handover */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Handover</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="handoverName">Client Representative Name</Label>
              <Input
                id="handoverName"
                value={reportData.handoverName}
                onChange={(e) => updateField('handoverName', e.target.value)}
                placeholder="Name of person receiving equipment"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handoverDate">Handover Date</Label>
              <Input
                id="handoverDate"
                type="date"
                value={reportData.handoverDate}
                onChange={(e) => updateField('handoverDate', e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Client signature will be captured when accepting the work order.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
