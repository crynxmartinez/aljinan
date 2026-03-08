import { Navbar } from '@/components/marketing/navbar'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="auth" showHomeButton={true} />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
        {children}
      </main>
    </div>
  )
}
