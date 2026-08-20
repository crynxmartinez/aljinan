import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkLoginRateLimit, recordFailedLogin } from './rate-limit'

/**
 * One message for every credential failure. NextAuth surfaces the thrown message in the
 * error redirect, so distinguishing 'no such user' from 'wrong password' tells an
 * attacker which email addresses are real.
 */
const INVALID_CREDENTIALS = 'Invalid email or password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // Single-use impersonation grant issued by /api/admin/impersonate. Declared so it
        // is typed; it is only ever accepted after being verified against the database.
        grant: { label: 'Impersonation grant', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error(INVALID_CREDENTIALS)
        }

        // An impersonation grant is the ONLY way to sign in without a password, and it is
        // never something the caller can assert about itself: the token must exist in the
        // database, be unexpired, be unconsumed, and belong to the account being signed
        // into. It is consumed here so it cannot be replayed.
        const grantToken = typeof credentials.grant === 'string' ? credentials.grant : null
        let impersonation: { adminUserId: string; adminEmail: string } | null = null

        if (grantToken) {
          const grant = await prisma.impersonationGrant.findUnique({
            where: { token: grantToken },
            include: { targetUser: { select: { id: true, email: true } } },
          })

          if (
            !grant ||
            grant.consumedAt !== null ||
            grant.expiresAt < new Date() ||
            grant.targetUser.email.toLowerCase() !== credentials.email.toLowerCase()
          ) {
            throw new Error(INVALID_CREDENTIALS)
          }

          const consumed = await prisma.impersonationGrant.updateMany({
            where: { id: grant.id, consumedAt: null },
            data: { consumedAt: new Date() },
          })

          // Lost the race against a concurrent redemption of the same grant.
          if (consumed.count !== 1) {
            throw new Error(INVALID_CREDENTIALS)
          }

          impersonation = { adminUserId: grant.adminUserId, adminEmail: grant.adminEmail }
        } else {
          if (!credentials.password) {
            throw new Error(INVALID_CREDENTIALS)
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
          await recordFailedLogin(credentials.email)
          throw new Error(INVALID_CREDENTIALS)
        }

        if (user.status === 'ARCHIVED') {
          throw new Error('Account has been archived')
        }

        if (!impersonation) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password!,
            user.password
          )

          if (!isPasswordValid) {
            await recordFailedLogin(credentials.email)
            throw new Error(INVALID_CREDENTIALS)
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
        } = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
          sessionVersion: user.sessionVersion,
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

        // Sourced from the redeemed grant, never from the request body.
        if (impersonation) {
          userResponse.isImpersonating = true
          userResponse.realAdminId = impersonation.adminUserId
          userResponse.realAdminEmail = impersonation.adminEmail
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
      // Second and later calls: no `user`, so this is an existing token being reused.
      // Re-read the stored version and reject the token if it has moved on. Without this
      // a 24h JWT survives a password reset, a role change and a branch-access
      // revocation — the holder keeps their old rights for a full day.
      if (!user && token.id) {
        // Throttle DB checks: only re-validate every 60 seconds per token.
        // The JWT is reused across multiple server requests on a single page load,
        // so this prevents N DB hits per page render.
        const now = Math.floor(Date.now() / 1000)
        if (token.lastCheckedAt && (now - (token.lastCheckedAt as number)) < 60) {
          // Still within the throttle window — skip the DB check
          if (token.invalidated) {
            return token
          }
          return token
        }
        token.lastCheckedAt = now

        const current = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true, status: true, role: true },
        })

        if (
          !current ||
          current.status === 'ARCHIVED' ||
          (token.sessionVersion ?? 0) !== current.sessionVersion
        ) {
          token.invalidated = true
          return token
        }

        token.role = current.role
      }

      if (user) {
        token.id = user.id
        token.role = user.role
        if ('sessionVersion' in user) {
          token.sessionVersion = user.sessionVersion
        }
        if ('status' in user) {
          token.status = user.status
        }
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
      // getServerSession returns null for a session object with no keys, and useSession
      // reports unauthenticated. This is what makes a revoked token stop working.
      if (token.invalidated) {
        return {} as typeof session
      }

      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        if (token.status) {
          session.user.status = token.status as string
        }
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
