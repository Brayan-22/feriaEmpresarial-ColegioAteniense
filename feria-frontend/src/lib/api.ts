import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: inyectar token ────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: refresh automático en 401 ───────────────────────────────────
let isRefreshing = false
let queue: Array<(token: string) => void> = []

const processQueue = (token: string) => {
  queue.forEach((cb) => cb(token))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const refreshToken = useAuthStore.getState().refreshToken

      // Sin refresh token → logout directo
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Encolar requests mientras se refresca
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newToken: string = data.access_token
        useAuthStore.getState().setAccessToken(newToken)
        processQueue(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        processQueue('')
        toast({ title: 'Sesión expirada', description: 'Inicia sesión nuevamente.', variant: 'error' })
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── Helpers para extraer mensajes de error ────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Error inesperado'
  const data = error.response?.data
  if (data?.detail) return data.detail
  if (data?.error) return data.error
  if (data?.details?.[0]?.message) return data.details[0].message
  return `Error ${error.response?.status ?? 'de red'}`
}

export default api
