import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BusinessFormPanel from '../components/businesses/BusinessFormPanel'
import ProductEditor from '../components/catalog/ProductEditor'
import { isLocale, routes } from '@/lib/routes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NewClientPage() {
  const navigate = useNavigate()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : 'es'
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)

  if (createdSlug) {
    return (
      <div className="max-w-xl space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm font-medium text-emerald-600">✓ Negocio creado</span>
            <button
              onClick={() => navigate(routes.platformBusinesses(locale))}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Volver a clientes
            </button>
          </div>
          <h1 className="text-2xl font-bold">Productos / Servicios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega los productos o servicios del catálogo.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductEditor
              businessId={createdSlug}
              businessSlug={createdSlug}
              scope="admin"
            />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          variant="outline"
          onClick={() => navigate(routes.platformBusiness(locale, createdSlug))}
        >
          Ver negocio completo →
        </Button>
      </div>
    )
  }

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
        onSuccess={(slug) => setCreatedSlug(slug)}
      />
    </div>
  )
}
