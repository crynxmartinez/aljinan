import { translations, type Locale } from './translations'

let messages: Map<string, { en: string; ar: string }> | undefined

function dictionary() {
  if (messages) return messages
  messages = new Map()
  function visit(en: unknown, ar: unknown) {
    if (typeof en === 'string' && typeof ar === 'string') {
      if (!en.includes('{') && !ar.includes('{')) {
        const pair = { en, ar }
        messages!.set(en, pair)
        messages!.set(ar, pair)
      }
    } else if (en && ar && typeof en === 'object' && typeof ar === 'object') {
      for (const key of Object.keys(en)) visit((en as Record<string, unknown>)[key], (ar as Record<string, unknown>)[key])
    }
  }
  visit(translations.en, translations.ar)
  return messages
}

/** Legacy error strings are only displayed when they exactly match approved copy.
 * Unknown backend details are not safe or reliably translatable; use the shared
 * recovery instruction. New APIs should expose stable error codes instead.
 */
export function localizeError(message: string, locale: Locale): string {
  if (!message) return ''
  return dictionary().get(message)?.[locale] ?? translations[locale].system.serverError
}
