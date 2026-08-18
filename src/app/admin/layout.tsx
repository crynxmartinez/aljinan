import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Enforced here rather than only on the login page: a user who navigates directly to a
  // dashboard URL would otherwise skip rotating a temporary password.
  if (session.user.mustChangePassword) {
    redirect('/change-password')
  }

  // Only ADMIN role can access admin pages
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar adminRole={session.user.adminRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userName={session.user.name} />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
