import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            contractor: true,
            client: true,
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

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        // Activate user on first login if PENDING
        if (user.status === 'PENDING') {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' }
          })
        }

        // Build user object with team member info if applicable
        const userResponse: {
          id: string
          email: string
          name: string | null
          role: string
          teamMemberRole?: string
          assignedBranchIds?: string[]
          contractorId?: string
        } = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }

        // Add team member specific data
        if (user.role === 'TEAM_MEMBER' && user.teamMember) {
          userResponse.teamMemberRole = user.teamMember.teamRole
          userResponse.assignedBranchIds = user.teamMember.branchAccess.map(ba => ba.branchId)
          userResponse.contractorId = user.teamMember.contractorId
        }

        return userResponse
      },
    }),
  ],
  session: {
    strategy: 'jwt',
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
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
