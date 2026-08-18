import { describe, it, expect } from 'vitest'
import { generateSlug, generateUniqueSlug, isValidSlug } from '@/lib/utils/slugify'

/**
 * Slugs resolve records in the URL, so an empty one is not a cosmetic problem: it produces
 * a link to /dashboard/clients/ which falls through to the list page rather than the record.
 * The original implementation stripped Arabic wholesale, which made that the normal outcome
 * for an Arabic-only company name — in a market where that is the common case.
 */
describe('generateSlug', () => {
  it('slugifies Latin names', () => {
    expect(generateSlug('Al Jinan Fire Safety')).toBe('al-jinan-fire-safety')
    expect(generateSlug('SM Branch (La Pur)')).toBe('sm-branch-la-pur')
  })

  it('transliterates Arabic rather than deleting it', () => {
    const slug = generateSlug('شركة الجنان للسلامة')
    expect(slug.length).toBeGreaterThan(0)
    expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('produces something usable for an Arabic branch name', () => {
    const slug = generateSlug('فرع الرياض')
    expect(slug.length).toBeGreaterThan(0)
    expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('gives different Arabic names different slugs', () => {
    expect(generateSlug('شركة الجنان')).not.toBe(generateSlug('مؤسسة السلامة'))
  })

  it('handles a mixed Arabic and Latin name', () => {
    const slug = generateSlug('Tasheel شركة')
    expect(slug).toMatch(/^[a-z0-9-]+$/)
    expect(slug).toContain('tasheel')
  })

  it('returns empty only when there is nothing usable', () => {
    expect(generateSlug('   ')).toBe('')
    expect(generateSlug('!!!')).toBe('')
    expect(generateSlug('')).toBe('')
  })

  it('never leaves leading, trailing or doubled separators', () => {
    expect(generateSlug('  --Main Office--  ')).toBe('main-office')
    expect(generateSlug('A   B')).toBe('a-b')
  })

  it('always produces a valid slug when it produces one at all', () => {
    for (const name of [
      'Al Jinan', 'شركة الجنان للسلامة', 'Branch #3', 'Café Naïve', '2nd Floor — West Wing',
    ]) {
      const slug = generateSlug(name)
      if (slug) expect(isValidSlug(slug)).toBe(true)
    }
  })
})

describe('generateUniqueSlug', () => {
  it('substitutes a fallback rather than returning empty', () => {
    // An empty slug is what produced the unreachable-record bug.
    expect(generateUniqueSlug('', [])).toBe('item')
  })

  it('leaves a free slug alone', () => {
    expect(generateUniqueSlug('acme', [])).toBe('acme')
  })

  it('suffixes past every taken variant', () => {
    expect(generateUniqueSlug('acme', ['acme'])).toBe('acme-2')
    expect(generateUniqueSlug('acme', ['acme', 'acme-2'])).toBe('acme-3')
  })

  it('does not collide when the fallback itself is taken', () => {
    expect(generateUniqueSlug('', ['item'])).toBe('item-2')
  })
})
