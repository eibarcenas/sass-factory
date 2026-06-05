import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import CreateBusinessForm from '../components/businesses/CreateBusinessForm'
import { Card, CardContent } from '@/components/ui/card'

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:3020'

export default function RegisterPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate(user.role === 'SUPER_ADMIN' ? '/' : '/owner', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <a
        href={LANDING_URL}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        catalog.mx
      </a>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Crea tu catálogo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Empieza gratis · 7 semanas de prueba
          </p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <CreateBusinessForm mode="register" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
