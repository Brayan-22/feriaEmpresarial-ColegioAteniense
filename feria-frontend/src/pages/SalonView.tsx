import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, Minus, ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import Logo from '../components/Logo'
import ImageWithFallback from '../components/ImageWithFallback'
import ProductModal from '../components/ProductModal'
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { company, loading: loadingCompany, error: errorCompany } = useCompany(companyId)
  const { products, loading: loadingProducts } = useProductsByCompany(companyId)
  const { balance } = useBalance()
  const user = useAuthStore((s) => s.user)

  const { items, addItem, updateQty, itemCount, total, companyId: cartCompanyId } = useCartStore()

  const getQty = (productId: number) =>
    items.find((i) => i.product_id === productId)?.quantity ?? 0

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleUpdateModalQty = (qty: number) => {
    if (selectedProduct && qty > 0) {
      updateQty(selectedProduct.id, qty)
    } else if (selectedProduct && qty === 0) {
      updateQty(selectedProduct.id, 0)
    }
  }

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
    <div className="min-h-screen bg-white dark:bg-[#18181B] text-[#111111] dark:text-zinc-100 flex flex-col transition-colors">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-[#3F3F46] sticky top-0 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur z-10 transition-colors">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <Logo />
        <div className="flex items-center gap-3">
          {user && balance && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-zinc-500">SALDO</span>
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
          <Loader2 size={32} className="animate-spin text-gray-400 dark:text-zinc-500" />
        </div>
      )}

      {/* Error */}
      {errorCompany && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-gray-500 dark:text-zinc-400">{errorCompany}</p>
          <button onClick={() => navigate('/marketplace')} className="text-sm text-[#7B1C2E] dark:text-[#C9973A] underline">
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
            <div className="w-full h-48 sm:h-64 rounded-2xl mb-6 bg-gray-100 dark:bg-[#3F3F46]" />
          )}

          {/* Info empresa */}
          <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
          {company.description && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{company.description}</p>
          )}

          {/* Productos */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold">Menú</h2>
            <span className="text-sm text-gray-400 dark:text-zinc-500">{products.length} productos</span>
          </div>

          {products.length === 0 && !loadingProducts && (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-8 text-center">
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
                  onClick={() => handleProductClick(product)}
                  className={`flex items-center gap-3 bg-brand-gray dark:bg-[#27272A] rounded-2xl p-3 cursor-pointer transition-all hover:shadow-md dark:hover:shadow-black/30 hover:bg-[#f0ede9] dark:hover:bg-[#3F3F46] ${sinStock ? 'opacity-50' : ''}`}
                >
                  {/* Imagen cuadrada */}
                  <div className="w-18 h-18 shrink-0 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                      {formatCOP(product.price)}
                      {sinStock ? (
                        <span className="text-red-500 dark:text-red-400"> · Agotado</span>
                      ) : product.stock <= 5 ? (
                        <span className="text-[#7B1C2E] dark:text-[#E58B9B]"> · Quedan {product.stock}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400"> · En stock</span>
                      )}
                    </p>
                  </div>

                  {/* Controles */}
                  {qty === 0 ? (
                    <button
                      disabled={sinStock}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAdd(product)
                      }}
                      aria-label="Agregar producto"
                      className="px-4 py-2 rounded-full bg-wine-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-wine-800 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} /> Agregar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-[#3F3F46] rounded-full px-3 py-2 border border-gray-300 dark:border-[#52525B] shadow-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateQty(product.id, qty - 1)
                        }}
                        aria-label="Reducir cantidad"
                        className="w-7 h-7 rounded-full bg-gray-400 dark:bg-zinc-600 hover:bg-gray-500 dark:hover:bg-zinc-500 flex items-center justify-center transition-colors text-white font-bold"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800 dark:text-zinc-100">{qty}</span>
                      <button
                        disabled={qty >= product.stock}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdd(product)
                        }}
                        aria-label="Aumentar cantidad"
                        className="w-7 h-7 rounded-full bg-wine-700 hover:bg-wine-800 flex items-center justify-center transition-colors text-white disabled:opacity-40 disabled:bg-gray-400"
                      >
                        <Plus size={14} />
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
        <div className="sticky bottom-0 bg-white dark:bg-[#18181B] border-t border-gray-100 dark:border-[#3F3F46] px-6 py-4 transition-colors">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/carrito')}
              className="w-full bg-wine-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-between px-6 hover:bg-wine-800 transition-colors"
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

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        quantity={selectedProduct ? getQty(selectedProduct.id) : 0}
        onAddItem={() => {
          if (selectedProduct) {
            handleAdd(selectedProduct)
          }
        }}
        onUpdateQty={handleUpdateModalQty}
        isOutOfStock={selectedProduct?.stock === 0}
      />
    </div>
  )
}
