import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={`p-2 rounded-lg transition-colors ${
        onDark
          ? 'text-gray-400 hover:bg-white/10'
          : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
