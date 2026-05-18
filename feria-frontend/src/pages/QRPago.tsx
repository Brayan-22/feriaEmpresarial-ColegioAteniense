import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, CreditCard } from 'lucide-react'
import Logo from '../components/Logo'
import { useCartStore } from '../store/cartStore'
import { useBalance } from '../hooks/useBalance'
import api, { getErrorMessage } from '../lib/api'
import { toast } from '../store/toastStore'
import { formatCOP, parseAmount } from '../lib/utils'
import type { Order } from '../types'

interface PreviewResponse {
  items: { product_id: number; quantity: number; unit_price: string }[]
  total: string
  message: string
}

export default function ConfirmarPago() {
  const navigate = useNavigate()
  const { items, companyId, clear, total } = useCartStore()
  const { balance } = useBalance()

  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [loadingConfirm, setLoadingConfirm] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Stable key — prevents double charges on re-renders or network retries
  const idempotencyKey = useRef(`${Date.now()}-${Math.random()}`)

  useEffect(() => {
    if (items.length === 0) navigate('/carrito', { replace: true })
  }, [])

  useEffect(() => {
    if (items.length === 0 || !companyId) return
    api
      .post<PreviewResponse>('/orders/preview', {
        company_id: companyId,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        total: total(),
      })
      .then(({ data }) => setPreview(data))
      .catch((err) => setPreviewError(getErrorMessage(err)))
      .finally(() => setLoadingPreview(false))
  }, [])

  const handleConfirm = async () => {
    if (!preview || !companyId) return
    setLoadingConfirm(true)
    try {
      const { data: order } = await api.post<Order>(
        '/orders/confirm',
        {
          company_id: companyId,
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          total: total(),
        },
        { headers: { 'Idempotency-Key': idempotencyKey.current } }
      )
      clear()
      navigate('/pago-confirmado', { state: { order }, replace: true })
    } catch (err) {
      toast({ title: 'Error al confirmar pago', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setLoadingConfirm(false)
    }
  }

  const balanceAmount = balance ? parseAmount(balance.amount) : 0
  const cartTotal = preview ? parseAmount(preview.total) : total()
  const saldoRestante = balanceAmount - cartTotal

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => navigate('/carrito')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
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

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Último paso</p>
        <h1 className="text-3xl font-bold mb-6">Confirmar pago</h1>

        {loadingPreview && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={32} className="animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Validando pedido...</p>
          </div>
        )}

        {previewError && !loadingPreview && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-red-600 text-center">{previewError}</p>
            <button onClick={() => navigate('/carrito')} className="text-sm text-[#7B1C2E] underline">
              Volver al carrito
            </button>
          </div>
        )}

        {preview && !loadingPreview && (
          <>
            {/* Resumen de productos */}
            <div className="bg-[#F5F4F2] rounded-2xl p-5 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Resumen del pedido
              </p>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name}
                      <span className="text-gray-400"> × {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatCOP(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-[#7B1C2E]">{formatCOP(preview.total)}</span>
              </div>
            </div>

            {/* Saldo después */}
            <div className={`rounded-xl px-5 py-3.5 flex justify-between items-center mb-6 ${
              saldoRestante < 0 ? 'bg-red-50 border border-red-200' : 'bg-[#FBF3DF]'
            }`}>
              <span className={`text-sm font-medium ${saldoRestante < 0 ? 'text-red-600' : 'text-[#C9973A]'}`}>
                Saldo después del pago
              </span>
              <span className={`font-bold ${saldoRestante < 0 ? 'text-red-600' : 'text-[#C9973A]'}`}>
                {saldoRestante < 0 ? `Faltan ${formatCOP(Math.abs(saldoRestante))}` : formatCOP(saldoRestante)}
              </span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loadingConfirm || saldoRestante < 0}
              className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold hover:bg-[#4a101b] transition-colors mb-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingConfirm
                ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                : <><CreditCard size={18} /> Pagar {formatCOP(preview.total)}</>
              }
            </button>

            <button
              onClick={() => navigate('/carrito')}
              disabled={loadingConfirm}
              className="w-full border border-gray-200 bg-white rounded-2xl py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Volver al carrito
            </button>
          </>
        )}
      </main>
    </div>
  )
}
