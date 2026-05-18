import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

const VARIANT_STYLES = {
  default: 'bg-white border border-gray-200',
  success: 'bg-white border border-green-200',
  error: 'bg-white border border-red-200',
}

const TITLE_STYLES = {
  default: 'text-[#0F0F0F]',
  success: 'text-green-700',
  error: 'text-red-700',
}

export default function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      {toasts.map((t) => {
        const variant = t.variant ?? 'default'
        return (
          <Toast.Root
            key={t.id}
            open
            onOpenChange={(open) => { if (!open) dismiss(t.id) }}
            className={`${VARIANT_STYLES[variant]} rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 w-80 data-[state=open]:animate-slide-in data-[state=closed]:animate-fade-out`}
          >
            <div className="flex-1 min-w-0">
              <Toast.Title className={`text-sm font-semibold ${TITLE_STYLES[variant]}`}>
                {t.title}
              </Toast.Title>
              {t.description && (
                <Toast.Description className="text-xs text-gray-500 mt-0.5">
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"
            >
              <X size={14} />
            </Toast.Close>
          </Toast.Root>
        )
      })}
      <Toast.Viewport className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 outline-none" />
    </Toast.Provider>
  )
}
