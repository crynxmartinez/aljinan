'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Loader2,
  UserPlus,
  Copy,
  Check,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useTranslation } from '@/lib/i18n/use-translation'

interface AdminData {
  id: string
  userId: string
  adminRole: 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'CUSTOM'
  canManageContractors: boolean
  canManageAdmins: boolean
  canImpersonateUsers: boolean
  canViewAnalytics: boolean
  canManageMessages: boolean
  canManagePlatform: boolean
  user: {
    id: string
    email: string
    name: string | null
    status: string
    createdAt: string
  }
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const ta = t.dashboard.adminAdminsPage
  const permissionLabels: Record<string, string> = {
    canManageContractors: ta.manageContractors,
    canManageAdmins: ta.manageAdminUsers,
    canImpersonateUsers: ta.loginAsUsers,
    canViewAnalytics: ta.viewAnalytics,
    canManageMessages: ta.manageMessages,
    canManagePlatform: ta.platformSettings,
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: ta.superAdmin, color: 'bg-red-100 text-red-800' },
    SUPPORT_ADMIN: { label: ta.supportAdmin, color: 'bg-blue-100 text-blue-800' },
    CUSTOM: { label: ta.custom, color: 'bg-purple-100 text-purple-800' },
  }
  const [admins, setAdmins] = useState<AdminData[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', adminRole: 'SUPPORT_ADMIN' })
  const [createdResult, setCreatedResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingPerms, setEditingPerms] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
        // Initialize editing state
        const perms: Record<string, Record<string, boolean>> = {}
        data.forEach((a: AdminData) => {
          perms[a.id] = {
            canManageContractors: a.canManageContractors,
            canManageAdmins: a.canManageAdmins,
            canImpersonateUsers: a.canImpersonateUsers,
            canViewAnalytics: a.canViewAnalytics,
            canManageMessages: a.canManageMessages,
            canManagePlatform: a.canManagePlatform,
          }
        })
        setEditingPerms(perms)
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setCreatedResult({ email: data.admin.email, tempPassword: data.tempPassword })
      fetchAdmins()
    } catch (err) {
      console.error('Failed to create admin:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleSavePerms = async (adminId: string) => {
    setSaving(adminId)
    try {
      await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          adminRole: 'CUSTOM',
          ...editingPerms[adminId],
        }),
      })
      fetchAdmins()
    } catch (err) {
      console.error('Failed to save permissions:', err)
    } finally {
      setSaving(null)
    }
  }

  const togglePerm = (adminId: string, perm: string) => {
    setEditingPerms((prev) => ({
      ...prev,
      [adminId]: {
        ...prev[adminId],
        [perm]: !prev[adminId]?.[perm],
      },
    }))
  }

  const hasChanges = (admin: AdminData) => {
    const current = editingPerms[admin.id]
    if (!current) return false
    return (
      current.canManageContractors !== admin.canManageContractors ||
      current.canManageAdmins !== admin.canManageAdmins ||
      current.canImpersonateUsers !== admin.canImpersonateUsers ||
      current.canViewAnalytics !== admin.canViewAnalytics ||
      current.canManageMessages !== admin.canManageMessages ||
      current.canManagePlatform !== admin.canManagePlatform
    )
  }

  const resetCreateDialog = () => {
    setCreateOpen(false)
    setNewAdmin({ name: '', email: '', adminRole: 'SUPPORT_ADMIN' })
    setCreatedResult(null)
    setCopied(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{ta.title}</h1>
          <p className="text-muted-foreground mt-1">{ta.subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4 me-2" />
          {ta.addAdmin}
        </Button>
      </div>

      <div className="space-y-4">
        {admins.map((admin) => (
          <Card key={admin.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{admin.user.name || admin.user.email}</CardTitle>
                    <CardDescription>{admin.user.email}</CardDescription>
                  </div>
                </div>
                <Badge className={roleLabels[admin.adminRole]?.color}>
                  {roleLabels[admin.adminRole]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`${admin.id}-${key}`}
                      checked={editingPerms[admin.id]?.[key] ?? false}
                      onCheckedChange={() => togglePerm(admin.id, key)}
                    />
                    <label htmlFor={`${admin.id}-${key}`} className="text-sm cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              {hasChanges(admin) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleSavePerms(admin.id)}
                    disabled={saving === admin.id}
                  >
                    {saving === admin.id ? (
                      <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 me-1" />
                    )}
                    {ta.saveChanges}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && resetCreateDialog()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{createdResult ? ta.adminCreated : ta.addNewAdmin}</DialogTitle>
            <DialogDescription>
              {createdResult
                ? ta.shareCredentials
                : ta.createNewAdminDesc
              }</DialogDescription>
          </DialogHeader>

          {createdResult ? (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">{ta.emailLabel}</p>
                  <p className="text-sm font-mono font-medium">{createdResult.email}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">{ta.tempPassword}</p>
                  <p className="text-sm font-mono font-medium">{createdResult.tempPassword}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdResult.email}\nTemporary Password: ${createdResult.tempPassword}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                variant="outline"
                className="w-full"
              >
                {copied ? <Check className="h-4 w-4 me-2 text-green-600" /> : <Copy className="h-4 w-4 me-2" />}
                {copied ? ta.copied : ta.copyCredentials}
              </Button>
              <DialogFooter>
                <Button onClick={resetCreateDialog} className="w-full">{ta.done}</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{ta.name}</Label>
                <Input
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Admin name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{ta.emailLabel} *</Label>
                <Input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@tasheel.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{ta.rolePreset}</Label>
                <Select value={newAdmin.adminRole} onValueChange={(v) => setNewAdmin({ ...newAdmin, adminRole: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">{ta.superAdminFull}</SelectItem>
                    <SelectItem value="SUPPORT_ADMIN">{ta.supportAdminLimited}</SelectItem>
                    <SelectItem value="CUSTOM">{ta.customConfigure}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetCreateDialog}>{ta.cancel}</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <UserPlus className="h-4 w-4 me-2" />}
                  {creating ? ta.creating : ta.createAdmin}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
