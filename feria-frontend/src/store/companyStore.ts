import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company } from '../types'

// Keyed by userId so multiple company accounts don't conflict
interface CompanyStore {
  companies: Record<string, Company>
  setCompany: (userId: string, company: Company) => void
  getCompany: (userId: string) => Company | null
  clearCompany: (userId: string) => void
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      companies: {},
      setCompany: (userId, company) =>
        set((s) => ({ companies: { ...s.companies, [userId]: company } })),
      getCompany: (userId) => get().companies[userId] ?? null,
      clearCompany: (userId) =>
        set((s) => {
          const next = { ...s.companies }
          delete next[userId]
          return { companies: next }
        }),
    }),
    { name: 'feria-company' }
  )
)
