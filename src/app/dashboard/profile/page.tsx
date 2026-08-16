import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompanyInfoCard } from '@/components/team-members/company-info-card'
import { TeamMemberProfileForm } from '@/components/team-members/team-member-profile-form'
import { getTranslations } from '@/lib/i18n/server'

async function getTeamMemberProfile(userId: string) {
  const teamMember = await prisma.teamMember.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      },
      contractor: {
        select: {
          companyName: true,
          companyEmail: true,
          companyPhone: true,
          companyAddress: true,
          contactPersonName: true,
          contactPersonPhone: true,
          contactPersonEmail: true,
          crNumber: true,
          vatNumber: true,
          businessType: true,
          website: true,
        }
      }
    }
  })

  return teamMember
}

export default async function TeamMemberProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Only team members can access this page
  if (session.user.role !== 'TEAM_MEMBER') {
    redirect('/dashboard')
  }

  const teamMember = await getTeamMemberProfile(session.user.id)

  if (!teamMember) {
    redirect('/dashboard')
  }

  const t = await getTranslations()
  const tp = t.dashboard.profilePage

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{tp.title}</h1>
        <p className="text-muted-foreground mt-1">
          {tp.subtitle}
        </p>
      </div>

      <div className="max-w-4xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">{tp.myProfile}</TabsTrigger>
            <TabsTrigger value="company">{tp.company}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <TeamMemberProfileForm teamMember={teamMember} />
          </TabsContent>

          <TabsContent value="company" className="mt-6">
            <CompanyInfoCard contractor={teamMember.contractor} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
