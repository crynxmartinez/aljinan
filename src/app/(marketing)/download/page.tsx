import { Metadata } from 'next'
import { DownloadContent } from './download-content'
import { getLocale, getTranslationsForLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = getTranslationsForLocale(locale).seo.download

  return {
    title: seo.title,
    description: seo.description,
  }
}

export default function DownloadPage() {
  return <DownloadContent />
}
