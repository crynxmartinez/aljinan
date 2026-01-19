'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserCog,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  Wrench,
  MapPin,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TeamMemberDialog } from './team-member-dialog'

interface Branch {
  id: string
  name: string
  client: {
    id: string
    companyName: string
  }
}

interface BranchAccess {
  id: string
  branch: Branch
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

interface Client {
  id: string
  companyName: string
  branches: {
    id: string
    name: string
  }[]
}

interface TeamListProps {
  teamMembers: TeamMember[]
  clients: Client[]
}

export function TeamList({ teamMembers: initialTeamMembers, clients }: TeamListProps) {
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const handleCreate = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setDialogOpen(true)
  }

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!memberToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/team-members/${memberToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTeamMembers(prev => prev.filter(m => m.id !== memberToDelete.id))
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting team member:', error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    }
  }

  const handleSuccess = (member: TeamMember & { tempPassword?: string }) => {
    if (member.tempPassword) {
      setTempPassword(member.tempPassword)
    }
    
    if (editingMember) {
      setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m))
    } else {
      setTeamMembers(prev => [member, ...prev])
    }
    
    setDialogOpen(false)
    setEditingMember(null)
    router.refresh()
  }

  const copyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const closeTempPasswordDialog = () => {
    setTempPassword(null)
    setCopiedPassword(false)
  }

  const getRoleIcon = (role: 'SUPERVISOR' | 'TECHNICIAN') => {
    return role === 'SUPERVISOR' ? Shield : Wrench
  }

  const getRoleBadgeVariant = (role: 'SUPERVISOR' | 'TECHNICIAN') => {
    return role === 'SUPERVISOR' ? 'default' : 'secondary'
  }

  // Group branches by client for display
  const groupBranchesByClient = (branchAccess: BranchAccess[]) => {
    const grouped: Record<string, { clientName: string; branches: string[] }> = {}
    
    branchAccess.forEach(({ branch }) => {
      if (!grouped[branch.client.id]) {
        grouped[branch.client.id] = {
          clientName: branch.client.companyName,
          branches: []
        }
      }
      grouped[branch.client.id].branches.push(branch.name)
    })
    
    return Object.values(grouped)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your supervisors and technicians
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No team members yet</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Add supervisors and technicians to help manage your client branches.
            </p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.teamRole)
            const groupedBranches = groupBranchesByClient(member.branchAccess)
            
            return (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <RoleIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {member.user.name || member.user.email}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {member.user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(member.teamRole)}>
                      {member.teamRole}
                    </Badge>
                    {member.jobTitle && (
                      <span className="text-xs text-muted-foreground">
                        {member.jobTitle}
                      </span>
                    )}
                  </div>
                  
                  {/* Branch Access */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Branch Access ({member.branchAccess.length})
                    </p>
                    <div className="space-y-1">
                      {groupedBranches.map((group, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium">{group.clientName}:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {group.branches.map((branch, bIdx) => (
                              <Badge key={bIdx} variant="outline" className="text-xs py-0">
                                <MapPin className="mr-1 h-3 w-3" />
                                {branch}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teamMember={editingMember}
        clients={clients}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {memberToDelete?.user.name || memberToDelete?.user.email}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Temp Password Dialog */}
      <AlertDialog open={!!tempPassword} onOpenChange={() => closeTempPasswordDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Team Member Created</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  The team member has been created successfully. Share the following temporary password with them:
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 font-mono text-lg">{tempPassword}</code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                  >
                    {copiedPassword ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure to save this password. It will not be shown again.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeTempPasswordDialog}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
