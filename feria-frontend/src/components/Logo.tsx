interface LogoProps {
  light?: boolean
  size?: 'sm' | 'md'
}

export default function Logo({ light = false, size = 'md' }: LogoProps) {
  const textColor = light ? 'text-white' : 'text-[#0F0F0F] dark:text-white'
  const fontSize = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className={`flex items-center gap-2 font-semibold ${textColor} ${fontSize}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="0" y="0" width="9" height="9" fill="currentColor" />
        <rect x="11" y="0" width="9" height="9" fill="currentColor" />
        <rect x="0" y="11" width="9" height="9" fill="currentColor" />
        <rect x="11" y="11" width="9" height="9" fill="currentColor" />
      </svg>
      Feria Empresarial
    </div>
  )
}
