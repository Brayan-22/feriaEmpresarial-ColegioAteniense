import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

import RolSelection from './pages/RolSelection'
import Login from './pages/Login'
import Register from './pages/Register'
import Unauthorized from './pages/Unauthorized'
import Scan from './pages/Scan'
import QRScanner from './pages/QRScanner'

// Usuario (padre/cliente)
import Landing from './pages/Landing'
import Marketplace from './pages/Marketplace'
import SalonView from './pages/SalonView'
import Carrito from './pages/Carrito'
import ConfirmarPago from './pages/QRPago'
import PagoConfirmado from './pages/PagoConfirmado'

// Empresa
import EmpresaRegistro from './pages/empresa/Registro'
import EmpresaDashboard from './pages/empresa/Dashboard'

// Admin
import AdminPanel from './pages/admin/Panel'

export default function App() {
  return (
    <Routes>
      {/* Ruta por defecto → Landing */}
      <Route path="/" element={<Landing />} />

      {/* Rutas públicas */}
      <Route path="/rol-selection" element={<RolSelection />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/scan" element={<Scan />} />

      {/* Marketplace y detalles públicos (sin necesidad de autenticación) */}
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/salon/:id" element={<SalonView />} />

      {/* Rutas protegidas — cualquier usuario autenticado */}
      <Route element={<ProtectedRoute />}>

        {/* Solo rol "user" */}
        <Route element={<RoleRoute roles={['user']} />}>
          <Route path="/landing" element={<Landing />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/confirmar-pago" element={<ConfirmarPago />} />
          <Route path="/pago-confirmado" element={<PagoConfirmado />} />
        </Route>

        {/* Solo rol "company" */}
        <Route element={<RoleRoute roles={['company']} />}>
          <Route path="/empresa/registro" element={<EmpresaRegistro />} />
          <Route path="/empresa/dashboard" element={<EmpresaDashboard />} />
        </Route>

        {/* Solo rol "admin" */}
        <Route element={<RoleRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
