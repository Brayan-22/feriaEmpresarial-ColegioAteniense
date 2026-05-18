import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Company } from '../types'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Company[]>('/companies/')
      .then(({ data }) => setCompanies(data))
      .catch(() => setError('No se pudieron cargar las empresas'))
      .finally(() => setLoading(false))
  }, [])

  return { companies, loading, error }
}

export function useCompany(id: number | null) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()

    api.get<Company>(`/companies/${id}`, { signal: controller.signal })
      .then(({ data }) => setCompany(data))
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') {
          setError('Empresa no encontrada')
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [id])

  return { company, loading, error }
}
