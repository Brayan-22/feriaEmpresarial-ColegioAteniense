import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, QrCode } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { useBalance } from '../hooks/useBalance'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatCOP, parseAmount } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

interface Stats {
  companies_count: number
  products_count: number
}

export default function Landing() {
  const navigate = useNavigate()
  const { balance, loading: balanceLoading } = useBalance()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isMobile = useIsMobile()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get<Stats>('/stats/').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignorar error de red en logout
    } finally {
      logout()
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F4F2] dark:bg-[#111111] text-[#111111] dark:text-[#F5F4F2] flex flex-col transition-colors">
      <header className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <Logo />
        <div className="flex items-center gap-3">
          {user && !balanceLoading && balance && (
            <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">SALDO</span>
              <span className="text-sm font-bold text-[#C9973A]">
                {formatCOP(balance.amount)}
              </span>
            </div>
          )}
          {user && balanceLoading && (
            <div className="w-24 h-7 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          )}
          <ThemeToggle />
          {user ? (
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/rol-selection')}
              className="text-sm font-semibold bg-[#C9973A] text-white px-4 py-2 rounded-lg hover:bg-[#b8863a] transition-colors"
            >
              Ingresar
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-12 max-w-2xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 mb-10 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#C9973A] inline-block" />
          14–16 de Noviembre · Colegio Ateniense
        </div>

        <h1 className="text-6xl md:text-7xl font-bold leading-none mb-1">
          La feria<br />empresarial
        </h1>
        <h1 className="text-6xl md:text-7xl font-bold italic text-[#C9973A] leading-none mb-8">
          del colegio.
        </h1>

        <p className="text-base text-gray-600 dark:text-gray-400 mb-10 max-w-md">
          Explora los salones, apoya a los estudiantes y paga con tu saldo virtual escaneando QR.
        </p>

        {balance && (
          <div className="mb-8 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 flex items-center justify-between max-w-sm">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Tu saldo disponible</p>
              <p className="text-2xl font-bold text-[#C9973A]">{formatCOP(balance.amount)}</p>
            </div>
            {parseAmount(balance.amount) === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] text-right">
                Recarga en secretaría o con tu director de grupo
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-[#7B1C2E] text-white rounded-2xl px-8 py-4 font-semibold text-base hover:bg-[#4a101b] transition-colors"
          >
            Explorar la feria
          </button>
          {user && isMobile && (
            <button
              onClick={() => navigate('/qr-scanner')}
              className="bg-[#C9973A] text-white rounded-2xl px-8 py-4 font-semibold text-base hover:bg-[#b8863a] transition-colors flex items-center justify-center gap-2"
            >
              <QrCode size={18} />
              Escanear QR
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 grid grid-cols-2 gap-8 mb-16">
          {[
            { num: stats ? String(stats.companies_count) : '—', label: 'SALONES' },
            { num: stats ? String(stats.products_count) : '—', label: 'PRODUCTOS' },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold">{num}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">Cómo funciona</p>
          <div className="flex flex-col gap-5">
            {[
              { n: '01', title: 'Recarga tu saldo', desc: 'En secretaría o con tu director de grupo.' },
              { n: '02', title: 'Recorre los salones', desc: 'Descubre productos hechos por los estudiantes.' },
              { n: '03', title: 'Paga con QR', desc: 'Sin efectivo, sin filas, al instante.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-5 border-b border-gray-200 dark:border-gray-800 pb-5 last:border-none">
                <span className="text-sm font-bold text-[#C9973A] w-8 shrink-0">{n}</span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
