import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkLoginRateLimit } from './rate-limit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Invalid credentials')
        }

        // Check if this is an impersonation login (special flag)
        const isImpersonation = (credentials as any).impersonation === 'true'

        if (!isImpersonation) {
          // Normal login - require password
          if (!credentials.password) {
            throw new Error('Invalid credentials')
          }

          // Rate limiting: Check login attempts
          const rateLimitResult = await checkLoginRateLimit(credentials.email)
          if (!rateLimitResult.success) {
            throw new Error('Too many login attempts. Please try again in 15 minutes.')
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            contractor: true,
            client: true,
            admin: true,
            teamMember: {
              include: {
                branchAccess: {
                  select: {
                    branchId: true
                  }
                }
              }
            },
          },
        })

        if (!user) {
          throw new Error('User not found')
        }

        if (user.status === 'ARCHIVED') {
          throw new Error('Account has been archived')
        }

        // For impersonation, skip password check
        if (!isImpersonation) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password!,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Invalid password')
          }
        }

        // Activate user on first login if PENDING
        if (user.status === 'PENDING') {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' }
          })
        }

        // Build user object with role-specific info
        const userResponse: {
          id: string
          email: string
          name: string | null
          role: string
          teamMemberRole?: string
          assignedBranchIds?: string[]
          contractorId?: string
          adminRole?: string
          mustChangePassword?: boolean
          isImpersonating?: boolean
          realAdminId?: string
          realAdminEmail?: string
        } = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        }

        // Add team member specific data
        if (user.role === 'TEAM_MEMBER' && user.teamMember) {
          userResponse.teamMemberRole = user.teamMember.teamRole
          userResponse.assignedBranchIds = user.teamMember.branchAccess.map(ba => ba.branchId)
          userResponse.contractorId = user.teamMember.contractorId
        }

        // Add admin specific data
        if (user.role === 'ADMIN' && user.admin) {
          userResponse.adminRole = user.admin.adminRole
        }

        // Add impersonation data if this is an impersonation login
        if (isImpersonation && (credentials as any).realAdminId) {
          userResponse.isImpersonating = true
          userResponse.realAdminId = (credentials as any).realAdminId
          userResponse.realAdminEmail = (credentials as any).realAdminEmail
        }

        return userResponse
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        // Store team member specific data in token
        if ('teamMemberRole' in user) {
          token.teamMemberRole = user.teamMemberRole
        }
        if ('assignedBranchIds' in user) {
          token.assignedBranchIds = user.assignedBranchIds
        }
        if ('contractorId' in user) {
          token.contractorId = user.contractorId
        }
        if ('adminRole' in user) {
          token.adminRole = user.adminRole
        }
        if ('mustChangePassword' in user) {
          token.mustChangePassword = user.mustChangePassword
        }
        // Store impersonation data if present
        if ('isImpersonating' in user) {
          token.isImpersonating = user.isImpersonating
        }
        if ('realAdminId' in user) {
          token.realAdminId = user.realAdminId
        }
        if ('realAdminEmail' in user) {
          token.realAdminEmail = user.realAdminEmail
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        // Add team member specific data to session
        if (token.teamMemberRole) {
          session.user.teamMemberRole = token.teamMemberRole as string
        }
        if (token.assignedBranchIds) {
          session.user.assignedBranchIds = token.assignedBranchIds as string[]
        }
        if (token.contractorId) {
          session.user.contractorId = token.contractorId as string
        }
        if (token.adminRole) {
          session.user.adminRole = token.adminRole as string
        }
        if (token.mustChangePassword !== undefined) {
          session.user.mustChangePassword = token.mustChangePassword as boolean
        }
        // Add impersonation data to session
        if (token.isImpersonating) {
          session.user.isImpersonating = token.isImpersonating as boolean
          session.user.realAdminId = token.realAdminId as string
          session.user.realAdminEmail = token.realAdminEmail as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
