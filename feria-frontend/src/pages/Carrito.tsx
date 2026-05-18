import { useNavigate } from 'react-router-dom'
import { ChevronLeft, CreditCard, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Logo from '../components/Logo'
import ImageWithFallback from '../components/ImageWithFallback'
import { useCartStore } from '../store/cartStore'
import { useBalance } from '../hooks/useBalance'
import { formatCOP, parseAmount } from '../lib/utils'

export default function Carrito() {
  const navigate = useNavigate()
  const { items, updateQty, removeItem, clear, total } = useCartStore()
  const { balance } = useBalance()

  const subtotal = total()
  const balanceAmount = balance ? parseAmount(balance.amount) : 0
  const saldoRestante = balanceAmount - subtotal
  const sinSaldo = balanceAmount < subtotal

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ChevronLeft size={16} /> Volver
          </button>
          <Logo />
          <div />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <ShoppingBag size={48} className="text-gray-200" />
          <h2 className="text-xl font-bold">Tu carrito está vacío</h2>
          <p className="text-sm text-gray-500">Explora los salones y agrega productos.</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-[#7B1C2E] text-white rounded-2xl px-8 py-3 font-semibold hover:bg-[#4a101b] transition-colors"
          >
            Explorar la feria
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> Volver
        </button>
        <Logo />
        {balance && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">SALDO</span>
            <span className="text-sm font-bold text-white bg-[#C9973A] px-2.5 py-1 rounded-lg">
              {formatCOP(balance.amount)}
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Tu compra</p>
            <h1 className="text-3xl font-bold">Carrito</h1>
          </div>
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} /> Vaciar
          </button>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-3 mb-8">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-4 bg-[#F5F4F2] rounded-2xl p-4">
              <ImageWithFallback
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.company_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQty(item.product_id, item.quantity - 1)}
                    aria-label="Reducir cantidad"
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product_id, item.quantity + 1)}
                    aria-label="Aumentar cantidad"
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold">{formatCOP(item.price * item.quantity)}</p>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>Apoyo solidario</span>
            <span>Incluido</span>
          </div>
          <div className="flex justify-between text-lg font-bold mb-5">
            <span>Total</span>
            <span>{formatCOP(subtotal)}</span>
          </div>

          {/* Saldo restante */}
          <div className={`rounded-xl px-5 py-3.5 flex justify-between items-center mb-6 ${
            sinSaldo ? 'bg-red-50 border border-red-200' : 'bg-[#FBF3DF]'
          }`}>
            <span className={`text-sm font-medium ${sinSaldo ? 'text-red-600' : 'text-[#C9973A]'}`}>
              {sinSaldo ? 'Saldo insuficiente' : 'Saldo restante después'}
            </span>
            <span className={`font-bold ${sinSaldo ? 'text-red-600' : 'text-[#C9973A]'}`}>
              {sinSaldo ? `Faltan ${formatCOP(subtotal - balanceAmount)}` : formatCOP(saldoRestante)}
            </span>
          </div>

          <button
            onClick={() => navigate('/confirmar-pago')}
            disabled={sinSaldo}
            className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-[#4a101b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={20} />
            Pagar
          </button>

          {sinSaldo && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Recarga tu saldo en secretaría o con tu director de grupo.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
