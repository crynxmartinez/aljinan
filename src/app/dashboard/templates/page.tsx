import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Construction } from 'lucide-react'
import { getTranslations } from '@/lib/i18n/server'

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const t = await getTranslations()
  const tp = t.dashboard.templatesPage

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{tp.title}</h1>
        <p className="text-muted-foreground mt-1">
          {tp.subtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-600" />
            {tp.comingSoon}
          </CardTitle>
          <CardDescription>
            {tp.underConstruction}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {tp.futureUpdate}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {tp.futureDesc}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
