import { Image as ImageIcon } from 'lucide-react'

interface ImagePlaceholderProps {
  className?: string
  dark?: boolean
}

export default function ImagePlaceholder({ className = '', dark = false }: ImagePlaceholderProps) {
  return (
    <div className={`flex items-center justify-center ${dark ? 'bg-gray-300 text-gray-600' : 'bg-gray-100 text-gray-400'} ${className}`}>
      <ImageIcon size={32} />
    </div>
  )
}
