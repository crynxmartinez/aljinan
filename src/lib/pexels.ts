/**
 * Pexels API Integration
 * Used to fetch and download high-quality safety-related images
 */

const PEXELS_API_KEY = 'UPJp8zwqFjKnUL2CUqxcn3U90JtMAhPWUB3ItNMHqu01Sf06gvl0qNVT'

interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[]
  total_results: number
  page: number
  per_page: number
}

/**
 * Search for photos on Pexels
 */
export async function searchPexels(
  query: string,
  perPage: number = 10,
  orientation?: 'landscape' | 'portrait' | 'square'
): Promise<PexelsPhoto[]> {
  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.append('query', query)
  url.searchParams.append('per_page', perPage.toString())
  if (orientation) {
    url.searchParams.append('orientation', orientation)
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: PEXELS_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`)
  }

  const data: PexelsSearchResponse = await response.json()
  return data.photos
}

/**
 * Download a photo from Pexels and return the blob
 */
export async function downloadPhoto(photoUrl: string): Promise<Blob> {
  const response = await fetch(photoUrl)
  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.statusText}`)
  }
  return response.blob()
}

/**
 * Predefined image queries for the marketing website
 */
export const IMAGE_QUERIES = {
  hero: [
    'safety inspector professional',
    'contractor inspection equipment',
    'industrial safety compliance',
    'safety equipment maintenance',
  ],
  features: [
    'contractor tablet checklist',
    'safety equipment inspection',
    'compliance certificate document',
    'business handshake professional',
    'dashboard analytics screen',
    'invoice payment business',
  ],
  backgrounds: [
    'industrial pattern subtle',
    'safety equipment background',
  ],
  about: [
    'safety team professional',
    'contractor team meeting',
  ],
}

/**
 * Helper to get the best quality image URL
 */
export function getBestImageUrl(photo: PexelsPhoto, size: 'large' | 'medium' | 'small' = 'large'): string {
  return photo.src[size]
}
