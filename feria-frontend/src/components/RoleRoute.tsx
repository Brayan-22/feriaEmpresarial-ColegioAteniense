import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types'

interface Props {
  roles: UserRole[]
}

export default function RoleRoute({ roles }: Props) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  if (!roles.includes(user.role.name)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
