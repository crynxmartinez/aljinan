'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Locale } from './translations'
import Cookies from 'js-cookie'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translations.en | typeof translations.ar
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const LOCALE_COOKIE = 'tasheel_locale'

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const savedLocale = Cookies.get(LOCALE_COOKIE) as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ar')) {
      setLocaleState(savedLocale)
      document.documentElement.lang = savedLocale
      document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr'
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    Cookies.set(LOCALE_COOKIE, newLocale, { expires: 365 })
    document.documentElement.lang = newLocale
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
  }

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
