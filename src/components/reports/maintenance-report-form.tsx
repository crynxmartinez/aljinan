'use client'

import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Settings, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
  MaintenanceReportData,
  MaintenanceTask,
  Measurement,
  ConsumableUsed,
  emptyMaintenanceReportData
} from '@/types/reports'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MaintenanceReportFormProps {
  data: MaintenanceReportData
  onChange: (data: MaintenanceReportData) => void
  readOnly?: boolean
}

export function MaintenanceReportForm({ data, onChange, readOnly = false }: MaintenanceReportFormProps) {
  const { t } = useTranslation()
  const tr = t.dashboard.reports.maintenance
  const reportData = data || emptyMaintenanceReportData

  const updateField = <K extends keyof MaintenanceReportData>(field: K, value: MaintenanceReportData[K]) => {
    onChange({ ...reportData, [field]: value })
  }

  // Tasks
  const addTask = () => {
    const newTask: MaintenanceTask = { task: '', completed: false, notes: '' }
    updateField('tasksPerformed', [...reportData.tasksPerformed, newTask])
  }

  const updateTask = (index: number, field: keyof MaintenanceTask, value: string | boolean) => {
    const tasks = [...reportData.tasksPerformed]
    tasks[index] = { ...tasks[index], [field]: value }
    updateField('tasksPerformed', tasks)
  }

  const removeTask = (index: number) => {
    updateField('tasksPerformed', reportData.tasksPerformed.filter((_, i) => i !== index))
  }

  // Measurements
  const addMeasurement = () => {
    const newMeasurement: Measurement = { name: '', value: '', unit: '', normalRange: '', status: 'normal' }
    updateField('measurements', [...reportData.measurements, newMeasurement])
  }

  const updateMeasurement = (index: number, field: keyof Measurement, value: string) => {
    const measurements = [...reportData.measurements]
    measurements[index] = { ...measurements[index], [field]: value }
    updateField('measurements', measurements)
  }

  const removeMeasurement = (index: number) => {
    updateField('measurements', reportData.measurements.filter((_, i) => i !== index))
  }

  // Consumables
  const addConsumable = () => {
    const newConsumable: ConsumableUsed = { item: '', quantity: '' }
    updateField('consumablesUsed', [...reportData.consumablesUsed, newConsumable])
  }

  const updateConsumable = (index: number, field: keyof ConsumableUsed, value: string) => {
    const consumables = [...reportData.consumablesUsed]
    consumables[index] = { ...consumables[index], [field]: value }
    updateField('consumablesUsed', consumables)
  }

  const removeConsumable = (index: number) => {
    updateField('consumablesUsed', reportData.consumablesUsed.filter((_, i) => i !== index))
  }

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">{tr.good}</Badge>
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800">{tr.fair}</Badge>
      case 'poor':
        return <Badge className="bg-orange-100 text-orange-800">{tr.poor}</Badge>
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">{tr.critical}</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-green-600">
        <Settings className="h-5 w-5" />
        <h3 className="font-semibold text-lg">{tr.title}</h3>
      </div>

      {/* Equipment Condition */}
      <div className="space-y-2">
        <Label>{tr.equipmentCondition}</Label>
        <div className="flex gap-2">
          <Select
            value={reportData.equipmentCondition}
            onValueChange={(value) => updateField('equipmentCondition', value as MaintenanceReportData['equipmentCondition'])}
            disabled={readOnly}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={tr.selectCondition} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {tr.good}
                </div>
              </SelectItem>
              <SelectItem value="fair">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  {tr.fair}
                </div>
              </SelectItem>
              <SelectItem value="poor">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  {tr.poor}
                </div>
              </SelectItem>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  {tr.critical}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {getConditionBadge(reportData.equipmentCondition)}
        </div>
      </div>

      {/* Maintenance Tasks */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{tr.maintenanceTasks}</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="h-4 w-4 mr-1" />
                {tr.addTask}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.tasksPerformed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tr.noTasksAdded}
            </p>
          ) : (
            <div className="space-y-3">
              {reportData.tasksPerformed.map((task, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => updateTask(index, 'completed', !!checked)}
                    disabled={readOnly}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={task.task}
                      onChange={(e) => updateTask(index, 'task', e.target.value)}
                      placeholder={tr.taskDescription}
                      disabled={readOnly}
                      className={task.completed ? 'line-through text-muted-foreground' : ''}
                    />
                    <Input
                      value={task.notes}
                      onChange={(e) => updateTask(index, 'notes', e.target.value)}
                      placeholder={tr.notesOptional}
                      disabled={readOnly}
                      className="text-sm"
                    />
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(index)}
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

      {/* Measurements */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{tr.measurements}</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addMeasurement}>
                <Plus className="h-4 w-4 mr-1" />
                {tr.addMeasurement}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tr.noMeasurements}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">{tr.parameter}</div>
                <div className="col-span-2">{tr.value}</div>
                <div className="col-span-2">{tr.unit}</div>
                <div className="col-span-2">{tr.normalRange}</div>
                <div className="col-span-2">{tr.status}</div>
                <div className="col-span-1"></div>
              </div>
              {reportData.measurements.map((measurement, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <Input
                      value={measurement.name}
                      onChange={(e) => updateMeasurement(index, 'name', e.target.value)}
                      placeholder="e.g., Pressure"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={measurement.value}
                      onChange={(e) => updateMeasurement(index, 'value', e.target.value)}
                      placeholder="185"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={measurement.unit}
                      onChange={(e) => updateMeasurement(index, 'unit', e.target.value)}
                      placeholder="PSI"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={measurement.normalRange}
                      onChange={(e) => updateMeasurement(index, 'normalRange', e.target.value)}
                      placeholder="175-200"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={measurement.status}
                      onValueChange={(value) => updateMeasurement(index, 'status', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">{tr.normal}</SelectItem>
                        <SelectItem value="warning">{tr.warning}</SelectItem>
                        <SelectItem value="critical">{tr.critical}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMeasurement(index)}
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

      {/* Consumables Used */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{tr.consumablesUsed}</CardTitle>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addConsumable}>
                <Plus className="h-4 w-4 mr-1" />
                {tr.addConsumable}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {reportData.consumablesUsed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tr.noConsumables}
            </p>
          ) : (
            <div className="space-y-2">
              {reportData.consumablesUsed.map((consumable, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={consumable.item}
                    onChange={(e) => updateConsumable(index, 'item', e.target.value)}
                    placeholder={tr.itemName}
                    disabled={readOnly}
                    className="flex-1"
                  />
                  <Input
                    value={consumable.quantity}
                    onChange={(e) => updateConsumable(index, 'quantity', e.target.value)}
                    placeholder={tr.quantity}
                    disabled={readOnly}
                    className="w-32"
                  />
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConsumable(index)}
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

      {/* Next Maintenance Date */}
      <div className="space-y-2">
        <Label htmlFor="nextMaintenanceDate">{tr.nextMaintenanceDate}</Label>
        <Input
          id="nextMaintenanceDate"
          type="date"
          value={reportData.nextMaintenanceDate}
          onChange={(e) => updateField('nextMaintenanceDate', e.target.value)}
          disabled={readOnly}
          className="w-[200px]"
        />
      </div>
    </div>
  )
}
