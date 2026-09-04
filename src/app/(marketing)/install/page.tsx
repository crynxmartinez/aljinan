import { Metadata } from 'next'
import { InstallContent } from './install-content'
import { getLocale, getTranslationsForLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = getTranslationsForLocale(locale).seo.install

  return {
    title: seo.title,
    description: seo.description,
  }
}

export default function InstallPage() {
  return <InstallContent />
}
