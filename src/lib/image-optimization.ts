/**
 * Image Optimization Utilities
 * 
 * Handles image compression, resizing, and optimization for faster loading
 */

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface OptimizedImage {
  blob: Blob
  width: number
  height: number
  size: number
  format: string
}

/**
 * Compress and optimize an image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'webp',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      // Set canvas size
      canvas.width = width
      canvas.height = height

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }

          resolve({
            blob,
            width,
            height,
            size: blob.size,
            format,
          })
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create multiple sizes of an image (thumbnail, medium, full)
 */
export async function createImageSizes(file: File): Promise<{
  thumbnail: OptimizedImage
  medium: OptimizedImage
  full: OptimizedImage
}> {
  const [thumbnail, medium, full] = await Promise.all([
    optimizeImage(file, { maxWidth: 200, maxHeight: 200, quality: 0.8 }),
    optimizeImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 }),
    optimizeImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.9 }),
  ])

  return { thumbnail, medium, full }
}

/**
 * Get optimized image URL from Vercel Blob with transformations
 */
export function getOptimizedImageUrl(
  blobUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'avif'
  } = {}
): string {
  const { width, height, quality = 85, format = 'auto' } = options

  // Vercel Blob supports URL parameters for optimization
  const url = new URL(blobUrl)
  
  if (width) url.searchParams.set('w', width.toString())
  if (height) url.searchParams.set('h', height.toString())
  if (quality) url.searchParams.set('q', quality.toString())
  if (format) url.searchParams.set('f', format)

  return url.toString()
}

/**
 * Calculate image compression savings
 */
export function calculateSavings(originalSize: number, optimizedSize: number): {
  savedBytes: number
  savedPercentage: number
  compressionRatio: number
} {
  const savedBytes = originalSize - optimizedSize
  const savedPercentage = (savedBytes / originalSize) * 100
  const compressionRatio = originalSize / optimizedSize

  return {
    savedBytes,
    savedPercentage,
    compressionRatio,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(selector: string = 'img[data-lazy]'): void {
  if (typeof window === 'undefined') return

  const images = document.querySelectorAll(selector)
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src
        
        if (src) {
          img.src = src
          img.removeAttribute('data-lazy')
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`))
    img.src = url
  })
}

/**
 * Convert image to WebP format (client-side)
 */
export async function convertToWebP(file: File, quality: number = 0.85): Promise<Blob> {
  const optimized = await optimizeImage(file, { format: 'webp', quality })
  return optimized.blob
}

/**
 * Batch optimize multiple images
 */
export async function batchOptimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<OptimizedImage[]> {
  const results: OptimizedImage[] = []

  for (let i = 0; i < files.length; i++) {
    const optimized = await optimizeImage(files[i], options)
    results.push(optimized)
    
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
  }

  return results
}
