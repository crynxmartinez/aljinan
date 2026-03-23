'use client'

import { ChecklistKanban } from './checklist-kanban'

interface ChecklistsListProps {
  branchId: string
  projectId?: string | null
  userRole?: 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER'
}

export function ChecklistsList({ branchId, projectId, userRole }: ChecklistsListProps) {
  return <ChecklistKanban branchId={branchId} projectId={projectId} userRole={userRole} />
}
