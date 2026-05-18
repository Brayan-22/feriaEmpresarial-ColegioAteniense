import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ShoppingCart } from 'lucide-react'
import Logo from '../components/Logo'
import ImagePlaceholder from '../components/ImagePlaceholder'
import { useProduct } from '../hooks/useProducts'
import { useCompany } from '../hooks/useCompanies'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { toast } from '../store/toastStore'
import { formatCOP, parseAmount } from '../lib/utils'

export default function Scan() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore((s) => s.user)

  const productId = params.get('product_id') ? parseInt(params.get('product_id')!) : null
  const companyId = params.get('company_id') ? parseInt(params.get('company_id')!) : null

  const { product, loading: loadingProduct, error: errorProduct } = useProduct(productId)
  const { company, loading: loadingCompany } = useCompany(companyId)
  const { addItem, items } = useCartStore()

  const isLoading = loadingProduct || loadingCompany
  const alreadyInCart = items.some((i) => i.product_id === productId)

  // If not logged in, send to login with return path
  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })
    }
  }, [user])

  const handleAddToCart = () => {
    if (!product || !company) return
    addItem(
      {
        product_id: product.id,
        company_id: company.id,
        name: product.name,
        price: parseAmount(product.price),
        company_name: company.name,
        image_url: product.image_url,
      },
      () => {
        toast({
          title: 'Carrito de otro salón',
          description: 'Tu carrito tiene productos de otro salón. Vacíalo para continuar.',
          variant: 'error',
        })
      }
    )
    toast({ title: 'Agregado al carrito', variant: 'success' })
    navigate('/carrito')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-center items-center px-6 py-4 border-b border-gray-100">
        <Logo />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10 flex flex-col">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && (errorProduct || !product) && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-gray-500 text-center">{errorProduct ?? 'Producto no encontrado.'}</p>
            <button onClick={() => navigate('/marketplace')} className="text-sm text-[#7B1C2E] underline">
              Explorar la feria
            </button>
          </div>
        )}

        {!isLoading && product && company && (
          <>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Escaneaste un producto</p>
            <h1 className="text-2xl font-bold mb-6">{company.name}</h1>

            <div className="bg-[#F5F4F2] rounded-3xl overflow-hidden mb-6">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-52 object-cover" />
              ) : (
                <ImagePlaceholder className="w-full h-52" />
              )}
              <div className="p-5">
                <p className="font-bold text-xl mb-1">{product.name}</p>
                {product.description && (
                  <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#7B1C2E]">{formatCOP(product.price)}</span>
                  {product.stock === 0 ? (
                    <span className="text-xs text-red-500 font-semibold">Agotado</span>
                  ) : product.stock <= 5 ? (
                    <span className="text-xs text-[#7B1C2E]">Quedan {product.stock}</span>
                  ) : (
                    <span className="text-xs text-green-600">En stock</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || alreadyInCart}
              className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-[#4a101b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              <ShoppingCart size={18} />
              {alreadyInCart ? 'Ya está en tu carrito' : 'Agregar al carrito'}
            </button>

            <button
              onClick={() => navigate(`/salon/${company.id}`)}
              className="w-full border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Ver todos los productos de {company.name}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
