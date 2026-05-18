interface PrimaryCTAProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}
export function PrimaryCTA({ children, onClick, className, icon }: PrimaryCTAProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-[#8F1731] text-white rounded-full px-6 py-4 font-semibold flex items-center justify-between hover:opacity-90 active:scale-95 transition-all shadow-md ${className}`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  )
}