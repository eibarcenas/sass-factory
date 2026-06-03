import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function useSignOut() {
  const store = useAuthStore()
  const navigate = useNavigate()
  return async () => {
    const { getAuth, signOut } = await import('firebase/auth')
    await signOut(getAuth())
    store.setUser(null)
    navigate('/register', { replace: true })
  }
}
