import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, Minus, ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'
import ImageWithFallback from '../components/ImageWithFallback'
import { useCompany } from '../hooks/useCompanies'
import { useProductsByCompany } from '../hooks/useProducts'
import { useBalance } from '../hooks/useBalance'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { formatCOP, parseAmount } from '../lib/utils'
import type { Product } from '../types'

export default function SalonView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const companyId = id ? parseInt(id) : null

  const { company, loading: loadingCompany, error: errorCompany } = useCompany(companyId)
  const { products, loading: loadingProducts } = useProductsByCompany(companyId)
  const { balance } = useBalance()
  const user = useAuthStore((s) => s.user)

  const { items, addItem, updateQty, itemCount, total, companyId: cartCompanyId } = useCartStore()

  const getQty = (productId: number) =>
    items.find((i) => i.product_id === productId)?.quantity ?? 0

  const handleAdd = (product: Product) => {
    if (!user) {
      toast({
        title: 'Inicia sesión para comprar',
        description: 'Necesitas autenticarte para agregar productos al carrito.',
        variant: 'error',
      })
      navigate('/rol-selection')
      return
    }

    if (!company) return
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
  }

  const cartCount = itemCount()
  const cartTotal = total()
  const isLoading = loadingCompany || loadingProducts

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <Logo />
        <div className="flex items-center gap-3">
          {user && balance && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">SALDO</span>
              <span className="text-sm font-bold text-white bg-[#C9973A] px-2.5 py-1 rounded-lg">
                {formatCOP(balance.amount)}
              </span>
            </div>
          )}
          {!user && (
            <button
              onClick={() => navigate('/rol-selection')}
              className="text-xs font-semibold bg-[#C9973A] text-white px-3 py-1 rounded-lg hover:bg-[#b8863a] transition-colors"
            >
              Ingresar
            </button>
          )}
        </div>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {errorCompany && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-gray-500">{errorCompany}</p>
          <button onClick={() => navigate('/marketplace')} className="text-sm text-[#7B1C2E] underline">
            Volver al marketplace
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && company && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
          {/* Cover */}
          {company.logo_url ? (
            <ImageWithFallback
              src={company.logo_url}
              alt={company.name}
              className="w-full h-48 sm:h-64 rounded-2xl object-cover mb-6"
            />
          ) : (
            <div className="w-full h-48 sm:h-64 rounded-2xl mb-6 bg-gray-100" />
          )}

          {/* Info empresa */}
          <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
          {company.description && (
            <p className="text-sm text-gray-500 mb-6">{company.description}</p>
          )}

          {/* Productos */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold">Menú</h2>
            <span className="text-sm text-gray-400">{products.length} productos</span>
          </div>

          {products.length === 0 && !loadingProducts && (
            <p className="text-sm text-gray-400 py-8 text-center">
              Este salón aún no tiene productos publicados.
            </p>
          )}

          <div className="flex flex-col gap-2 pb-28">
            {products.map((product) => {
              const qty = getQty(product.id)
              const sinStock = product.stock === 0

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 bg-[#F5F4F2] rounded-2xl p-3 ${sinStock ? 'opacity-50' : ''}`}
                >
                  {/* Imagen cuadrada */}
                  <div className="w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug">{product.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatCOP(product.price)}
                      {sinStock ? (
                        <span className="text-red-500"> · Agotado</span>
                      ) : product.stock <= 5 ? (
                        <span className="text-[#7B1C2E]"> · Quedan {product.stock}</span>
                      ) : (
                        <span className="text-green-600"> · En stock</span>
                      )}
                    </p>
                  </div>

                  {/* Controles */}
                  {qty === 0 ? (
                    <button
                      disabled={sinStock}
                      onClick={() => handleAdd(product)}
                      aria-label="Agregar producto"
                      className="w-9 h-9 rounded-full bg-[#7B1C2E] flex items-center justify-center hover:bg-[#4a101b] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} className="text-white" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(product.id, qty - 1)}
                        aria-label="Reducir cantidad"
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{qty}</span>
                      <button
                        disabled={qty >= product.stock}
                        onClick={() => handleAdd(product)}
                        aria-label="Aumentar cantidad"
                        className="w-8 h-8 rounded-full bg-[#7B1C2E] flex items-center justify-center hover:bg-[#4a101b] transition-colors disabled:opacity-40"
                      >
                        <Plus size={13} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </main>
      )}

      {/* Cart bar */}
      {cartCount > 0 && cartCompanyId === companyId && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/carrito')}
              className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold flex items-center justify-between px-6 hover:bg-[#4a101b] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span>Ver carrito · {cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              </div>
              <span>{formatCOP(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
