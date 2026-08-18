import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mb-3 text-2xl font-bold">Page not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you are looking for does not exist, or you may not have access to it.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
