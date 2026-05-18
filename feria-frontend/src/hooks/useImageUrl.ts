import { useState, useEffect } from 'react'
import api from '../lib/api'

/**
 * Hook para obtener URL prefirmada de S3
 * Obtiene la URL desde el endpoint del backend
 */
export function useImageUrl(endpoint: string) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!endpoint) return

    const controller = new AbortController()
    setLoading(true)

    api
      .get<{ image_url: string; expires_in: number }>(endpoint, {
        signal: controller.signal,
      })
      .then(({ data }) => setImageUrl(data.image_url))
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') {
          setError('No se pudo cargar la imagen')
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [endpoint])

  return { imageUrl, loading, error }
}

