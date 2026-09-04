import { describe, it, expect } from 'vitest'
import { translations, getDirection } from '@/lib/i18n/translations'

/**
 * `en` and `ar` are independent object literals — nothing stops an edit from adding a key
 * to one and forgetting the other, which then ships as a silent blank string in whichever
 * locale is missing it. `translations.ts` also has a compile-time version of this check
 * (`_localeParityCheck`), but that only runs when someone happens to run `tsc`; this makes
 * the same guarantee part of `npm test`.
 */
function collectEmptyLeaves(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => collectEmptyLeaves(item, `${prefix}[${i}]`))
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) =>
      collectEmptyLeaves(v, prefix ? `${prefix}.${key}` : key)
    )
  }
  return value === '' ? [prefix] : []
}

/** Same shape as collectKeyPaths, but array length differences don't count as a mismatch —
 *  only whether the keys *within* corresponding entries line up (the two locales might
 *  reasonably list a different number of testimonials, FAQ items, etc. in the future). */
function collectShapePaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.length ? collectShapePaths(value[0], `${prefix}[]`) : [`${prefix}[]`]
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .flatMap((key) => collectShapePaths((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key))
  }
  return [prefix]
}

describe('translation locale parity', () => {
  it('gives ar and en the exact same key structure', () => {
    const enKeys = collectShapePaths(translations.en).sort()
    const arKeys = collectShapePaths(translations.ar).sort()

    const missingFromAr = enKeys.filter((k) => !arKeys.includes(k))
    const missingFromEn = arKeys.filter((k) => !enKeys.includes(k))

    expect(missingFromAr, `keys present in en but missing from ar: ${missingFromAr.join(', ')}`).toEqual([])
    expect(missingFromEn, `keys present in ar but missing from en: ${missingFromEn.join(', ')}`).toEqual([])
  })

  it('has no empty translation values in either locale', () => {
    expect(collectEmptyLeaves(translations.en)).toEqual([])
    expect(collectEmptyLeaves(translations.ar)).toEqual([])
  })
})

describe('getDirection', () => {
  it('reads right-to-left for Arabic', () => {
    expect(getDirection('ar')).toBe('rtl')
  })

  it('reads left-to-right for English', () => {
    expect(getDirection('en')).toBe('ltr')
  })
})
