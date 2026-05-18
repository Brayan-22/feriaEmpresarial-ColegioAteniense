import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Unauthorized() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const goHome = () => {
    if (!user) return navigate('/')
    if (user.role.name === 'company') return navigate('/empresa/dashboard')
    if (user.role.name === 'admin') return navigate('/admin')
    navigate('/landing')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <ShieldX size={32} className="text-red-600" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Acceso restringido</h1>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-sm">
        No tienes permiso para ver esta página con tu rol actual.
      </p>
      <button
        onClick={goHome}
        className="bg-[#7B1C2E] text-white rounded-2xl px-8 py-3 font-semibold hover:bg-[#4a101b] transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  )
}
