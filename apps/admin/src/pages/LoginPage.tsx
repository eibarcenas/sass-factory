import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type UserRole } from '../store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { mockMode, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (mockMode) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth')
      const { initializeApp, getApps } = await import('firebase/app')
      if (!getApps().length) {
        initializeApp({
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        })
      }
      const auth = getAuth()
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // Read custom claims to determine role
      const { claims } = await cred.user.getIdTokenResult()
      const role = (claims.role as UserRole) ?? 'OWNER'

      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        role,
        businessId: claims.business_id as string | undefined,
        modules: (claims.modules as string[]) ?? [],
      })

      // Route based on role
      navigate(role === 'SUPER_ADMIN' ? '/' : '/owner', { replace: true })
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/user-not-found': 'User not found',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid credentials',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      }
      setError(msgs[err.code] ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">catalog.mx</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@catalog.mx"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
