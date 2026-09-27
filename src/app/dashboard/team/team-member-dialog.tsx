'use client'
import { LocalizedError } from '@/components/localized-error'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

interface Branch {
  id: string
  name: string
}

interface Client {
  id: string
  companyName: string
  branches: Branch[]
}

interface BranchAccess {
  id: string
  branch: {
    id: string
    name: string
    client: {
      id: string
      companyName: string
    }
  }
}

interface TeamMember {
  id: string
  teamRole: 'SUPERVISOR' | 'TECHNICIAN'
  jobTitle: string | null
  phone: string | null
  createdAt: Date | string
  user: {
    email: string
    name: string | null
    status: string
  }
  branchAccess: BranchAccess[]
}

interface TeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMember: TeamMember | null
  clients: Client[]
  onSuccess: (member: TeamMember & { tempPassword?: string }) => void
}

export function TeamMemberDialog({
  open,
  onOpenChange,
  teamMember,
  clients,
  onSuccess,
}: TeamMemberDialogProps) {
  const { t } = useTranslation()
  const td = t.dashboard.teamMemberDialog
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [teamRole, setTeamRole] = useState<'SUPERVISOR' | 'TECHNICIAN'>('TECHNICIAN')
  const [jobTitle, setJobTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])

  const isEditing = !!teamMember

  // Reset form when dialog opens/closes or teamMember changes
  useEffect(() => {
    if (open) {
      if (teamMember) {
        setName(teamMember.user.name || '')
        setEmail(teamMember.user.email)
        setTeamRole(teamMember.teamRole)
        setJobTitle(teamMember.jobTitle || '')
        setPhone(teamMember.phone || '')
        setSelectedBranchIds(teamMember.branchAccess.map(ba => ba.branch.id))
      } else {
        setName('')
        setEmail('')
        setTeamRole('TECHNICIAN')
        setJobTitle('')
        setPhone('')
        setSelectedBranchIds([])
      }
      setError(null)
    }
  }, [open, teamMember])

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds(prev =>
      prev.includes(branchId)
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    )
  }

  const toggleAllClientBranches = (client: Client, checked: boolean) => {
    const clientBranchIds = client.branches.map(b => b.id)
    if (checked) {
      setSelectedBranchIds(prev => [...new Set([...prev, ...clientBranchIds])])
    } else {
      setSelectedBranchIds(prev => prev.filter(id => !clientBranchIds.includes(id)))
    }
  }

  const isClientFullySelected = (client: Client) => {
    return client.branches.every(b => selectedBranchIds.includes(b.id))
  }

  const isClientPartiallySelected = (client: Client) => {
    const selected = client.branches.filter(b => selectedBranchIds.includes(b.id))
    return selected.length > 0 && selected.length < client.branches.length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(td.errorNameRequired)
      return
    }

    if (!isEditing && !email.trim()) {
      setError(td.errorEmailRequired)
      return
    }

    if (selectedBranchIds.length === 0) {
      setError(td.errorBranchRequired)
      return
    }

    setLoading(true)

    try {
      const url = isEditing
        ? `/api/team-members/${teamMember.id}`
        : '/api/team-members'
      
      const method = isEditing ? 'PATCH' : 'POST'
      
      const body = isEditing
        ? {
            name,
            teamRole,
            jobTitle: jobTitle || null,
            phone: phone || null,
            branchIds: selectedBranchIds,
          }
        : {
            name,
            email,
            teamRole,
            jobTitle: jobTitle || null,
            phone: phone || null,
            branchIds: selectedBranchIds,
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || td.errorSaveFailed)
        return
      }

      onSuccess(data)
    } catch (err) {
      console.error('Error saving team member:', err)
      setError(td.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? td.editTitle : td.addTitle}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? td.editDescription
                : td.addDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{td.nameLabel}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={td.namePlaceholder}
              />
            </div>

            {/* Email (only for new members) */}
            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="email">{td.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={td.emailPlaceholder}
                />
              </div>
            )}

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">{td.roleLabel}</Label>
              <Select value={teamRole} onValueChange={(v) => setTeamRole(v as 'SUPERVISOR' | 'TECHNICIAN')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">
                    {td.supervisorOption}
                  </SelectItem>
                  <SelectItem value="TECHNICIAN">
                    {td.technicianOption}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job Title */}
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">{td.jobTitleLabel}</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={td.jobTitlePlaceholder}
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">{td.phoneLabel}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={td.phonePlaceholder}
              />
            </div>

            {/* Branch Access */}
            <div className="grid gap-2">
              <Label>{td.branchAccessLabel}</Label>
              <p className="text-xs text-muted-foreground">
                {td.branchAccessHint}
              </p>
              <ScrollArea className="h-[200px] rounded-md border p-3">
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {td.noClientsWithBranches}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div key={client.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={isClientFullySelected(client)}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLButtonElement).dataset.state = 
                                  isClientPartiallySelected(client) ? 'indeterminate' : 
                                  isClientFullySelected(client) ? 'checked' : 'unchecked'
                              }
                            }}
                            onCheckedChange={(checked) => 
                              toggleAllClientBranches(client, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`client-${client.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {client.companyName}
                          </Label>
                        </div>
                        <div className="ms-6 space-y-1">
                          {client.branches.map((branch) => (
                            <div key={branch.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`branch-${branch.id}`}
                                checked={selectedBranchIds.includes(branch.id)}
                                onCheckedChange={() => toggleBranch(branch.id)}
                              />
                              <Label
                                htmlFor={`branch-${branch.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {branch.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {selectedBranchIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {(selectedBranchIds.length === 1 ? td.branchSelectedSingular : td.branchSelectedPlural)
                    .replace('{count}', String(selectedBranchIds.length))}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive"><LocalizedError message={error} /></p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {td.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isEditing ? td.saveChanges : td.createTeamMember}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
