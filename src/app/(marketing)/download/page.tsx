import { Metadata } from 'next'
import { DownloadContent } from './download-content'

export const metadata: Metadata = {
  title: 'Download Tasheel App | Mobile & Desktop',
  description: 'Download Tasheel app for Android, Windows, and Linux. Install the safety management platform on your device.',
}

export default function DownloadPage() {
  return <DownloadContent />
}
