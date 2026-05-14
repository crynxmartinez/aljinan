'use client'

import { ChecklistKanban } from './checklist-kanban'

interface ChecklistsListProps {
  branchId: string
  userRole?: 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER'
}

export function ChecklistsList({ branchId, userRole }: ChecklistsListProps) {
  return <ChecklistKanban branchId={branchId} userRole={userRole} />
}
