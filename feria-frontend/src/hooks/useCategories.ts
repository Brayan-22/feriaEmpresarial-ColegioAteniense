import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Category } from '../types'

let cache: Category[] | null = null
let pending: Promise<Category[]> | null = null

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading] = useState(cache === null)

  useEffect(() => {
    if (cache !== null) return

    if (!pending) {
      pending = api
        .get<Category[]>('/categories/')
        .then(({ data }) => {
          cache = data
          return data
        })
        .catch(() => {
          pending = null
          return []
        })
    }

    pending.then((data) => {
      setCategories(data)
      setLoading(false)
    })
  }, [])

  return { categories, loading }
}
