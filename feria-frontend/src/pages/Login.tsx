import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api, { getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import type { AuthResponse, UserRole } from '../types'

interface FormData {
  email: string
  password: string
  remember: boolean
}

const ROLE_LABELS: Record<string, string> = {
  padre: 'PADRE / CLIENTE',
  empresa: 'EMPRESA',
  admin: 'ADMIN',
}

const ROLE_REDIRECT: Record<UserRole, string> = {
  user: '/landing',
  company: '/empresa/dashboard',
  admin: '/admin',
}

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const rol = params.get('rol') ?? 'padre'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((s) => s.login)
  const redirect = params.get('redirect')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { remember: true },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      })
      login(res.data.user, res.data.access_token, res.data.refresh_token)
      const destination = redirect && res.data.user.role.name === 'user' ? redirect : ROLE_REDIRECT[res.data.user.role.name]
      navigate(destination, { replace: true })
    } catch (err) {
      toast({ title: 'Error al iniciar sesión', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#111111] dark:text-zinc-100 flex flex-col transition-colors">
      <header className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-[10px] font-semibold text-[#7B1C2E] bg-[#F4E6E8] dark:bg-[#2A1015] px-3 py-1 rounded-full uppercase tracking-widest">
            {ROLE_LABELS[rol] ?? 'ACCESO'}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-12 max-w-lg mx-auto w-full">
        <h1 className="text-4xl font-bold mb-2">Inicia sesión</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-10">
          {rol === 'padre'
            ? 'Con el correo del padre registrado en secretaría.'
            : rol === 'empresa'
            ? 'Con las credenciales de tu salón empresa.'
            : 'Panel de coordinación — acceso restringido.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2 block">
              Correo
            </label>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
              })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#7B1C2E] dark:focus:border-[#C9973A] transition-colors"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2 block">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#7B1C2E] dark:focus:border-[#C9973A] transition-colors pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPass ? 'ocultar' : 'mostrar'}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
              <input type="checkbox" {...register('remember')} className="accent-[#7B1C2E]" />
              Recordarme
            </label>
            <span className="text-sm text-[#7B1C2E] dark:text-[#C9973A] font-medium cursor-pointer hover:underline">
              ¿Olvidaste tu clave?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold text-base hover:bg-[#4a101b] transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        {rol === 'padre' && (
          <p className="text-center text-sm text-gray-400 dark:text-zinc-500 mt-8">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-[#7B1C2E] dark:text-[#C9973A] font-semibold underline">
              Regístrate
            </Link>
          </p>
        )}
      </main>
    </div>
  )
}
