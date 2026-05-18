import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { Balance } from '../types'

export function useBalance() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) {
      setBalance(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    api
      .get<Balance>('/balances/me', { signal: controller.signal })
      .then(({ data }) => setBalance(data))
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') {
          setBalance(null)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [user])

  return { balance, loading }
}

