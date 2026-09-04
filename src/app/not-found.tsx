import Link from 'next/link'
import { getTranslations } from '@/lib/i18n/server'

export default async function NotFound() {
  const t = await getTranslations()
  const tr = t.pages.notFound

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 font-mono text-sm text-muted-foreground">{tr.code}</p>
        <h1 className="mb-3 text-2xl font-bold">{tr.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {tr.description}
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          {tr.backHome}
        </Link>
      </div>
    </div>
  )
}
