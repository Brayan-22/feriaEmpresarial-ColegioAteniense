import { create } from 'zustand'

export type ToastVariant = 'default' | 'success' | 'error'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastState {
  toasts: ToastItem[]
  add: (t: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: `${Date.now()}-${Math.random()}` }],
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (t: Omit<ToastItem, 'id'>) =>
  useToastStore.getState().add(t)
