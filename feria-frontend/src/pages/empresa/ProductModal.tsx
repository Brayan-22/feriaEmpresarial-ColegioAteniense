import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2 } from 'lucide-react'
import api, { getErrorMessage } from '../../lib/api'
import { toast } from '../../store/toastStore'
import { useCategories } from '../../hooks/useCategories'
import type { Product } from '../../types'

interface FormValues {
  name: string
  description: string
  price: string
  stock: string
  category_id: string
  active: boolean
}

interface Props {
  companyId: number
  companyName: string
  product?: Product | null
  onClose: () => void
  onSaved: () => void
}

export default function ProductModal({ companyId, companyName, product, onClose, onSaved }: Props) {
  const isEdit = !!product
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { categories, loading: categoriesLoading } = useCategories()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? '',
      stock: product?.stock?.toString() ?? '0',
      category_id: product?.category?.id?.toString() ?? '',
      active: product?.active ?? true,
    },
  })

  const activeValue = watch('active')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      setImagePreview(b64)
      setImageBase64(b64)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (values: FormValues, publish: boolean) => {
    setSubmitting(true)
    try {
      const payload = {
        company_id: companyId,
        name: values.name,
        description: values.description || null,
        price: values.price,
        stock: parseInt(values.stock, 10),
        active: publish,
        category_id: values.category_id ? parseInt(values.category_id, 10) : null,
      }

      let productId: number
      if (isEdit) {
        await api.put(`/products/${product!.id}`, payload)
        productId = product!.id
      } else {
        const { data } = await api.post<{ id: number }>('/products/', payload)
        productId = data.id
      }

      if (imageBase64) {
        await api.post(`/products/${productId}/image`, { image_data: imageBase64 })
      }

      toast({
        title: publish
          ? isEdit ? 'Producto actualizado' : 'Producto publicado'
          : 'Guardado como borrador',
        variant: 'success',
      })
      onSaved()
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#7B1C2E] bg-[#F4E6E8] px-2.5 py-1 rounded-full mb-2">
              {companyName}
            </span>
            <h2 className="text-xl font-bold">{isEdit ? 'Editar producto' : 'Agregar producto'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Aparecerá en tu salón en cuanto lo publiques.</p>
          </div>
          <button onClick={onClose} title="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors mt-1">
            <X size={16} />
          </button>
        </div>

        <form className="px-6 pb-6">
          {/* Foto + Nombre */}
          <div className="flex gap-4 mb-5">
            {/* Foto cuadrada */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-36 h-36 shrink-0 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-[#7B1C2E] transition-colors group relative"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="placeholder-pattern absolute inset-0" />
                  <div className="relative text-center text-xs text-gray-400 group-hover:text-[#7B1C2E] transition-colors px-2">
                    <p>+ subir</p>
                    <p>foto</p>
                    <p className="mt-1 text-[10px]">arrastra aquí</p>
                  </div>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} title="Seleccionar imagen" />

            {/* Nombre + Precio/Stock/Categoría */}
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Nombre del producto
                </label>
                <input
                  {...register('name', { required: 'Obligatorio' })}
                  placeholder="Ej. Tamal tradicional"
                  className="w-full border-2 border-[#7B1C2E] rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Precio</label>
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
                    <span className="text-gray-400 text-sm mr-1">$</span>
                    <input
                      {...register('price', { required: 'Obligatorio', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Inválido' } })}
                      placeholder="8000"
                      className="w-full text-sm font-semibold focus:outline-none"
                    />
                  </div>
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Stock inicial</label>
                  <input
                    {...register('stock', { required: 'Obligatorio', min: { value: 0, message: 'Mín 0' } })}
                    type="number"
                    min={0}
                    placeholder="40"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                  />
                  {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Categoría</label>
                  <select
                    {...register('category_id')}
                    disabled={categoriesLoading}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white appearance-none disabled:opacity-50"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Descripción</label>
              <span className="text-[10px] text-gray-400">opcional</span>
            </div>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Tamal envuelto en hoja de plátano, relleno de pollo, papa y verduras..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7B1C2E] resize-none bg-white"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-6 mb-6">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm">
              <button
                type="button"
                onClick={() => setValue('active', !activeValue)}
                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${activeValue ? 'bg-[#7B1C2E] justify-end' : 'bg-gray-200 justify-start'}`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
              Disponible al publicar
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-gray-400">
              <div className="w-10 h-5 rounded-full bg-gray-200 flex items-center px-0.5 justify-start">
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
              Destacar en marketplace
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit((v) => submit(v, false))}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Guardar como borrador
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit((v) => submit(v, true))}
              className="flex-1 bg-[#7B1C2E] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#4a101b] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
