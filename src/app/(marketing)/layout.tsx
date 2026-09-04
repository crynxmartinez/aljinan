import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { displayFont } from '@/lib/fonts'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen flex flex-col ${displayFont.variable}`}>
      <Navbar variant="marketing" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
