import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Construction } from 'lucide-react'

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Manage reusable templates for contracts, checklists, and more
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-600" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            This page is under construction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              Templates functionality will be available in a future update.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You&apos;ll be able to create and manage reusable templates for projects, checklists, and contracts here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
