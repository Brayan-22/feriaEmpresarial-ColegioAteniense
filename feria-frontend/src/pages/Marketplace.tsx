import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Grid3X3, Filter, AlertCircle, LogOut, QrCode, X } from 'lucide-react'
import ImageWithFallback from '../components/ImageWithFallback'
import ThemeToggle from '../components/ThemeToggle'
import { useBalance } from '../hooks/useBalance'
import { useIsMobile } from '../hooks/useIsMobile'
import { useCategories } from '../hooks/useCategories'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { formatCOP } from '../lib/utils'
import type { Company } from '../types'

type SortBy = 'name_asc' | 'price_asc' | 'price_desc' | 'product_count_desc'

const SORT_LABELS: Record<SortBy, string> = {
  name_asc: 'Nombre A → Z',
  price_asc: 'Precio menor primero',
  price_desc: 'Precio mayor primero',
  product_count_desc: 'Más productos',
}

interface SearchBody {
  search: string | null
  sort_by: SortBy | null
  in_stock: boolean | null
}

// Paleta dark: zinc-900 (#18181B) base · zinc-800 (#27272A) surface · zinc-700 (#3F3F46) elevado

export default function Marketplace() {
  const navigate = useNavigate()
  const { balance } = useBalance()
  const { categories } = useCategories()
  const isMobile = useIsMobile()
  const itemCount = useCartStore((s) => s.itemCount())
  const cartTotal = useCartStore((s) => s.total())
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState<SortBy | null>(null)
  const [inStock, setInStock] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Company[]>('/companies/')
      setCompanies(data.filter((c) => c.active))
    } catch {
      setError('No se pudieron cargar los salones')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFiltered = useCallback(async (body: SearchBody) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<Company[]>('/filter/search', body)
      setCompanies(data)
    } catch {
      setError('No se pudieron cargar los salones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    const isDefault = !trimmed && activeCategory === 'Todos' && !sortBy && !inStock

    if (isDefault) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      (async () => {
        await fetchAll()
      })()
      return
    }

    const searchTerm = trimmed || (activeCategory !== 'Todos' ? activeCategory : null)
    const body: SearchBody = {
      search: searchTerm,
      sort_by: sortBy,
      in_stock: inStock || null,
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchFiltered(body), 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, activeCategory, sortBy, inStock, fetchAll, fetchFiltered])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasActiveFilters = !!query.trim() || activeCategory !== 'Todos' || sortBy !== null || inStock
  const clearAll = () => { setQuery(''); setActiveCategory('Todos'); setSortBy(null); setInStock(false) }

  return (
    <div className="h-screen flex flex-col bg-[#F6F4F2] dark:bg-[#18181B] text-[#111111] dark:text-zinc-100 font-sans transition-colors">

      {/* Header */}
      <header className="bg-[#0B0B0B] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Grid3X3 size={16} />
          <span className="font-semibold text-sm">Feria Empresarial</span>
        </div>
        <div className="flex items-center gap-3">
          {user && balance && (
            <div className="bg-[#1A1A1A] rounded-full px-3 py-1 flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Saldo</span>
              <span className="text-sm font-bold text-[#C9973A]">{formatCOP(balance.amount)}</span>
            </div>
          )}
          {user && isMobile && (
            <button onClick={() => navigate('/qr-scanner')} aria-label="Escanear QR" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <QrCode size={18} />
            </button>
          )}
          <ThemeToggle onDark />
          {user ? (
            <button onClick={() => { logout(); navigate('/login') }} aria-label="Cerrar sesión" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <LogOut size={18} />
            </button>
          ) : (
            <button onClick={() => navigate('/rol-selection')} className="text-sm font-semibold bg-[#C9973A] text-white px-4 py-2 rounded-lg hover:bg-[#b8863a] transition-colors">
              Ingresar
            </button>
          )}
        </div>
      </header>

      {/* Search + Filter */}
      <div className="px-4 pt-4 pb-2 relative" ref={filterRef}>
        {/* Barra de búsqueda: surface elevada sobre el fondo */}
        <div className="flex items-center bg-[#F3F1EF] dark:bg-[#27272A] rounded-full px-4 py-3 gap-2 transition-colors">
          <Search size={16} className="text-gray-400 dark:text-zinc-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar salón o producto..."
            className="bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} title='boton' className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 shrink-0 transition-colors">
              <X size={14} />
            </button>
          )}
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`shrink-0 transition-colors ${hasActiveFilters ? 'text-[#C9973A]' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
            aria-label="Filtros"
          >
            <Filter size={16} />
            {hasActiveFilters && <span className="sr-only">Filtros activos</span>}
          </button>
        </div>

        {/* Panel de filtros */}
        {filterOpen && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white dark:bg-[#27272A] rounded-2xl shadow-xl dark:shadow-black/40 border border-gray-100 dark:border-[#3F3F46] p-4 z-20">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-400">Filtros</p>
              {hasActiveFilters && (
                <button onClick={clearAll} className="text-xs text-[#C9973A] font-medium hover:underline">
                  Limpiar
                </button>
              )}
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">Ordenar por</p>
            <div className="flex flex-col gap-1 mb-4">
              {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(sortBy === key ? null : key)}
                  className={`text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                    sortBy === key
                      ? 'bg-[#C9973A]/15 text-[#C9973A] font-semibold'
                      : 'hover:bg-gray-50 dark:hover:bg-[#3F3F46]/50 text-gray-700 dark:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#3F3F46]">
              <p className="text-sm text-gray-700 dark:text-zinc-300">Solo con stock disponible</p>
              <button
                onClick={() => setInStock((v) => !v)}
                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${inStock ? 'bg-[#C9973A] justify-end' : 'bg-gray-200 dark:bg-[#3F3F46] justify-start'}`}
                title="Filtrar por stock"
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chips de categorías */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide">
        {['Todos', ...categories.map((c) => c.name)].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[#111111] dark:bg-[#C9973A] text-white'
                : 'bg-white dark:bg-[#27272A] border border-gray-200 dark:border-[#3F3F46] text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-500'
            }`}
          >
            {cat}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-1.5 bg-[#F4E6E8] dark:bg-[#C9973A]/15 text-[#7B1C2E] dark:text-[#C9973A] border border-[#7B1C2E]/20 dark:border-[#C9973A]/30 transition-colors hover:bg-[#ebd4d8] dark:hover:bg-[#C9973A]/25"
          >
            <X size={12} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="flex justify-between items-baseline mb-5">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Salones</p>
            <h1 className="text-xl font-bold">Participantes 2026</h1>
          </div>
          {!loading && companies.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              {companies.length} resultado{companies.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-700 border-t-zinc-200 dark:border-zinc-600 dark:border-t-zinc-200" />
            <p className="text-sm text-gray-500 dark:text-zinc-500">Cargando salones...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-24 gap-3">
            <AlertCircle size={24} className="text-red-500" />
            <p className="text-sm text-gray-500 dark:text-zinc-500">{error}</p>
          </div>
        )}

        {!loading && !error && (
          companies.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-2">
              <p className="text-gray-500 dark:text-zinc-500 text-sm">
                No se encontraron salones{query ? ` para "${query}"` : ''}.
              </p>
              {hasActiveFilters && (
                <button onClick={clearAll} className="text-xs text-[#C9973A] underline mt-1">
                  Ver todos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} onClick={() => navigate(`/salon/${company.id}`)} />
              ))}
            </div>
          )
        )}
      </main>

      {/* Carrito flotante */}
      {itemCount > 0 && (
        <div className="sticky bottom-4 px-4 pb-4 pt-2">
          <button
            onClick={() => navigate('/carrito')}
            className="w-full max-w-2xl mx-auto flex items-center justify-between bg-[#8F1731] text-white rounded-full px-6 py-4 font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Ver carrito · {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            <span>{formatCOP(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white dark:bg-[#27272A] rounded-2xl overflow-hidden text-left border border-[#E7E3DF] dark:border-[#3F3F46] hover:shadow-md dark:hover:shadow-black/30 hover:border-gray-300 dark:hover:border-zinc-500 transition-all active:scale-[0.98]"
    >
      <div className="w-full aspect-4/3 bg-[#F2F0EE] dark:bg-[#3F3F46] relative overflow-hidden">
        <ImageWithFallback src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 bg-white/90 dark:bg-[#27272A]/90 backdrop-blur-sm rounded-full text-[10px] px-2 py-0.5 text-gray-600 dark:text-zinc-400 font-medium">
          {company.categories?.[0]?.name ?? '—'}
        </span>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs text-gray-400 dark:text-zinc-500">{company.product_count ?? 0} items</p>
        <p className="text-sm font-semibold leading-snug">{company.name}</p>
        <p className="text-xs font-bold text-[#C9973A]">
          {company.min_price ? `Desde ${formatCOP(company.min_price)}` : 'Sin precios aún'}
        </p>
      </div>
    </button>
  )
}
