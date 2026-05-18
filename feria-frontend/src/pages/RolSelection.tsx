import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

export default function RolSelection() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#111111] dark:text-[#F5F4F2] flex flex-col transition-colors">
      <header className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-gray-400">v1.0</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-12 max-w-lg mx-auto w-full">
        <p className="text-xs font-semibold text-[#7B1C2E] uppercase tracking-widest mb-3">Bienvenido</p>
        <h1 className="text-4xl font-bold leading-tight mb-3">
          ¿Cómo participas<br />en la feria?
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          Elige tu rol para continuar. Podrás cambiar después desde tu perfil.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/login?rol=padre')}
            className="w-full border-2 border-[#7B1C2E] rounded-2xl p-5 text-left hover:bg-[#F4E6E8] dark:hover:bg-[#2A1015] transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold text-[#7B1C2E] uppercase tracking-widest bg-[#F4E6E8] dark:bg-[#2A1015] px-2 py-0.5 rounded-full">
                  Padre / Cliente
                </span>
                <h2 className="text-base font-bold mt-2">Comprar en la feria</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Explora salones, agrega productos y paga con saldo virtual escaneando QR.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#7B1C2E] flex items-center justify-center ml-4 shrink-0">
                <ArrowRight size={16} className="text-white" />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/login?rol=empresa')}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold text-[#0F0F0F] dark:text-[#F5F4F2] uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  Empresa
                </span>
                <h2 className="text-base font-bold mt-2">Vender desde mi salón</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Gestiona productos, recibe pagos QR y consulta métricas del día.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center ml-4 shrink-0">
                <ArrowRight size={16} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/login?rol=admin')}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-semibold text-white uppercase tracking-widest bg-[#0F0F0F] px-2 py-0.5 rounded-full">
                  Admin
                </span>
                <h2 className="text-base font-bold mt-2">Soy de coordinación</h2>
              </div>
              <span className="text-sm font-semibold text-[#7B1C2E]">Acceder →</span>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          ¿Primera vez?{' '}
          <span className="text-[#7B1C2E] font-semibold underline cursor-pointer">Regístrate aquí</span>
        </p>
      </main>
    </div>
  )
}
