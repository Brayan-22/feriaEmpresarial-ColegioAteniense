import { create } from 'zustand'
import type { CartItem } from '../types'

interface CartState {
  items: CartItem[]
  companyId: number | null
  addItem: (item: Omit<CartItem, 'quantity'>, onCompanyConflict?: () => void) => void
  removeItem: (product_id: number) => void
  updateQty: (product_id: number, quantity: number) => void
  clear: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  companyId: null,

  addItem: (item, onCompanyConflict) => {
    const { items, companyId } = get()

    if (companyId !== null && companyId !== item.company_id) {
      onCompanyConflict?.()
      return
    }

    const existing = items.find((i) => i.product_id === item.product_id)
    if (existing) {
      set({
        items: items.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      })
    } else {
      set({
        items: [...items, { ...item, quantity: 1 }],
        companyId: item.company_id,
      })
    }
  },

  removeItem: (product_id) => {
    const items = get().items.filter((i) => i.product_id !== product_id)
    set({ items, companyId: items.length > 0 ? get().companyId : null })
  },

  updateQty: (product_id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(product_id)
      return
    }
    set({
      items: get().items.map((i) =>
        i.product_id === product_id ? { ...i, quantity } : i
      ),
    })
  },

  clear: () => set({ items: [], companyId: null }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
