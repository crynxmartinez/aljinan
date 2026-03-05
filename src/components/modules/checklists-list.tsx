'use client'

import { ChecklistKanban } from './checklist-kanban'

interface ChecklistsListProps {
  branchId: string
  projectId?: string | null
}

export function ChecklistsList({ branchId, projectId }: ChecklistsListProps) {
  return <ChecklistKanban branchId={branchId} projectId={projectId} />
}
