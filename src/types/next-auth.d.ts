import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      teamMemberRole?: string
      assignedBranchIds?: string[]
      contractorId?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    teamMemberRole?: string
    assignedBranchIds?: string[]
    contractorId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    teamMemberRole?: string
    assignedBranchIds?: string[]
    contractorId?: string
  }
}
