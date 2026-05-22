import { X, Plus, Minus } from 'lucide-react'
import ImageWithFallback from './ImageWithFallback'
import { formatCOP } from '../lib/utils'
import type { Product } from '../types'

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  quantity: number
  onAddItem: () => void
  onUpdateQty: (qty: number) => void
  isOutOfStock: boolean
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
  quantity,
  onAddItem,
  onUpdateQty,
  isOutOfStock,
}: ProductModalProps) {
  if (!isOpen || !product) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#27272A] text-[#111111] dark:text-zinc-100 rounded-3xl shadow-xl dark:shadow-black/50 max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#3F3F46] sticky top-0 bg-white dark:bg-[#27272A]">
            <h2 className="text-xl font-bold">Detalles del producto</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#3F3F46] rounded-full transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col gap-6">
            {/* Imagen */}
            <div className="w-full h-64 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#3F3F46]">
              <ImageWithFallback
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nombre y descripción */}
            <div>
              <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Precio y stock */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1 uppercase">Precio</p>
                <p className="text-2xl font-bold text-wine-700 dark:text-[#E58B9B]">
                  {formatCOP(product.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1 uppercase">Disponibilidad</p>
                <p
                  className={`text-sm font-semibold ${
                    isOutOfStock
                      ? 'text-red-500 dark:text-red-400'
                      : product.stock <= 5
                        ? 'text-[#7B1C2E] dark:text-[#E58B9B]'
                        : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {isOutOfStock
                    ? 'Agotado'
                    : product.stock <= 5
                      ? `${product.stock} unidades`
                      : 'En stock'}
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="pt-4 border-t border-gray-100 dark:border-[#3F3F46] flex flex-col gap-3">
              {quantity === 0 ? (
                <button
                  disabled={isOutOfStock}
                  onClick={onAddItem}
                  className="w-full bg-wine-700 text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-wine-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} /> Agregar al carrito
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-4 bg-brand-gray dark:bg-[#3F3F46] rounded-2xl p-4">
                    <button
                      onClick={() => onUpdateQty(quantity - 1)}
                      className="w-9 h-9 rounded-full border border-gray-300 dark:border-[#52525B] bg-white dark:bg-[#27272A] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#52525B] transition-colors"
                      aria-label="Reducir cantidad"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold min-w-8 text-center">{quantity}</span>
                    <button
                      disabled={quantity >= product.stock}
                      onClick={() => onUpdateQty(quantity + 1)}
                      className="w-9 h-9 rounded-full bg-wine-700 flex items-center justify-center hover:bg-wine-800 transition-colors text-white disabled:opacity-50"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => onUpdateQty(0)}
                    className="w-full border border-gray-300 dark:border-[#52525B] text-gray-700 dark:text-zinc-300 rounded-2xl py-3 font-semibold hover:bg-gray-50 dark:hover:bg-[#3F3F46] transition-colors"
                  >
                    Remover del carrito
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
