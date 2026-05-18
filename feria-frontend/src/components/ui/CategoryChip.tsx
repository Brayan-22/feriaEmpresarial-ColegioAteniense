interface CategoryChipProps {
  label: string
  active?: boolean
  onClick?: () => void
}
export function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'
      }`}
    >
      {label}
    </button>
  )
}