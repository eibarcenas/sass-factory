import { useNavigate, useParams } from 'react-router-dom'
import BusinessFormPanel from '../components/businesses/BusinessFormPanel'
import { isLocale, routes } from '@/lib/routes'

export default function NewClientPage() {
  const navigate = useNavigate()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <button
          onClick={() => navigate(routes.platformBusinesses(locale))}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-5 transition-colors"
        >
          ← Volver a clientes
        </button>
        <h1 className="text-2xl font-bold">Nuevo negocio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea la página de catálogo para un nuevo cliente.
        </p>
      </div>

      <BusinessFormPanel
        mode="create"
        onSuccess={(slug) => navigate(routes.platformStore(locale, slug))}
      />
    </div>
  )
}
