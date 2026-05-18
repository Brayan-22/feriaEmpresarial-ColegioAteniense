import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

interface ImageWithFallbackProps {
  src: string | null | undefined
  alt: string
  className?: string
}

export default function ImageWithFallback({ src, alt, className = '' }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <ImageIcon size={32} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
