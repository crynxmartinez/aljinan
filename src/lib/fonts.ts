import { Plus_Jakarta_Sans } from 'next/font/google'

/**
 * Display headline font for the marketing site only (homepage, features, about, contact).
 * Scoped via this CSS variable rather than swapping the app-wide font, so the authenticated
 * dashboard/admin/portal keep their existing system-font look untouched.
 */
export const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})
