import { useNavigate } from 'react-router-dom'
import CreateBusinessForm from '../components/businesses/CreateBusinessForm'
import { Card, CardContent } from '@/components/ui/card'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

export default function NewClientPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <button
          onClick={() => navigate('/clientes')}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-5 transition-colors"
        >
          ← Volver a clientes
        </button>
        <h1 className="text-2xl font-bold">Nuevo negocio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea la página de catálogo para un nuevo cliente.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <CreateBusinessForm
            onSuccess={(slug) => {
              window.open(`${STOREFRONT_URL}/demo/${slug}`, '_blank')
              navigate('/clientes')
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
