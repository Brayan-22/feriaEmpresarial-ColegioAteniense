import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { Product } from '../types'

export function useProductsByCompany(companyId: number | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    api.get<Product[]>(`/products/company/${companyId}`)
      .then(({ data }) => setProducts(data.filter((p) => p.active)))
      .catch(() => setError('No se pudieron cargar los productos'))
      .finally(() => setLoading(false))
  }, [companyId])

  return { products, loading, error }
}

// All products (including inactive) for the vendor dashboard
export function useCompanyProducts(companyId: number | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    if (!companyId) return
    setLoading(true)
    api.get<Product[]>(`/products/company/${companyId}`)
      .then(({ data }) => setProducts(data))
      .catch(() => setError('No se pudieron cargar los productos'))
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { products, loading, error, refetch: fetch }
}

export function useProduct(productId: number | null) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    api.get<Product>(`/products/${productId}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setError('Producto no encontrado'))
      .finally(() => setLoading(false))
  }, [productId])

  return { product, loading, error }
}
