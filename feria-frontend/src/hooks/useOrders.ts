import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { Order } from '../types'

export function useCompanyOrders(companyId: number | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    if (!companyId) return
    setLoading(true)
    api
      .get<Order[]>(`/orders/company?company_id=${companyId}&skip=0&limit=100`)
      .then(({ data }) => setOrders(data))
      .catch(() => setError('No se pudieron cargar las órdenes'))
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { orders, loading, error, refetch: fetch }
}
