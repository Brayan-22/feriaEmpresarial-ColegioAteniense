import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api, { getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import Logo from '../components/Logo'
import type { AuthResponse } from '../types'

interface FormData {
  full_name: string
  email: string
  password: string
  confirm_password: string
}

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const login = useAuthStore((s) => s.login)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()
  const password = watch('password')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      })
      login(res.data.user, res.data.access_token, res.data.refresh_token)
      toast({ title: '¡Bienvenido!', description: `Cuenta creada para ${res.data.user.full_name}.`, variant: 'success' })
      navigate('/landing', { replace: true })
    } catch (err) {
      toast({ title: 'Error al registrarse', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
        <button
          onClick={() => navigate('/login?rol=padre')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <Logo />
        <span className="text-[10px] font-semibold text-[#7B1C2E] bg-[#F4E6E8] px-3 py-1 rounded-full uppercase tracking-widest">
          PADRE / CLIENTE
        </span>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-12 max-w-lg mx-auto w-full">
        <h1 className="text-4xl font-bold mb-2">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-10">
          Regístrate para explorar la feria y pagar con saldo virtual.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="María Rodríguez"
              autoComplete="name"
              {...register('full_name', {
                required: 'El nombre es obligatorio',
                maxLength: { value: 100, message: 'Máximo 100 caracteres' },
              })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors"
            />
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
              })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showPass ? 'ocultar' : 'mostrar'}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
              Confirmar contraseña
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              {...register('confirm_password', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors"
            />
            {errors.confirm_password && (
              <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold text-base hover:bg-[#4a101b] transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-8">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login?rol=padre" className="text-[#7B1C2E] font-semibold underline">
            Inicia sesión
          </Link>
        </p>
      </main>
    </div>
  )
}
