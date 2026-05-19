import { ref, onMounted } from 'vue'

// Lazy Firebase initialization to avoid SSR issues
let auth: any = null

async function getFirebaseAuth() {
  if (auth) return auth
  const { initializeApp, getApps } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')

  const firebaseConfig = {
    apiKey: useRuntimeConfig().public.firebaseApiKey as string,
    authDomain: useRuntimeConfig().public.firebaseAuthDomain as string,
    projectId: useRuntimeConfig().public.firebaseProjectId as string,
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
  auth = getAuth()
  return auth
}

export function useFirebaseAuth() {
  const user = useState<{ uid: string; email: string | null } | null>('auth:user', () => null)
  const loading = ref(false)
  const error = ref('')

  async function login(email: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const firebaseAuth = await getFirebaseAuth()
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
      user.value = { uid: cred.user.uid, email: cred.user.email }
      return cred.user
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
      }
      error.value = messages[err.code] ?? 'Error al iniciar sesión'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    const { signOut } = await import('firebase/auth')
    const firebaseAuth = await getFirebaseAuth()
    await signOut(firebaseAuth)
    user.value = null
    await navigateTo('/login')
  }

  async function initAuth() {
    const { onAuthStateChanged } = await import('firebase/auth')
    const firebaseAuth = await getFirebaseAuth()
    return new Promise<void>((resolve) => {
      onAuthStateChanged(firebaseAuth, (fbUser) => {
        user.value = fbUser ? { uid: fbUser.uid, email: fbUser.email } : null
        resolve()
      })
    })
  }

  return { user, loading, error, login, logout, initAuth }
}
