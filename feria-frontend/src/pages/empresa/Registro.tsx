import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Upload, Loader2 } from 'lucide-react'
import Logo from '../../components/Logo'
import { useAuthStore } from '../../store/authStore'
import { useCompanyStore } from '../../store/companyStore'
import { useCategories } from '../../hooks/useCategories'
import api, { getErrorMessage } from '../../lib/api'
import { toast } from '../../store/toastStore'
import type { Company } from '../../types'

const STEPS = [
  'Datos del salón',
  'Productos y precios',
  'Cuenta del líder',
  'Revisión',
]

interface FormValues {
  name: string
  category_id: string
  description: string
}

export default function EmpresaRegistro() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { setCompany } = useCompanyStore()
  const { categories, loading: categoriesLoading } = useCategories()

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { category_id: '' },
  })

  const descValue = watch('description') ?? ''

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      setLogoPreview(b64)
      setLogoBase64(b64)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (values: FormValues) => {
    if (!user) return
    setSubmitting(true)
    try {
      // TODO: replace logo_url with real S3 upload endpoint when available
      const { data: company } = await api.post<Company>('/companies/', {
        name: values.name,
        description: values.description,
        logo_url: logoBase64 ?? null,
        category_id: values.category_id ? parseInt(values.category_id, 10) : null,
      })
      setCompany(user.id, company)
      toast({ title: 'Salón registrado', description: `${company.name} está listo.`, variant: 'success' })
      navigate('/empresa/dashboard', { replace: true })
    } catch (err) {
      toast({ title: 'Error al registrar', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F0F0F] text-white flex flex-col px-7 py-8 shrink-0 fixed h-full">
        <Logo light />

        <div className="flex-1 flex flex-col justify-end">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Edición 2026</p>
          <h2 className="text-2xl font-bold leading-snug mb-3">
            Registra tu salón y comienza a vender.
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Configura tu stand, sube tus productos y empieza a recibir pagos por QR el día de la feria.
          </p>

          <div className="border-t border-gray-800 pt-6 flex flex-col gap-3.5">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-600 w-5">0{i + 1}</span>
                  <span className={`text-sm ${i === 0 ? 'text-white font-medium' : 'text-gray-600'}`}>
                    {step}
                  </span>
                </div>
                {i === 0 && (
                  <span className="text-[9px] font-bold text-[#C9973A] uppercase tracking-widest">
                    En curso
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="flex justify-between items-center px-10 py-5 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Paso 1 de 4</p>
            <h1 className="text-xl font-bold">Datos del salón</h1>
          </div>
          <span className="text-xs text-gray-400">autoguardado · hace 12s</span>
        </header>

        <main className="flex-1 px-10 py-10 max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Foto de portada */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Foto de portada
                </label>
                <span className="text-[10px] text-gray-400">Aparece en el marketplace · 16:9</span>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 border-2 border-dashed border-[#F4E6E8] rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#7B1C2E] transition-colors group relative"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="placeholder-pattern absolute inset-0" />
                )}
                <div className={`relative flex items-center gap-2 text-sm px-4 py-2 rounded-xl ${logoPreview ? 'bg-black/40 text-white' : 'text-[#b08090] group-hover:text-[#7B1C2E]'} transition-colors`}>
                  <Upload size={16} />
                  {logoPreview ? 'Cambiar imagen' : '+ arrastra o haz clic para subir · jpg, png'}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} title="Seleccionar logo" />
            </div>

            {/* Nombre + Categoría */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
                  Nombre del salón
                </label>
                <input
                  {...register('name', { required: 'El nombre es obligatorio' })}
                  placeholder="Ej. 10°B · Atenea"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] bg-white"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
                  Categoría principal
                </label>
                <select
                  {...register('category_id')}
                  disabled={categoriesLoading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] bg-white appearance-none disabled:opacity-50"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Descripción corta
                </label>
                <span className="text-[10px] text-gray-400">Máx. 140 caracteres</span>
              </div>
              <textarea
                {...register('description', {
                  required: 'La descripción es obligatoria',
                  maxLength: { value: 140, message: 'Máximo 140 caracteres' },
                })}
                rows={3}
                placeholder="Tradición y sabor. Describe qué vende tu salón..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] resize-none bg-white"
              />
              <p className="text-right text-[10px] text-gray-400 mt-1">
                {descValue.length} / 140
              </p>
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="border border-gray-200 rounded-xl px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white"
              >
                Guardar y salir
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled
                  className="border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-400 bg-white disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#7B1C2E] text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-[#4a101b] transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? 'Registrando...' : 'Continuar · Productos →'}
                </button>
              </div>
            </div>

          </form>
        </main>
      </div>
    </div>
  )
}
