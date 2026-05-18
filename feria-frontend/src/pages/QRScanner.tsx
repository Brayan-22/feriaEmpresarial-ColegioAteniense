import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { QrReader } from 'react-qr-reader'
import Logo from '../components/Logo'

export default function QRScanner() {
  const navigate = useNavigate()

  const handleScan = (result: any) => {
    if (result?.text) {
      const text = result.text

      // Parse URL format: /scan?product_id=X&company_id=Y
      try {
        const url = new URL(text, window.location.origin)
        const productId = url.searchParams.get('product_id')
        const companyId = url.searchParams.get('company_id')

        if (productId && companyId) {
          navigate(`/scan?product_id=${productId}&company_id=${companyId}`, { replace: true })
        } else {
          // Try direct path
          navigate(text)
        }
      } catch {
        // Invalid URL, try as direct path
        navigate(text)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <Logo />
        <div />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Escanea un código</p>
        <h1 className="text-2xl font-bold mb-8 text-center">QR de producto</h1>

        <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-200 shadow-lg mb-6">
          <QrReader
            onResult={handleScan}
            constraints={{ facingMode: 'environment' }}
            videoStyle={{ width: '100%' }}
          />
        </div>

        <p className="text-sm text-gray-500 text-center">
          Apunta la cámara al código QR del producto que deseas comprar
        </p>
      </main>
    </div>
  )
}
