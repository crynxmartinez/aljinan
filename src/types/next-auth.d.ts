import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      status?: string
      teamMemberRole?: string
      assignedBranchIds?: string[]
      contractorId?: string
      adminRole?: string
      mustChangePassword?: boolean
      isImpersonating?: boolean
      realAdminId?: string
      realAdminEmail?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    status?: string
    teamMemberRole?: string
    assignedBranchIds?: string[]
    contractorId?: string
    adminRole?: string
    mustChangePassword?: boolean
    sessionVersion?: number
    isImpersonating?: boolean
    realAdminId?: string
    realAdminEmail?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    /** Set when the stored sessionVersion has moved on; the session callback drops it. */
    invalidated?: boolean
    status?: string
    teamMemberRole?: string
    assignedBranchIds?: string[]
    contractorId?: string
    adminRole?: string
    mustChangePassword?: boolean
    sessionVersion?: number
    isImpersonating?: boolean
    realAdminId?: string
    realAdminEmail?: string
    lastCheckedAt?: number
  }
}
