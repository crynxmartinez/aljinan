import { Metadata } from 'next'
import { InstallContent } from './install-content'

export const metadata: Metadata = {
  title: 'Install Tasheel | Desktop App',
  description: 'Install Tasheel desktop app for Windows and Linux. Mobile apps coming soon.',
}

export default function InstallPage() {
  return <InstallContent />
}
