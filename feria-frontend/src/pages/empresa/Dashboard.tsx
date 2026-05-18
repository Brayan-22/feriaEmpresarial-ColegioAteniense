import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Receipt, QrCode,
  Plus, Pencil, Loader2, AlertCircle, X,
  ToggleLeft, ToggleRight,
} from 'lucide-react'
import QRCode from 'qrcode'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import ImagePlaceholder from '../../components/ImagePlaceholder'
import ProductModal from './ProductModal'
import { useAuthStore } from '../../store/authStore'
import { useCompanyStore } from '../../store/companyStore'
import { useCompanyProducts } from '../../hooks/useProducts'
import { useCompanyOrders } from '../../hooks/useOrders'
import api, { getErrorMessage } from '../../lib/api'
import { toast } from '../../store/toastStore'
import { formatCOP, parseAmount } from '../../lib/utils'
import type { Order, Product } from '../../types'

type Tab = 'resumen' | 'productos' | 'transacciones' | 'qr'

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={16} /> },
  { id: 'productos', label: 'Productos', icon: <Package size={16} /> },
  { id: 'transacciones', label: 'Transacciones', icon: <Receipt size={16} /> },
  { id: 'qr', label: 'QR del salón', icon: <QrCode size={16} /> },
]

export default function EmpresaDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { getCompany } = useCompanyStore()

  const company = user ? getCompany(user.id) : null

  const [tab, setTab] = useState<Tab>('resumen')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { products, loading: loadingProducts, refetch: refetchProducts } = useCompanyProducts(company?.id ?? null)
  const { orders, loading: loadingOrders } = useCompanyOrders(company?.id ?? null)

  useEffect(() => {
    if (user && !company) navigate('/empresa/registro', { replace: true })
  }, [user, company])

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/', { replace: true })
  }

  const toggleActive = async (product: Product) => {
    try {
      await api.put(`/products/${product.id}`, { ...product, active: !product.active })
      refetchProducts()
      toast({ title: product.active ? 'Producto desactivado' : 'Producto activado', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    }
  }

  const openCreate = () => { setEditingProduct(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setEditingProduct(p); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingProduct(null) }
  const onSaved = () => { closeModal(); refetchProducts() }

  if (!company) return null

  const totalVentas = orders.reduce((s, o) => s + parseAmount(o.total), 0)
  const totalOrdenes = orders.length
  const ticketPromedio = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0
  const totalProductos = products.reduce((s, p) => s + p.stock, 0)

  // Initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'

  const tabTitle: Record<Tab, string> = {
    resumen: 'Resumen del día',
    productos: 'Productos',
    transacciones: 'Transacciones',
    qr: 'QR del salón',
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#111111] flex transition-colors">
      {/* Sidebar */}
      <aside className="w-52 bg-[#0F0F0F] text-white flex flex-col fixed h-full shrink-0">
        <div className="px-5 pt-6 pb-5 border-b border-gray-800">
          <Logo light />
          <p className="text-[10px] text-gray-600 mt-1.5 truncate">{company.name}</p>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors ${
                tab === id
                  ? 'bg-[#7B1C2E] text-white font-medium'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-gray-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#7B1C2E] flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.full_name ?? 'Usuario'}</p>
            <button
              onClick={handleLogout}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 ml-52 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 px-8 py-3.5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              Salón · {company.name}
            </p>
            <h1 className="text-lg font-bold leading-tight">{tabTitle[tab]}</h1>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <span className="text-[10px] font-bold text-[#7B1C2E] bg-[#F4E6E8] px-3 py-1.5 rounded-full uppercase tracking-wider">
              Empresa
            </span>
            <button
              onClick={openCreate}
              className="bg-[#7B1C2E] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#4a101b] transition-colors"
            >
              <Plus size={15} /> Producto
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 py-6">
          {tab === 'resumen' && (
            <ResumenTab
              loadingOrders={loadingOrders}
              totalVentas={totalVentas}
              totalOrdenes={totalOrdenes}
              ticketPromedio={ticketPromedio}
              totalProductos={totalProductos}
              orders={orders}
              products={products}
            />
          )}
          {tab === 'productos' && (
            <ProductosTab
              products={products}
              loading={loadingProducts}
              onCreate={openCreate}
              onEdit={openEdit}
              onToggle={toggleActive}
            />
          )}
          {tab === 'transacciones' && (
            <TransaccionesTab orders={orders} loading={loadingOrders} />
          )}
          {tab === 'qr' && (
            <QRTab products={products} companyId={company.id} loading={loadingProducts} />
          )}
        </main>
      </div>

      {modalOpen && (
        <ProductModal
          companyId={company.id}
          companyName={company.name}
          product={editingProduct}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

function ResumenTab({
  loadingOrders, totalVentas, totalOrdenes, ticketPromedio, totalProductos, orders, products,
}: {
  loadingOrders: boolean
  totalVentas: number
  totalOrdenes: number
  ticketPromedio: number
  totalProductos: number
  orders: Order[]
  products: Product[]
}) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  if (loadingOrders) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
  }

  const topProductos = products.slice(0, 4)
  const maxStock = Math.max(...topProductos.map((p) => p.stock), 1)

  // Ventas por hora reales agrupando por created_at
  const HORAS_RANGE = [8, 9, 10, 11, 12, 13, 14, 15, 16]
  const ventasPorHora = HORAS_RANGE.map((h) =>
    orders
      .filter((o) => o.status === 'completed' && new Date(o.created_at).getHours() === h)
      .reduce((sum, o) => sum + parseAmount(o.total), 0)
  )
  const maxVenta = Math.max(...ventasPorHora, 1)

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Ventas hoy', value: formatCOP(totalVentas), sub: 'total acumulado', delta: '' },
          { label: 'Transacciones', value: totalOrdenes.toString(), sub: 'órdenes', delta: '' },
          { label: 'Ticket promedio', value: formatCOP(ticketPromedio), sub: 'por orden', delta: '' },
          { label: 'Productos vendidos', value: totalProductos.toString(), sub: `${products.filter(p => p.active).length} productos activos`, delta: '' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Ventas por hora */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="mb-5">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ventas por hora</p>
            <p className="text-sm font-bold">Hoy · 8am — 4pm</p>
          </div>
          <div className="flex items-end gap-2 h-28">
            {HORAS_RANGE.map((h, i) => (
              <div key={h} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full bg-[#7B1C2E] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${Math.max((ventasPorHora[i] / maxVenta) * 100, ventasPorHora[i] > 0 ? 4 : 0)}%` }}
                />
                <span className="text-[10px] text-gray-400">{h}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top productos */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Top productos</p>
          <p className="text-sm font-bold mb-4">Más stock</p>
          <div className="flex flex-col gap-3.5">
            {topProductos.length === 0 ? (
              <p className="text-xs text-gray-400">Sin productos aún.</p>
            ) : topProductos.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="font-semibold shrink-0">{p.stock}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-[#7B1C2E] rounded-full"
                    style={{ width: `${(p.stock / maxStock) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="bg-white border border-gray-100 rounded-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Actividad reciente</p>
            <p className="text-sm font-bold">Transacciones</p>
          </div>
          <div className="flex gap-1.5">
            {([
              { key: 'all', label: 'Todas' },
              { key: 'completed', label: `OK · ${orders.filter(o => o.status === 'completed').length}` },
              { key: 'pending', label: `Pendiente · ${orders.filter(o => o.status === 'pending').length}` },
              { key: 'failed', label: `Falló · ${orders.filter(o => o.status === 'failed').length}` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === key ? 'bg-[#0F0F0F] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {(() => {
          const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
          return filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">
              {orders.length === 0 ? 'Aún no tienes ventas.' : 'No hay transacciones con ese estado.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Orden', 'Total', 'Estado'].map((h) => (
                    <th key={h} className="text-[10px] text-gray-400 uppercase tracking-widest px-6 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 6).map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-gray-500">#{order.id}</td>
                    <td className="px-6 py-3 font-semibold">{formatCOP(order.total)}</td>
                    <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Productos ────────────────────────────────────────────────────────────────

function ProductosTab({ products, loading, onCreate, onEdit, onToggle }: {
  products: Product[]
  loading: boolean
  onCreate: () => void
  onEdit: (p: Product) => void
  onToggle: (p: Product) => void
}) {
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Package size={48} className="text-gray-200" />
        <p className="text-gray-500 text-sm">Aún no tienes productos.</p>
        <button onClick={onCreate} className="bg-[#7B1C2E] text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-[#4a101b] transition-colors">
          + Crear primer producto
        </button>
      </div>
    )
  }

  const active = products.filter((p) => p.active)
  const inactive = products.filter((p) => !p.active)

  return (
    <div className="flex flex-col gap-2.5">
      {active.map((product) => (
        <div key={product.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl p-4 flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
          ) : (
            <ImagePlaceholder className="w-14 h-14 rounded-lg shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="text-sm text-gray-500">{formatCOP(product.price)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {product.stock === 0 ? <span className="text-red-500">Agotado</span> : `${product.stock} en stock`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onEdit(product)} title='boton' className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onToggle(product)}
              className="text-green-500 hover:text-gray-400 transition-colors"
              title="Desactivar"
            >
              <ToggleRight size={26} />
            </button>
          </div>
        </div>
      ))}

      {inactive.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mt-2 mb-0.5">
            Inactivos · {inactive.length}
          </p>
          {inactive.map((product) => (
            <div key={product.id} className="bg-red-50 rounded-xl p-4 flex items-center gap-4 border border-red-200">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover shrink-0 opacity-60" />
              ) : (
                <ImagePlaceholder className="w-14 h-14 rounded-lg shrink-0 opacity-60" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm truncate text-red-700">{product.name}</p>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide shrink-0">Inactivo</span>
                </div>
                <p className="text-sm text-red-400">{formatCOP(product.price)}</p>
                <p className="text-xs text-red-300 mt-0.5">{product.stock} en stock</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(product)} title='boton' className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-red-400">
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onToggle(product)}
                  className="text-red-300 hover:text-green-500 transition-colors"
                  title="Activar"
                >
                  <ToggleLeft size={26} />
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Transacciones ────────────────────────────────────────────────────────────

function TransaccionesTab({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <p className="font-bold text-sm">Todas las transacciones</p>
        <div className="flex gap-1.5">
          {([
            { key: 'all', label: 'Todas' },
            { key: 'completed', label: `OK · ${orders.filter(o => o.status === 'completed').length}` },
            { key: 'pending', label: `Pendiente · ${orders.filter(o => o.status === 'pending').length}` },
            { key: 'failed', label: `Falló · ${orders.filter(o => o.status === 'failed').length}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === key ? 'bg-[#0F0F0F] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No hay transacciones.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              {['Orden', 'Comprador', 'Total', 'Estado'].map((h) => (
                <th key={h} className="text-[10px] text-gray-400 uppercase tracking-widest px-6 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-3 font-mono text-gray-500">#{order.id}</td>
                <td className="px-6 py-3 text-gray-400 font-mono text-xs">{order.buyer_id.slice(0, 8)}…</td>
                <td className="px-6 py-3 font-semibold">{formatCOP(order.total)}</td>
                <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── QR Tab ───────────────────────────────────────────────────────────────────

function QRTab({ products, companyId, loading }: { products: Product[]; companyId: number; loading: boolean }) {
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Product | null>(null)

  useEffect(() => {
    const active = products.filter((p) => p.active)
    if (active.length === 0) return
    Promise.all(
      active.map((p) =>
        QRCode.toDataURL(
          `${window.location.origin}/scan?product_id=${p.id}&company_id=${companyId}`,
          { width: 400, margin: 2, color: { dark: '#0F0F0F', light: '#FFFFFF' } }
        ).then((url) => ({ id: p.id, url }))
      )
    )
      .then((results) => {
        const map: Record<number, string> = {}
        results.forEach(({ id, url }) => { map[id] = url })
        setQrUrls(map)
      })
      .catch(() => setError('Error al generar los códigos QR'))
  }, [products, companyId])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  const activeProducts = products.filter((p) => p.active)

  if (activeProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <QrCode size={48} className="text-gray-200" />
        <p className="text-gray-500 text-sm">No tienes productos activos. Activa al menos uno para ver sus QRs.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-6">
        Imprime o muestra estos QR en tu stand. El comprador los escanea para agregar el producto a su carrito.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => qrUrls[product.id] && setExpanded(product)}
            className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer
              transition-transform duration-200 ease-out hover:scale-[1.04] hover:shadow-lg"
          >
            {qrUrls[product.id] ? (
              <img src={qrUrls[product.id]} alt={`QR ${product.name}`} className="w-44 h-44 rounded-xl" />
            ) : (
              <div className="w-44 h-44 bg-gray-100 rounded-xl animate-pulse" />
            )}
            <div className="text-center">
              <p className="font-semibold text-sm">{product.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatCOP(product.price)}</p>
            </div>
            {qrUrls[product.id] && (
              <a
                href={qrUrls[product.id]}
                download={`qr-${product.name.replace(/\s+/g, '-')}.png`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-[#7B1C2E] underline"
              >
                Descargar QR
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setExpanded(null)}
        >
          {/* Fondo con blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card ampliada */}
          <div
            className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl
              animate-[zoomIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'zoomIn 0.18s ease-out' }}
          >
            <button
              onClick={() => setExpanded(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Cerrar"
            >
              <X size={15} />
            </button>
            {qrUrls[expanded.id] ? (
              <img src={qrUrls[expanded.id]} alt={`QR ${expanded.name}`} className="w-64 h-64 rounded-xl" />
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-xl animate-pulse" />
            )}
            <div className="text-center">
              <p className="font-bold text-base">{expanded.name}</p>
              <p className="text-sm text-gray-500 mt-1">{formatCOP(expanded.price)}</p>
            </div>
            {qrUrls[expanded.id] && (
              <a
                href={qrUrls[expanded.id]}
                download={`qr-${expanded.name.replace(/\s+/g, '-')}.png`}
                className="text-sm text-[#7B1C2E] font-medium underline"
              >
                Descargar QR
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: '● Confirmada', className: 'text-green-600' },
    failed: { label: 'Falló', className: 'text-red-500' },
    pending: { label: 'Pendiente', className: 'text-amber-600' },
  }
  const { label, className } = map[status] ?? { label: status, className: 'text-gray-500' }
  return <span className={`text-xs font-medium ${className}`}>{label}</span>
}
