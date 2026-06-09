import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import BusinessFormPanel from '../components/businesses/BusinessFormPanel'
import { homeForRole, isLocale } from '@/lib/routes'

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export default function RegisterPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { locale } = useParams()

  useEffect(() => {
    if (user?.role !== 'UNASSIGNED' && user && isLocale(locale)) {
      navigate(homeForRole(locale, user.role), { replace: true })
    }
  }, [user, navigate, locale])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <a
        href={`${LANDING_URL}/${isLocale(locale) ? locale : 'es'}`}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        catalog.mx
      </a>

      <div className="w-full max-w-2xl">
        <div className="mb-6 text-left sm:text-center">
          <h1 className="text-2xl font-bold">Crea tu tienda</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Completa la información para enviar tu catálogo a revisión.
          </p>
        </div>

        <BusinessFormPanel mode="register" />
      </div>
    </div>
  )
}
