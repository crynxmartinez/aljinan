/**
 * Arabic letter to Latin. Not a scholarly transliteration — the goal is a stable, typeable
 * URL segment for a market whose company names are frequently Arabic-only.
 */
const ARABIC_TRANSLITERATION: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ء': '', 'ؤ': 'u', 'ئ': 'i',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
}

/**
 * Generate a URL-friendly slug from a string.
 *
 * Arabic used to be stripped wholesale, so an Arabic-only company or branch name produced
 * an empty slug and a link to /dashboard/clients/ — a route that resolves to the list page
 * rather than the record. Arabic is now transliterated. Input with no usable characters
 * still yields an empty string; generateUniqueSlug substitutes a fallback for that case.
 */
export function generateSlug(text: string): string {
  if (!text) return ''

  const transliterated = Array.from(text)
    .map(ch => ARABIC_TRANSLITERATION[ch] ?? ch)
    .join('')

  return transliterated
    .toLowerCase()
    .trim()
    // Arabic diacritics and tatweel carry no sound for our purposes
    .replace(/[ؐ-ًؚ-ٰٟـ]/g, '')
    // anything still non-Latin becomes a separator
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

/**
 * Generate a unique slug by appending a number if needed.
 *
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Slugs already in use within the relevant scope
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  // An empty base would produce a URL that resolves to the list page, not the record.
  const base = baseSlug || 'item'

  let slug = base
  let counter = 2

  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`
    counter++
  }

  return slug
}

/**
 * Validate if a string is a valid slug format
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
