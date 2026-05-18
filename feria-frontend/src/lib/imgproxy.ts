// Configuración de imgproxy
const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL || 'http://localhost:9999'

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'full'

const SIZES: Record<ImageSize, { width: number; height: number }> = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 200, height: 200 },
  medium: { width: 400, height: 400 },
  large: { width: 600, height: 600 },
  full: { width: 1200, height: 800 },
}

/**
 * Genera URL de imgproxy para transformar imagen
 * @param imageUrl URL original de la imagen
 * @param size Tamaño: 'thumbnail' | 'small' | 'medium' | 'large' | 'full'
 * @param format Formato: 'webp' | 'jpg' | 'png'
 * @param quality Calidad 0-100 (default: 80)
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  size: ImageSize = 'medium',
  format: 'webp' | 'jpg' | 'png' = 'webp',
  quality: number = 80
): string {
  if (!imageUrl) return ''

  const { width, height } = SIZES[size]
  const encodedUrl = Buffer.from(imageUrl).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${IMGPROXY_URL}/unsafe/${width}x${height}/smart/${format}/q:${quality}/${encodedUrl}`
}

/**
 * Genera múltiples tamaños de una imagen para srcset
 */
export function getImageSrcSet(imageUrl: string | null | undefined): string {
  if (!imageUrl) return ''
  return [
    `${getImageUrl(imageUrl, 'small')} 200w`,
    `${getImageUrl(imageUrl, 'medium')} 400w`,
    `${getImageUrl(imageUrl, 'large')} 600w`,
  ].join(', ')
}
