import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch | Tasheel',
  description: 'Contact Tasheel for questions about our safety management platform. Email info@tasheel.sa or call +966 50 123 4567. Located in Riyadh, Saudi Arabia.',
  keywords: 'contact tasheel, safety platform support, contractor software help',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
