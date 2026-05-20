import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Download, Loader2, X, Menu,
  DollarSign, Building2, Users, ShoppingBag,
  Power, CheckCircle, RefreshCw, Info,
} from 'lucide-react'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import { useAuthStore } from '../../store/authStore'
import api, { getErrorMessage } from '../../lib/api'
import { toast } from '../../store/toastStore'
import { formatCOP } from '../../lib/utils'
import type { Company, User, Order, Balance } from '../../types'

const NAV_ITEMS = ['Dashboard', 'Empresas', 'Padres / Saldos', 'Transacciones', 'Reportes']

function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

// ─── Modal: Asignar saldo ─────────────────────────────────────────────────

function AssignBalanceModal({ user, currentBalance, onClose, onDone }: {
  user: User
  currentBalance: number
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return
    setLoading(true)
    try {
      await api.post(`/admin/balances/assign?user_id=${user.id}&amount=${amt}`)
      toast({ title: 'Saldo asignado', description: `${formatCOP(amt)} → ${user.full_name ?? user.email}`, variant: 'success' })
      onDone()
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-lg font-bold">Modificar saldo</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user.full_name ?? user.email}</p>
          </div>
          <button onClick={onClose} title="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>

        {/* Saldo actual */}
        <div className="bg-[#F5F4F2] dark:bg-gray-800 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Saldo actual</span>
          <span className="text-lg font-bold text-[#7B1C2E]">{formatCOP(currentBalance)}</span>
        </div>

        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Monto a agregar (COP)</label>
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 mb-1.5 focus-within:border-[#7B1C2E] transition-colors">
          <span className="text-gray-400 text-sm mr-1">$</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50000"
            className="flex-1 text-sm font-semibold focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
        </div>
        {amount && !isNaN(parseFloat(amount)) && (
          <p className="text-xs text-gray-400 mb-4">
            Nuevo saldo: <span className="font-semibold text-gray-700">{formatCOP(currentBalance + parseFloat(amount))}</span>
          </p>
        )}
        {!amount && <div className="mb-4" />}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading || !amount}
            className="flex-1 bg-[#7B1C2E] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#4a101b] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Asignar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Crear empresa ─────────────────────────────────────────────────

function CreateCompanyModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) return
    setLoading(true)
    try {
      await api.post('/admin/users/create-company', { email, password, full_name: fullName || null, role_id: 2 })
      toast({ title: 'Cuenta empresa creada', description: email, variant: 'success' })
      onDone()
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-lg font-bold">Nueva empresa</h2>
            <p className="text-sm text-gray-500 mt-0.5">Crea la cuenta del líder del salón</p>
          </div>
          <button onClick={onClose} title="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Nombre del líder</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ana Castro"
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Correo *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lider@salon.co"
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Contraseña *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 8 caracteres"
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B1C2E] transition-colors"
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-red-500 mt-2">La contraseña debe tener mínimo 8 caracteres ({password.length}/8)</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="flex-1 bg-[#7B1C2E] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#4a101b] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CSV helper ───────────────────────────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Tabs ─────────────────────────────────────────────────────────────────

function DashboardTab({ companies, orders, parentUsers }: { companies: Company[]; orders: Order[]; parentUsers: User[] }) {
  const completed = orders.filter((o) => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + parseFloat(o.total), 0)
  const activeCompanies = companies.filter((c) => c.active).length

  const maxRevenue = Math.max(
    ...companies.map((c) =>
      completed.filter((o) => o.company_id === c.id).reduce((s, o) => s + parseFloat(o.total), 0)
    ),
    1
  )

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Recaudo total', value: formatCOP(totalRevenue), Icon: DollarSign },
          { label: 'Empresas activas', value: String(activeCompanies), Icon: Building2 },
          { label: 'Padres registrados', value: String(parentUsers.length), Icon: Users },
          { label: 'Ventas confirmadas', value: String(completed.length), Icon: ShoppingBag },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</p>
              <Icon size={16} className="text-gray-300" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-6">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Ventas por empresa</p>
        <p className="text-base font-bold mb-5">Top salones</p>
        {companies.length === 0 ? (
          <p className="text-sm text-gray-400">No hay datos</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...companies]
              .map((c) => ({
                c,
                rev: completed.filter((o) => o.company_id === c.id).reduce((s, o) => s + parseFloat(o.total), 0),
              }))
              .sort((a, b) => b.rev - a.rev)
              .map(({ c, rev }) => (
                <div key={c.id} className="flex items-center gap-3">
                  <p className="text-sm w-48 truncate text-gray-700">{c.name}</p>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7B1C2E] rounded-full transition-all" style={{ width: `${(rev / maxRevenue) * 100}%` }} />
                  </div>
                  <p className="text-sm font-semibold w-28 text-right">{formatCOP(rev)}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmpresasTab({
  companies, loading, togglingId, onToggle,
}: {
  companies: Company[]
  loading: boolean
  togglingId: number | null
  onToggle: (c: Company) => void
}) {
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={24} /></div>

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Salones participantes</p>
          <p className="text-base font-bold">Empresas · {companies.filter((c) => c.active).length} activas</p>
        </div>
        <button
          onClick={() => downloadCSV(
            'empresas.csv',
            ['Salón', 'Categoría', 'Productos', 'Estado'],
            companies.map((c) => [
              c.name,
              c.categories?.[0]?.name ?? '',
              c.product_count ?? 0,
              c.active ? 'Activa' : 'Inactiva',
            ])
          )}
          className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Salón', 'Categoría', 'Productos', 'Estado', 'Acción'].map((h) => (
              <th key={h} className="text-left text-[10px] text-gray-400 uppercase tracking-widest pb-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.length === 0 ? (
            <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No hay empresas registradas</td></tr>
          ) : (
            companies.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="py-3.5 font-semibold">{c.name}</td>
                <td className="py-3.5">
                  {c.categories?.[0]?.name
                    ? <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">{c.categories[0].name}</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="py-3.5 text-gray-600">{c.product_count ?? 0}</td>
                <td className="py-3.5">
                  <span className={`flex items-center gap-1.5 text-xs font-medium w-fit ${c.active ? 'text-green-700' : 'text-amber-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.active ? 'bg-green-500' : 'bg-amber-400'}`} />
                    {c.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="py-3.5">
                  <button
                    onClick={() => onToggle(c)}
                    disabled={togglingId === c.id}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      c.active
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-green-200 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {togglingId === c.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : c.active ? <Power size={12} /> : <CheckCircle size={12} />}
                    {c.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function PadresTab({ users, balanceMap, loading, onAssign, onDelete }: {
  users: User[]
  balanceMap: Record<string, number>
  loading: boolean
  onAssign: (u: User) => void
  onDelete: (u: User) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={24} /></div>

  const totalSaldo = Object.values(balanceMap).reduce((s, v) => s + v, 0)

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Usuarios registrados</p>
          <p className="text-base font-bold">Padres / Clientes · {users.length} total</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Saldo en circulación</p>
          <p className="text-base font-bold text-[#7B1C2E]">{formatCOP(totalSaldo)}</p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Nombre', 'Correo', 'Registrado', 'Saldo actual', ''].map((h) => (
              <th key={h} className="text-left text-[10px] text-gray-400 uppercase tracking-widest pb-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No hay usuarios registrados</td></tr>
          ) : (
            users.map((u) => {
              const saldo = balanceMap[u.id] ?? 0
              const confirming = confirmId === u.id
              return (
                <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#F4E6E8] flex items-center justify-center text-[10px] font-bold text-[#7B1C2E] shrink-0">
                        {initials(u.full_name)}
                      </div>
                      <span className="font-medium">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-gray-500">{u.email}</td>
                  <td className="py-3.5 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="py-3.5">
                    <span className={`font-semibold ${saldo > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                      {formatCOP(saldo)}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAssign(u)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#7B1C2E]/30 text-[#7B1C2E] hover:bg-[#F4E6E8] transition-colors"
                      >
                        <Plus size={12} /> Modificar
                      </button>
                      {confirming ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { onDelete(u); setConfirmId(null) }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(u.id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X size={12} /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function TransaccionesTab({ orders, loading, companies }: { orders: Order[]; loading: boolean; companies: Company[] }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  const counts = {
    completed: orders.filter((o) => o.status === 'completed').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    failed: orders.filter((o) => o.status === 'failed').length,
  }

  const displayed = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const companyName = (id: number) => companies.find((c) => c.id === id)?.name ?? `Empresa #${id}`

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={24} /></div>

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Historial global</p>
          <p className="text-base font-bold">Transacciones · {orders.length} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => downloadCSV(
              'transacciones.csv',
              ['#', 'Empresa', 'Total', 'Estado', 'Comprador'],
              displayed.map((o) => [
                o.id,
                companyName(o.company_id),
                parseFloat(o.total),
                o.status === 'completed' ? 'Confirmada' : o.status === 'pending' ? 'Pendiente' : 'Falló',
                o.buyer_id,
              ])
            )}
            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={14} /> Exportar CSV
          </button>
          {(['all', 'completed', 'pending', 'failed'] as const).map((s) => {
            const labels = { all: 'Todas', completed: 'OK', pending: 'Pendiente', failed: 'Falló' }
            const count = s === 'all' ? orders.length : counts[s]
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === s ? 'bg-[#0F0F0F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {labels[s]} · {count}
              </button>
            )
          })}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['#', 'Empresa', 'Total', 'Estado', 'Comprador'].map((h) => (
              <th key={h} className="text-left text-[10px] text-gray-400 uppercase tracking-widest pb-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 ? (
            <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No hay transacciones</td></tr>
          ) : (
            displayed.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="py-3.5 text-gray-400 font-mono text-xs">#{o.id}</td>
                <td className="py-3.5 font-medium">{companyName(o.company_id)}</td>
                <td className="py-3.5 font-semibold">{formatCOP(parseFloat(o.total))}</td>
                <td className="py-3.5">
                  <span className={`text-xs font-medium ${
                    o.status === 'completed' ? 'text-green-700'
                    : o.status === 'pending' ? 'text-amber-600'
                    : 'text-red-600'
                  }`}>
                    ● {o.status === 'completed' ? 'Confirmada' : o.status === 'pending' ? 'Pendiente' : 'Falló'}
                  </span>
                </td>
                <td className="py-3.5 text-gray-400 text-xs font-mono">{o.buyer_id.slice(0, 8)}…</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function ReportesTab() {
  const [loading, setLoading] = useState(false)

  const reconcileAll = async () => {
    setLoading(true)
    try {
      await api.post('/admin/settlement/reconcile-all')
      toast({ title: 'Liquidación completada', description: 'Saldos de empresas actualizados.', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg flex flex-col gap-4">
      {/* Card principal */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Header con acento */}
        <div className="bg-[#7B1C2E] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <RefreshCw size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">Liquidación</p>
            <p className="text-base font-bold text-white leading-tight">Reconciliación de saldos</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
            Calcula los ingresos de cada empresa a partir de las órdenes completadas y actualiza sus saldos pendientes de pago al colegio.
          </p>

          <button
            onClick={reconcileAll}
            disabled={loading}
            className="w-full bg-[#7B1C2E] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#4a101b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Reconciliando…' : 'Reconciliar todas las empresas'}
          </button>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
        <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Esta acción es segura y puede ejecutarse varias veces. No modifica órdenes ni saldos de clientes.
        </p>
      </div>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('Empresas')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const [assignTarget, setAssignTarget] = useState<User | null>(null)
  const [showCreateCompany, setShowCreateCompany] = useState(false)

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true)
    try {
      const { data } = await api.get<Company[]>('/admin/companies')
      setCompanies(data)
    } catch {
      toast({ title: 'Error cargando empresas', variant: 'error' })
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const { data } = await api.get<User[]>('/admin/users')
      setUsers(data)
    } catch {
      toast({ title: 'Error cargando usuarios', variant: 'error' })
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const { data } = await api.get<Order[]>('/orders/?skip=0&limit=200')
      setOrders(data)
    } catch {
      toast({ title: 'Error cargando transacciones', variant: 'error' })
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const fetchBalances = useCallback(async () => {
    try {
      const { data } = await api.get<Balance[]>('/balances/')
      setBalances(data)
    } catch { /* empty */ }
  }, [])

  useEffect(() => {
    (async () => {
      await Promise.all([fetchCompanies(), fetchUsers(), fetchOrders(), fetchBalances()])
    })()
  }, [fetchCompanies, fetchUsers, fetchOrders, fetchBalances])

  const toggleCompany = async (company: Company) => {
    setTogglingId(company.id)
    try {
      await api.put(`/admin/companies/${company.id}/toggle`)
      setCompanies((prev) => prev.map((c) => c.id === company.id ? { ...c, active: !c.active } : c))
      toast({
        title: company.active ? 'Empresa desactivada' : 'Empresa activada',
        description: company.name,
        variant: 'success',
      })
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    } finally {
      setTogglingId(null)
    }
  }

  const deleteUser = async (user: User) => {
    try {
      await api.delete(`/users/${user.id}`)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u))
      toast({ title: 'Usuario desactivado', description: user.full_name ?? user.email ?? user.id, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'error' })
    }
  }

  const handleSignOut = async () => {
    try { await api.post('/auth/logout') } catch { /* empty */ }
    logout()
    navigate('/', { replace: true })
  }

  const parentUsers = users.filter((u) => u.role?.name === 'user' && u.is_active)
  const balanceMap: Record<string, number> = {}
  balances.forEach((b) => { balanceMap[b.user_id] = parseFloat(b.amount) })

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#111111] flex transition-colors">
      {/* Backdrop en móviles */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-56 bg-[#0F0F0F] text-white flex-col py-6 shrink-0 fixed h-full z-50`}>
        <div className="px-5 mb-8">
          <Logo light />
          <p className="text-[10px] text-gray-600 mt-1">Coordinación · 2026</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeNav === item
                  ? 'bg-[#7B1C2E] text-white font-medium'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
              }`}
            >
              <span className="w-2 h-2 rounded-sm border border-current opacity-60" />
              {item}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#1F2D5C] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.full_name || 'Admin'}</p>
            <button
              onClick={handleSignOut}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="flex justify-between items-center px-8 py-4 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Menú"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Coordinación · Feria 2026</p>
              <h1 className="text-xl font-bold">{activeNav}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs font-semibold text-white bg-[#0F0F0F] px-3 py-1.5 rounded-full uppercase tracking-wider">
              ADMIN
            </span>
            {activeNav === 'Empresas' && (
              <button
                onClick={() => setShowCreateCompany(true)}
                className="bg-[#7B1C2E] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#4a101b] transition-colors"
              >
                <Plus size={15} /> Empresa
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-8">
          {activeNav === 'Dashboard' && (
            <DashboardTab companies={companies} orders={orders} parentUsers={parentUsers} />
          )}
          {activeNav === 'Empresas' && (
            <EmpresasTab
              companies={companies}
              loading={loadingCompanies}
              togglingId={togglingId}
              onToggle={toggleCompany}
            />
          )}
          {activeNav === 'Padres / Saldos' && (
            <PadresTab users={parentUsers} balanceMap={balanceMap} loading={loadingUsers} onAssign={setAssignTarget} onDelete={deleteUser} />
          )}
          {activeNav === 'Transacciones' && (
            <TransaccionesTab orders={orders} loading={loadingOrders} companies={companies} />
          )}
          {activeNav === 'Reportes' && <ReportesTab />}
        </main>
      </div>

      {assignTarget && (
        <AssignBalanceModal
          user={assignTarget}
          currentBalance={balanceMap[assignTarget.id] ?? 0}
          onClose={() => setAssignTarget(null)}
          onDone={() => { setAssignTarget(null); fetchBalances() }}
        />
      )}
      {showCreateCompany && (
        <CreateCompanyModal
          onClose={() => setShowCreateCompany(false)}
          onDone={() => { setShowCreateCompany(false); fetchCompanies() }}
        />
      )}
    </div>
  )
}
