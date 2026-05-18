import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Check } from 'lucide-react'
import Logo from '../components/Logo'
import { useBalance } from '../hooks/useBalance'
import { formatCOP, parseAmount } from '../lib/utils'
import type { Order } from '../types'

export default function PagoConfirmado() {
  const navigate = useNavigate()
  const location = useLocation()
  const order = location.state?.order as Order | undefined
  const { balance } = useBalance()

  // Redirigir si llegaron sin datos de orden
  useEffect(() => {
    if (!order) navigate('/marketplace', { replace: true })
  }, [])

  if (!order) return null

  const totalPagado = parseAmount(order.total)
  const saldoRestante = balance ? parseAmount(balance.amount) : null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-center items-center px-6 py-4 border-b border-gray-100">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full text-center">
        {/* Icono */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check size={36} className="text-green-600 stroke-[2.5]" />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-3">
          Pago confirmado
        </p>
        <h1 className="text-3xl font-bold mb-4">
          ¡Gracias por apoyar<br />a los estudiantes!
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Tu compra fue procesada exitosamente. El vendedor ya recibió la confirmación.
        </p>

        {/* Detalles de la orden */}
        <div className="w-full bg-[#F5F4F2] rounded-2xl p-5 mb-4 text-left">
          {[
            { label: 'Total pagado', value: formatCOP(totalPagado), bold: true },
            { label: 'Número de orden', value: `#${order.id}`, mono: true },
            {
              label: 'Productos',
              value: `${order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? '—'} unidades`,
            },
            { label: 'Estado', value: order.status === 'completed' ? 'Completado' : order.status },
          ].map(({ label, value, bold, mono }) => (
            <div key={label} className="flex justify-between py-3 border-b border-gray-200 last:border-none">
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono' : ''}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Saldo restante */}
        {saldoRestante !== null && (
          <div className="w-full bg-[#FBF3DF] rounded-xl px-5 py-3.5 flex justify-between items-center mb-10">
            <span className="text-sm text-[#C9973A] font-medium">Saldo restante</span>
            <span className="text-lg font-bold text-[#C9973A]">{formatCOP(saldoRestante)}</span>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full bg-[#7B1C2E] text-white rounded-2xl py-4 font-semibold hover:bg-[#4a101b] transition-colors"
          >
            Seguir explorando
          </button>
          <button
            onClick={() => navigate('/landing')}
            className="w-full border border-gray-200 rounded-2xl py-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Ir al inicio
          </button>
        </div>
      </main>
    </div>
  )
}
