<script setup lang="ts">
import { Card, Input, Button } from '@sass-factory/ui'

definePageMeta({ layout: 'auth', middleware: [] })

const { login, loading, error } = useFirebaseAuth()
const router = useRouter()

const email = ref('')
const password = ref('')

async function handleLogin() {
  try {
    await login(email.value, password.value)
    await router.push('/')
  } catch {
    // error is set inside useFirebaseAuth
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">catalog.mx</h1>
        <p class="text-sm text-gray-500 mt-1">Panel de administración</p>
      </div>

      <Card>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <Input
            v-model="email"
            type="email"
            label="Correo"
            placeholder="admin@catalog.mx"
            required
          />
          <Input
            v-model="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            required
          />

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <Button
            type="submit"
            variant="primary"
            :loading="loading"
            class="w-full"
          >
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  </div>
</template>
