'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'
import { translations, getDirection, Locale } from './translations'
import Cookies from 'js-cookie'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translations.en | typeof translations.ar
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const LOCALE_COOKIE = 'tasheel_locale'

export function TranslationProvider({
  children,
  initialLocale = 'ar',
}: {
  children: ReactNode
  /**
   * Resolved from the cookie on the server. Starting from the correct value is what
   * removes the flash of English and the hydration mismatch — do not replace this with a
   * cookie read in an effect.
   */
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    Cookies.set(LOCALE_COOKIE, newLocale, {
      expires: 365,
      sameSite: 'lax',
      secure: window.location.protocol === 'https:',
      path: '/',
    })
    document.documentElement.lang = newLocale
    document.documentElement.dir = getDirection(newLocale)
  }

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  }

  return (
    <TranslationContext.Provider value={value}>
      {/*
        Radix primitives (Select, DropdownMenu, Popover, Dialog...) default their internal
        keyboard/focus order to LTR and don't read document.documentElement.dir — without
        this, arrow-key navigation inside menus moves in the wrong logical direction while
        the UI is visually mirrored for Arabic.
      */}
      <DirectionProvider dir={getDirection(locale)}>
        {children}
      </DirectionProvider>
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
