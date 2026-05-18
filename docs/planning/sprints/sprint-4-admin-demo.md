# Sprint 4 — Admin Panel + Demo Generator MFE

**Branch:** `sprint/4-admin-demo` from `develop`
**Duration:** 1.5 weeks
**Agents:** `shell-agent` + `demo-mf-agent` (parallel after shell skeleton is ready)
**Initiatives covered:** Sales Engine (E5, E6, E7)
**Pre-condition:** Sprint 3 MR merged to `develop`

---

## Objective

Build the admin panel shell (MFE host) with Firebase authentication and the `demo-mf` remote for AI-powered demo generation and business lifecycle management. This sprint delivers the core of the internal tool that Erick uses to generate demos, track prospects, and activate businesses.

Key deliverables:
1. **Admin shell** (`apps/admin`): login page, protected route wrapper, navigation sidebar with live status counts, Module Federation host that loads `demo-mf`.
2. **Demo MFE** (`apps/mfe/demo`): GenerateForm with SSE streaming, DemoList with status filters, DemoCard, StatusActions, ProspectNotification.
3. **Repurposed generate.post.ts**: Same SSE infrastructure, new catalog-domain system prompt, new output schema (Business + Item[]).
4. **Full business lifecycle API**: status transition endpoints with server-side validation.
5. **Real-time notification**: Prospect acceptance bubbles to admin within 5s via Firestore listener.

---

## Agent Assignment and Sequencing

```
Days 1–3: shell-agent (solo)
  1. Implement Firebase Auth login page in apps/admin
  2. Build protected route middleware (client-side redirect guard)
  3. Build navigation sidebar with status count badges
  4. Build MFE error boundary component
  5. Wire admin shell to load demo-mf remote via Module Federation
  6. COMMIT: "feat(admin-shell): auth login, protected routes, sidebar, MFE host"

Days 3–7 (parallel with shell-agent from day 3):
demo-mf-agent:
  1. Rewrite the generate.post.ts system prompt for catalog domain
  2. Implement all business lifecycle API endpoints
  3. Implement GenerateForm component with SSE streaming
  4. Implement DemoList with pagination and status filters
  5. Implement DemoCard and StatusActions
  6. Implement ProspectNotification (Firestore real-time listener)
  7. Write Vitest tests for all API endpoints
  8. COMMIT: "feat(demo-mf): catalog generator, business lifecycle API, real-time notifications"

Days 7–10: Integration, Playwright E2E, final verification
```

---

## Shell (apps/admin) — Detailed Implementation

### Firebase Auth Login Page

File: `apps/admin/app/pages/login.vue`

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <Card class="w-full max-w-sm p-8">
      <template #header>
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-neutral-900">catalog.mx</h1>
          <p class="text-sm text-neutral-500 mt-1">Panel de administración</p>
        </div>
      </template>

      <form @submit.prevent="login" class="space-y-4">
        <Input
          v-model="email"
          type="email"
          label="Correo"
          placeholder="admin@catalog.mx"
          :error="fieldErrors.email"
          required
        />
        <Input
          v-model="password"
          type="password"
          label="Contraseña"
          :error="fieldErrors.password"
          required
        />

        <div v-if="loginError" class="text-sm text-error-600 text-center">
          {{ loginError }}
        </div>

        <Button type="submit" variant="primary" full-width :loading="loading">
          Iniciar sesión
        </Button>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'

// Public page — no auth required
definePageMeta({ layout: false, auth: false })

const email = ref('')
const password = ref('')
const loading = ref(false)
const loginError = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})

const router = useRouter()
const route = useRoute()
const auth = getAuth()

async function login() {
  loginError.value = ''
  fieldErrors.value = {}

  if (!email.value) { fieldErrors.value.email = 'Requerido'; return }
  if (!password.value) { fieldErrors.value.password = 'Requerido'; return }

  loading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    const redirect = (route.query.redirect as string) || '/admin'
    await router.push(redirect)
  } catch (err: any) {
    if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      loginError.value = 'Correo o contraseña incorrectos'
    } else if (err.code === 'auth/too-many-requests') {
      loginError.value = 'Demasiados intentos. Intenta más tarde.'
    } else {
      loginError.value = 'Error al iniciar sesión. Intenta de nuevo.'
    }
  } finally {
    loading.value = false
  }
}
</script>
```

### Auth Route Middleware

File: `apps/admin/app/middleware/auth.ts`

```typescript
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default defineNuxtRouteMiddleware((to) => {
  // Public routes that don't need auth
  const publicRoutes = ['/login', '/']
  if (publicRoutes.includes(to.path)) return

  // Client-side only auth check
  if (import.meta.server) return

  return new Promise((resolve) => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      if (!user) {
        resolve(navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`))
      } else {
        resolve()
      }
    })
  })
})
```

### Navigation Sidebar

File: `apps/admin/app/components/AdminSidebar.vue`

```vue
<template>
  <aside class="w-64 min-h-screen bg-neutral-900 text-white flex flex-col">
    <div class="p-6 border-b border-neutral-700">
      <h2 class="text-lg font-bold">catalog.mx</h2>
      <p class="text-xs text-neutral-400 mt-1">{{ user?.email }}</p>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-neutral-700 transition-colors"
        active-class="bg-neutral-700 text-white"
      >
        <span class="flex items-center gap-2">
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </span>
        <span
          v-if="statusCounts[item.statusKey] !== undefined"
          class="bg-neutral-600 text-neutral-200 text-xs px-2 py-0.5 rounded-full"
        >
          {{ statusCounts[item.statusKey] }}
        </span>
      </NuxtLink>
    </nav>

    <div class="p-4 border-t border-neutral-700">
      <Button variant="ghost" size="sm" @click="logout" class="w-full text-neutral-400">
        Cerrar sesión
      </Button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth'
import type { BusinessStatus } from '@sass-factory/core'

// Real-time status counts from Firestore
const { statusCounts } = useStatusCounts()
const { user } = useCurrentUser()

const navItems = [
  { to: '/admin',                label: 'Generar Demo',  icon: '✨', statusKey: null },
  { to: '/admin/demos',          label: 'Demos',         icon: '📋', statusKey: 'draft' },
  { to: '/admin/businesses',     label: 'Negocios',      icon: '🏪', statusKey: 'active' },
  { to: '/admin/prospects',      label: 'Prospectos',    icon: '👥', statusKey: 'pending' },
  { to: '/admin/sent',           label: 'Enviados',      icon: '📤', statusKey: 'sent' },
  { to: '/admin/accepted',       label: 'Aceptados',     icon: '✅', statusKey: 'accepted' },
]

const router = useRouter()
async function logout() {
  await signOut(getAuth())
  router.push('/login')
}
</script>
```

### Composable: useStatusCounts

File: `apps/admin/app/composables/useStatusCounts.ts`

```typescript
import { collection, query, where, onSnapshot, getFirestore } from 'firebase/firestore'
import type { BusinessStatus } from '@sass-factory/core'

export function useStatusCounts() {
  const db = getFirestore()
  const statusCounts = ref<Partial<Record<BusinessStatus | 'pending', number>>>({})

  const businessStatuses: BusinessStatus[] = ['draft', 'demo', 'sent', 'accepted', 'active', 'suspended']

  // Subscribe to count per status
  const unsubscribers: (() => void)[] = []

  onMounted(() => {
    businessStatuses.forEach((status) => {
      const q = query(collection(db, 'businesses'), where('status', '==', status))
      const unsub = onSnapshot(q, (snap) => {
        statusCounts.value = { ...statusCounts.value, [status]: snap.size }
      })
      unsubscribers.push(unsub)
    })

    // Prospect pending count
    const prospectQ = query(collection(db, 'prospects'), where('status', '==', 'pending'))
    const unsub = onSnapshot(prospectQ, (snap) => {
      statusCounts.value = { ...statusCounts.value, pending: snap.size }
    })
    unsubscribers.push(unsub)
  })

  onUnmounted(() => {
    unsubscribers.forEach((fn) => fn())
  })

  return { statusCounts }
}
```

### MFE Error Boundary

File: `apps/admin/app/components/MfeErrorBoundary.vue`

```vue
<template>
  <div v-if="hasError" class="p-8 text-center border border-neutral-200 rounded-xl">
    <p class="text-4xl mb-3">⚠️</p>
    <h3 class="text-lg font-semibold text-neutral-700">El módulo no está disponible</h3>
    <p class="text-sm text-neutral-500 mt-2">
      No se pudo cargar el módulo remoto. Verifica que el servicio esté corriendo.
    </p>
    <Button variant="secondary" size="sm" class="mt-4" @click="retry">
      Reintentar
    </Button>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
const hasError = ref(false)

function retry() {
  hasError.value = false
}

// Vue error boundary via onErrorCaptured
onErrorCaptured((err) => {
  console.error('[MfeErrorBoundary] Remote load failed:', err)
  hasError.value = true
  return false  // prevent bubbling to parent
})
</script>
```

### Admin Layout

File: `apps/admin/app/layouts/admin.vue`

```vue
<template>
  <div class="flex min-h-screen bg-neutral-50">
    <AdminSidebar />
    <div class="flex-1 flex flex-col">
      <header class="h-16 border-b border-neutral-200 bg-white px-6 flex items-center justify-between">
        <slot name="header" />
        <ProspectNotificationBell />
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <MfeErrorBoundary>
          <slot />
        </MfeErrorBoundary>
      </main>
    </div>
  </div>
</template>
```

---

## generate.post.ts — Repurposed for Catalog Domain

File: `apps/admin/server/api/admin/demos/generate.post.ts`

This reuses the existing SSE streaming infrastructure. The only change is the **system prompt** and the **output schema**.

```typescript
import { defineEventHandler, createError, readBody, setHeader } from 'h3'
import Anthropic from '@anthropic-ai/sdk'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAuth, checkGenerationLimit } from '../../../middleware/auth'
import { initAdmin } from '../../../utils/firebase-admin'
import { logger } from '@sass-factory/core'
import type { Business, Item } from '@sass-factory/core'
import { z } from 'zod'

const GenerateSchema = z.object({
  businessName: z.string().min(1, 'businessName is required').max(100),
  businessType: z.enum([
    'restaurant', 'cafe', 'bakery', 'ice_cream', 'food_truck',
    'clothing', 'beauty', 'pharmacy', 'hardware', 'electronics', 'grocery', 'flowers', 'other'
  ]),
  notes: z.string().max(500).optional(),
})

const CATALOG_SYSTEM_PROMPT = `You are a catalog generator for Mexican small businesses. 
Given a business name and type, generate a complete business catalog demo.

Respond with ONLY valid JSON matching this exact structure:
{
  "business": {
    "name": "string — the business display name",
    "tagline": "string — 1 short catchy phrase in Spanish, max 80 chars",
    "theme": {
      "primary": "hex color string — brand primary",
      "secondary": "hex color string — secondary",
      "accent": "hex color string — CTA accent",
      "background": "hex color string — page background",
      "font": "Google Font name string",
      "emoji": "single emoji representing the business"
    }
  },
  "categories": [
    { "name": "string", "emoji": "string", "order": number }
  ],
  "items": [
    {
      "name": "string — product name in Spanish",
      "description": "string — 1 sentence description in Spanish, optional",
      "price": number — price in MXN pesos (realistic for the business type),
      "categoryName": "string — must match a category name from categories array",
      "featured": boolean,
      "order": number
    }
  ]
}

Rules:
- Generate 2–4 categories appropriate for the business type
- Generate 3–5 items per category (10–15 items total)
- Prices must be realistic MXN amounts (e.g., helados: 25–80, restaurant entrees: 80–220)
- tagline must be in Mexican Spanish, max 80 chars, catchy and friendly
- Theme colors must work well together visually — avoid clashing combinations
- Font must be a real Google Fonts name (e.g., "Nunito", "Lato", "Playfair Display", "Poppins", "Merriweather")
- Emoji must be single character, relevant to the business type
- All text in Spanish (except font names)
- Do not include markdown, do not include explanation — ONLY the JSON object`

export default defineEventHandler(async (event) => {
  initAdmin()
  const user = await requireAuth(event, { requiredRole: 'admin' })
  checkGenerationLimit(user.uid)

  const rawBody = await readBody(event)
  const body = GenerateSchema.safeParse(rawBody)

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation error',
      data: body.error.flatten().fieldErrors,
    })
  }

  const { businessName, businessType, notes } = body.data

  // Configure SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const res = event.node.res
  res.flushHeaders()

  function sendEvent(eventName: string, data: unknown) {
    res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const client = new Anthropic()
  let fullText = ''

  try {
    sendEvent('start', { message: 'Generando catálogo con IA...' })

    const userPrompt = `Business name: ${businessName}
Business type: ${businessType}
${notes ? `Additional notes: ${notes}` : ''}

Generate a complete catalog demo for this business.`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: CATALOG_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    sendEvent('progress', { step: 'generating', message: 'Claude está generando el catálogo...' })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text
        // Stream partial text to show typing effect
        sendEvent('chunk', { text: chunk.delta.text })
      }
    }

    sendEvent('progress', { step: 'parsing', message: 'Procesando respuesta...' })

    // Parse the AI-generated JSON
    let parsed: { business: Partial<Business>; categories: any[]; items: any[] }
    try {
      parsed = JSON.parse(fullText)
    } catch {
      throw new Error('AI returned invalid JSON — cannot parse catalog')
    }

    sendEvent('progress', { step: 'saving', message: 'Guardando en Firestore...' })

    const db = getFirestore()
    const now = new Date().toISOString()

    // Generate URL-safe slug from business name
    const slug = parsed.business.name!
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)

    // Ensure slug uniqueness by appending random suffix if needed
    const uniqueSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

    const businessDoc: Omit<Business, 'id'> = {
      slug: uniqueSlug,
      name: parsed.business.name!,
      tagline: parsed.business.tagline || '',
      type: businessType,
      theme: parsed.business.theme!,
      status: 'draft',
      phone: '',    // Admin fills in after generation
      generatedBy: user.uid,
      createdAt: now,
      updatedAt: now,
    }

    const businessRef = await db.collection('businesses').add(businessDoc)

    // Create categories as subcollection
    const categoryIdMap = new Map<string, string>()
    for (const cat of parsed.categories) {
      const catRef = await businessRef.collection('categories').add({
        businessId: businessRef.id,
        name: cat.name,
        emoji: cat.emoji ?? '',
        order: cat.order,
        createdAt: now,
        updatedAt: now,
      })
      categoryIdMap.set(cat.name, catRef.id)
    }

    // Create items as subcollection
    for (const item of parsed.items) {
      const categoryId = categoryIdMap.get(item.categoryName) ?? ''
      await businessRef.collection('items').add({
        businessId: businessRef.id,
        categoryId,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        available: true,
        featured: item.featured ?? false,
        order: item.order,
        createdAt: now,
        updatedAt: now,
      })
    }

    sendEvent('complete', {
      businessId: businessRef.id,
      slug: uniqueSlug,
      business: { ...businessDoc, id: businessRef.id },
      categoryCount: parsed.categories.length,
      itemCount: parsed.items.length,
    })

    logger.info('Business demo generated', {
      businessId: businessRef.id,
      slug: uniqueSlug,
      generatedBy: user.uid,
      type: businessType,
    })

  } catch (err: any) {
    logger.error('Generation failed', { uid: user.uid }, err)
    sendEvent('error', { message: err.message ?? 'Error generando el catálogo' })
  } finally {
    res.end()
  }
})
```

---

## Business Lifecycle API Endpoints

### Status Transition Validator (server utility)

File: `apps/admin/server/utils/status-transitions.ts`

```typescript
import { createError } from 'h3'
import { validateTransition } from '@sass-factory/core'
import type { BusinessStatus } from '@sass-factory/core'
import { getFirestore } from 'firebase-admin/firestore'

export async function performTransition(
  businessId: string,
  toStatus: BusinessStatus,
  extraFields: Record<string, unknown> = {}
): Promise<void> {
  const db = getFirestore()
  const ref = db.collection('businesses').doc(businessId)
  const snap = await ref.get()

  if (!snap.exists) {
    throw createError({ statusCode: 404, message: `Business ${businessId} not found` })
  }

  const current = snap.data()!.status as BusinessStatus

  try {
    validateTransition(current, toStatus)
  } catch (err: any) {
    throw createError({ statusCode: 422, message: err.message })
  }

  const now = new Date().toISOString()
  await ref.update({
    status: toStatus,
    updatedAt: now,
    ...extraFields,
  })
}
```

### POST /api/admin/businesses/[id]/publish (draft → demo)

```typescript
// server/api/admin/businesses/[id]/publish.post.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { requireAuth } from '../../../middleware/auth'
import { performTransition } from '../../../utils/status-transitions'
import { initAdmin } from '../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  initAdmin()
  await requireAuth(event, { requiredRole: 'admin' })
  const id = getRouterParam(event, 'id')!

  await performTransition(id, 'demo', { demoPublishedAt: new Date().toISOString() })

  return { success: true, businessId: id, newStatus: 'demo' }
})
```

### POST /api/admin/businesses/[id]/send (demo → sent)

```typescript
// server/api/admin/businesses/[id]/send.post.ts
import { defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../../middleware/auth'
import { performTransition } from '../../../utils/status-transitions'
import { initAdmin } from '../../../utils/firebase-admin'

const SendSchema = z.object({
  sentVia: z.enum(['whatsapp', 'email', 'other']).optional(),
})

export default defineEventHandler(async (event) => {
  initAdmin()
  await requireAuth(event, { requiredRole: 'admin' })
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, SendSchema.parse)

  await performTransition(id, 'sent', {
    sentAt: new Date().toISOString(),
    sentVia: body.sentVia ?? 'whatsapp',
    // Set expiry 7 days from now
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return { success: true, businessId: id, newStatus: 'sent' }
})
```

### POST /api/admin/businesses/[id]/activate (accepted → active)

```typescript
// server/api/admin/businesses/[id]/activate.post.ts
import { defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../../middleware/auth'
import { performTransition } from '../../../utils/status-transitions'
import { getFirestore } from 'firebase-admin/firestore'
import { initAdmin } from '../../../utils/firebase-admin'

const ActivateSchema = z.object({
  phone: z.string().regex(/^(\+?52)?[1-9]\d{9}$/, 'Invalid Mexican phone number'),
  ownerEmail: z.string().email(),
})

export default defineEventHandler(async (event) => {
  initAdmin()
  await requireAuth(event, { requiredRole: 'admin' })
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, ActivateSchema.parse)

  // Normalize phone
  let phone = body.phone.replace(/\D/g, '')
  if (phone.length === 10) phone = `+52${phone}`

  await performTransition(id, 'active', {
    activatedAt: new Date().toISOString(),
    phone,
  })

  // TODO Sprint 5: send credentials email to ownerEmail
  // For now, log it
  const db = getFirestore()
  await db.collection('businesses').doc(id).update({ ownerEmail: body.ownerEmail })

  return {
    success: true,
    businessId: id,
    newStatus: 'active',
    message: `Business activated. Credentials email scheduled for ${body.ownerEmail}`,
  }
})
```

### POST /api/admin/businesses/[id]/suspend (active → suspended)

```typescript
// server/api/admin/businesses/[id]/suspend.post.ts
import { defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../../middleware/auth'
import { performTransition } from '../../../utils/status-transitions'
import { initAdmin } from '../../../utils/firebase-admin'

const SuspendSchema = z.object({
  reason: z.string().min(5).max(300),
})

export default defineEventHandler(async (event) => {
  initAdmin()
  await requireAuth(event, { requiredRole: 'admin' })
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, SuspendSchema.parse)

  await performTransition(id, 'suspended', {
    suspendedAt: new Date().toISOString(),
    suspensionReason: body.reason,
  })

  return { success: true, businessId: id, newStatus: 'suspended' }
})
```

### GET /api/admin/businesses (paginated, filtered)

```typescript
// server/api/admin/businesses/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getFirestore, Query } from 'firebase-admin/firestore'
import { requireAuth } from '../../middleware/auth'
import { initAdmin } from '../../utils/firebase-admin'
import type { BusinessStatus } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  initAdmin()
  await requireAuth(event, { requiredRole: 'admin' })

  const { status, limit = '20', cursor } = getQuery(event) as {
    status?: BusinessStatus
    limit?: string
    cursor?: string
  }

  const db = getFirestore()
  let query: Query = db.collection('businesses').orderBy('createdAt', 'desc')

  if (status) {
    query = query.where('status', '==', status)
  }

  const pageSize = Math.min(parseInt(limit), 100)
  query = query.limit(pageSize)

  if (cursor) {
    const cursorDoc = await db.collection('businesses').doc(cursor).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const snap = await query.get()
  const businesses = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))

  const nextCursor = snap.docs.length === pageSize
    ? snap.docs[snap.docs.length - 1].id
    : null

  return {
    businesses,
    nextCursor,
    count: businesses.length,
  }
})
```

### GET /api/admin/prospects (paginated)

```typescript
// server/api/admin/prospects/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAuth } from '../../middleware/auth'
import { initAdmin } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  initAdmin()
  await requireAuth(event, { requiredRole: 'admin' })

  const { status = 'pending', limit = '20', cursor, businessId } = getQuery(event) as {
    status?: string
    limit?: string
    cursor?: string
    businessId?: string
  }

  const db = getFirestore()
  let query = db.collection('prospects')
    .where('status', '==', status)
    .orderBy('submittedAt', 'desc')
    .limit(Math.min(parseInt(limit), 100))

  if (businessId) {
    query = db.collection('prospects')
      .where('status', '==', status)
      .where('businessId', '==', businessId)
      .orderBy('submittedAt', 'desc')
      .limit(Math.min(parseInt(limit), 100))
  }

  if (cursor) {
    const cursorDoc = await db.collection('prospects').doc(cursor).get()
    if (cursorDoc.exists) query = query.startAfter(cursorDoc)
  }

  const snap = await query.get()

  return {
    prospects: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    nextCursor: snap.docs.length === Math.min(parseInt(limit), 100)
      ? snap.docs[snap.docs.length - 1].id
      : null,
  }
})
```

---

## Demo MFE Components

### GenerateForm.vue

File: `apps/mfe/demo/components/GenerateForm.vue`

```vue
<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-neutral-900 mb-2">Generar Demo</h1>
    <p class="text-neutral-500 mb-6">
      Ingresa el nombre y tipo del negocio. La IA creará un catálogo completo en segundos.
    </p>

    <form v-if="!generating && !result" @submit.prevent="generate" class="space-y-4">
      <Input
        v-model="form.businessName"
        label="Nombre del negocio"
        placeholder="Ej: Heladería El Pingüino"
        :error="errors.businessName"
        required
      />

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">Tipo de negocio</label>
        <select
          v-model="form.businessType"
          class="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option v-for="(label, value) in BUSINESS_TYPE_LABELS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">
          Notas adicionales <span class="text-neutral-400">(opcional)</span>
        </label>
        <textarea
          v-model="form.notes"
          class="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows="3"
          placeholder="Ej: especialidades regionales, productos sin gluten, precios económicos..."
          maxlength="500"
        />
      </div>

      <Button type="submit" variant="primary" full-width size="lg">
        ✨ Generar Catálogo
      </Button>
    </form>

    <!-- SSE Streaming Progress -->
    <div v-if="generating" class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
        <span class="text-neutral-700">{{ currentStep }}</span>
      </div>

      <div
        v-if="streamingText"
        class="bg-neutral-50 border border-neutral-200 rounded-lg p-4 font-mono text-xs text-neutral-600 max-h-64 overflow-y-auto whitespace-pre-wrap"
      >
        {{ streamingText }}
      </div>
    </div>

    <!-- Error state -->
    <div v-if="generateError" class="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700">
      <p class="font-medium">Error al generar</p>
      <p class="text-sm mt-1">{{ generateError }}</p>
      <Button variant="secondary" size="sm" class="mt-3" @click="reset">Intentar de nuevo</Button>
    </div>

    <!-- Success state — preview -->
    <div v-if="result" class="space-y-4">
      <div class="bg-success-50 border border-success-200 rounded-lg p-4">
        <p class="font-medium text-success-800">✅ Demo generado exitosamente</p>
        <p class="text-sm text-success-700 mt-1">
          {{ result.itemCount }} productos en {{ result.categoryCount }} categorías
        </p>
      </div>

      <div class="flex gap-3">
        <Button variant="primary" @click="goToDemo(result.slug)">
          Ver demo
        </Button>
        <Button variant="secondary" @click="goToBusiness(result.businessId)">
          Editar negocio
        </Button>
        <Button variant="ghost" @click="reset">
          Generar otro
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurante',
  cafe: 'Café',
  bakery: 'Panadería',
  ice_cream: 'Heladería / Nevería',
  food_truck: 'Food Truck',
  clothing: 'Ropa y Accesorios',
  beauty: 'Salón / Barbería',
  pharmacy: 'Farmacia',
  hardware: 'Ferretería',
  electronics: 'Electrónica',
  grocery: 'Abarrotes / Miscelánea',
  flowers: 'Florería',
  other: 'Otro',
}

const form = ref({
  businessName: '',
  businessType: 'restaurant' as string,
  notes: '',
})

const errors = ref<{ businessName?: string }>({})
const generating = ref(false)
const generateError = ref('')
const currentStep = ref('Iniciando generación...')
const streamingText = ref('')
const result = ref<{ businessId: string; slug: string; categoryCount: number; itemCount: number } | null>(null)

const { getIdToken } = useAuth()

function validate(): boolean {
  errors.value = {}
  if (!form.value.businessName.trim()) {
    errors.value.businessName = 'El nombre del negocio es requerido'
    return false
  }
  return true
}

async function generate() {
  if (!validate()) return

  generating.value = true
  generateError.value = ''
  streamingText.value = ''
  result.value = null

  try {
    const token = await getIdToken()
    const response = await fetch('/api/admin/demos/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessName: form.value.businessName.trim(),
        businessType: form.value.businessType,
        notes: form.value.notes.trim() || undefined,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Error desconocido' }))
      if (response.status === 400) {
        generateError.value = 'Datos inválidos: ' + (err.data?.businessName?.[0] ?? err.message)
      } else if (response.status === 429) {
        generateError.value = 'Límite diario alcanzado (5 demos por día)'
      } else {
        generateError.value = err.message ?? 'Error del servidor'
      }
      generating.value = false
      return
    }

    // Read SSE stream
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = JSON.parse(line.slice(6))

        if (line.startsWith('event: chunk')) {
          // This won't work with the standard SSE format above — need to parse event name
        }
        if (data.step) {
          currentStep.value = data.message ?? data.step
        }
        if (data.text) {
          streamingText.value += data.text
        }
        if (data.businessId) {
          result.value = {
            businessId: data.businessId,
            slug: data.slug,
            categoryCount: data.categoryCount,
            itemCount: data.itemCount,
          }
        }
        if (data.message && data.message.includes('Error')) {
          generateError.value = data.message
        }
      }
    }
  } catch (err: any) {
    generateError.value = err.message ?? 'Error de red'
  } finally {
    generating.value = false
  }
}

function reset() {
  result.value = null
  generateError.value = ''
  streamingText.value = ''
  form.value = { businessName: '', businessType: 'restaurant', notes: '' }
}

const router = useRouter()
function goToDemo(slug: string) { router.push(`/demo/${slug}`) }
function goToBusiness(id: string) { router.push(`/admin/businesses/${id}`) }
</script>
```

### DemoList.vue

```vue
<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Demos</h1>
      <NuxtLink to="/admin">
        <Button variant="primary" size="sm">✨ Nuevo</Button>
      </NuxtLink>
    </div>

    <!-- Status filter tabs -->
    <div class="flex gap-2 mb-6 overflow-x-auto">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        @click="activeStatus = s.value"
        :class="[
          'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
          activeStatus === s.value
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        ]"
      >
        {{ s.label }}
        <span class="ml-1 text-xs opacity-70">{{ statusCounts[s.value] ?? 0 }}</span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" variant="card" height="80px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!businesses.length" class="text-center py-16">
      <p class="text-4xl mb-3">📋</p>
      <h3 class="text-lg font-medium text-neutral-700">Sin demos en este estado</h3>
      <p class="text-sm text-neutral-500 mt-1">Genera un nuevo demo para empezar.</p>
    </div>

    <!-- Business list -->
    <div v-else class="space-y-3">
      <DemoCard
        v-for="business in businesses"
        :key="business.id"
        :business="business"
        @action="handleAction"
      />
    </div>

    <!-- Load more -->
    <div v-if="nextCursor" class="text-center mt-6">
      <Button variant="secondary" :loading="loadingMore" @click="loadMore">
        Cargar más
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Business, BusinessStatus } from '@sass-factory/core'

const statusFilters = [
  { value: null,         label: 'Todos' },
  { value: 'draft',      label: 'Borradores' },
  { value: 'demo',       label: 'Demo' },
  { value: 'sent',       label: 'Enviados' },
  { value: 'accepted',   label: 'Aceptados' },
  { value: 'active',     label: 'Activos' },
  { value: 'suspended',  label: 'Suspendidos' },
]

const activeStatus = ref<BusinessStatus | null>(null)
const businesses = ref<Business[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const { statusCounts } = useStatusCounts()
const { fetchBusinesses, performAction } = useAdminBusinesses()

async function load(reset = true) {
  if (reset) {
    loading.value = true
    businesses.value = []
    nextCursor.value = null
  } else {
    loadingMore.value = true
  }

  try {
    const result = await fetchBusinesses({
      status: activeStatus.value ?? undefined,
      cursor: reset ? undefined : nextCursor.value ?? undefined,
    })
    businesses.value = reset ? result.businesses : [...businesses.value, ...result.businesses]
    nextCursor.value = result.nextCursor
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() { load(false) }

watch(activeStatus, () => load())
onMounted(() => load())

async function handleAction(event: { businessId: string; action: string }) {
  await performAction(event.businessId, event.action)
  load()
}
</script>
```

### DemoCard.vue

```vue
<template>
  <div class="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-neutral-300 transition-colors">
    <div class="flex items-center gap-3 min-w-0">
      <span class="text-2xl">{{ business.theme?.emoji ?? '🏪' }}</span>
      <div class="min-w-0">
        <h3 class="font-semibold text-neutral-900 truncate">{{ business.name }}</h3>
        <p class="text-sm text-neutral-500 truncate">{{ business.tagline }}</p>
        <p class="text-xs text-neutral-400 mt-0.5">{{ business.type }} · {{ relativeTime }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-shrink-0">
      <StatusBadge :status="business.status" size="sm" />
      <StatusActions
        :business-id="business.id"
        :status="business.status"
        @action="$emit('action', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Business } from '@sass-factory/core'

const props = defineProps<{ business: Business }>()
const emit = defineEmits<{ action: [payload: { businessId: string; action: string }] }>()

const relativeTime = computed(() => {
  const date = new Date(props.business.createdAt)
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
})
</script>
```

### StatusActions.vue

```vue
<template>
  <div class="relative" ref="container">
    <Button variant="ghost" size="sm" @click="open = !open">
      ⋮
    </Button>

    <div
      v-if="open"
      class="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 min-w-44"
    >
      <button
        v-for="action in availableActions"
        :key="action.key"
        @click="trigger(action.key)"
        :class="[
          'w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2',
          action.destructive ? 'text-error-600' : 'text-neutral-700'
        ]"
      >
        {{ action.icon }} {{ action.label }}
      </button>

      <div v-if="!availableActions.length" class="px-4 py-2 text-sm text-neutral-400">
        Sin acciones disponibles
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BusinessStatus } from '@sass-factory/core'

const props = defineProps<{ businessId: string; status: BusinessStatus }>()
const emit = defineEmits<{ action: [payload: { businessId: string; action: string }] }>()

const open = ref(false)
const container = ref<HTMLElement | null>(null)

const ACTION_MAP: Record<BusinessStatus, Array<{ key: string; label: string; icon: string; destructive?: boolean }>> = {
  draft:     [{ key: 'publish', label: 'Publicar demo',     icon: '🚀' }],
  demo:      [{ key: 'send',    label: 'Marcar como enviado', icon: '📤' }],
  sent:      [{ key: 'activate', label: 'Activar negocio',   icon: '✅' }],
  accepted:  [{ key: 'activate', label: 'Activar negocio',   icon: '✅' }],
  active:    [{ key: 'suspend', label: 'Suspender',          icon: '⏸', destructive: true }],
  suspended: [{ key: 'activate', label: 'Reactivar',         icon: '▶️' }],
  expired:   [],
}

const availableActions = computed(() => ACTION_MAP[props.status] ?? [])

function trigger(action: string) {
  open.value = false
  emit('action', { businessId: props.businessId, action })
}

// Close on outside click
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (container.value && !container.value.contains(e.target as Node)) {
      open.value = false
    }
  })
})
</script>
```

### ProspectNotificationBell.vue (real-time)

File: `apps/admin/app/components/ProspectNotificationBell.vue`

```vue
<template>
  <div class="relative">
    <button
      @click="panelOpen = !panelOpen"
      class="relative p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
    >
      🔔
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="panelOpen"
      class="absolute right-0 top-10 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl z-50"
    >
      <div class="p-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 class="font-semibold text-neutral-900">Notificaciones</h3>
        <button
          v-if="unreadCount > 0"
          @click="markAllRead"
          class="text-xs text-primary-600 hover:underline"
        >
          Marcar todas leídas
        </button>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="!notifications.length" class="p-8 text-center text-neutral-400 text-sm">
          Sin notificaciones
        </div>

        <div
          v-for="n in notifications"
          :key="n.id"
          :class="[
            'p-4 border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer',
            !n.read ? 'bg-primary-50' : ''
          ]"
          @click="openBusiness(n.businessId)"
        >
          <div class="flex items-start gap-2">
            <span class="text-lg">{{ notificationIcon(n.type) }}</span>
            <div>
              <p class="text-sm font-medium text-neutral-900">{{ notificationTitle(n) }}</p>
              <p class="text-xs text-neutral-500 mt-0.5">{{ n.prospectName }} · {{ relativeTime(n.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  writeBatch,
  getFirestore,
} from 'firebase/firestore'

interface Notification {
  id: string
  type: string
  businessId: string
  businessName: string
  prospectName: string
  read: boolean
  createdAt: string
}

const db = getFirestore()
const panelOpen = ref(false)
const notifications = ref<Notification[]>([])
const router = useRouter()

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

// Real-time listener — Firestore pushes changes within ~1s
onMounted(() => {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(20)
  )

  const unsubscribe = onSnapshot(q, (snap) => {
    notifications.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))
  })

  onUnmounted(() => unsubscribe())
})

function notificationIcon(type: string): string {
  const icons: Record<string, string> = {
    prospect_accepted: '✅',
    business_activated: '🎉',
    business_suspended: '⚠️',
  }
  return icons[type] ?? '🔔'
}

function notificationTitle(n: Notification): string {
  if (n.type === 'prospect_accepted') return `${n.businessName} — prospecto aceptó el demo`
  return n.type
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  return `hace ${Math.floor(mins / 60)}h`
}

async function markAllRead() {
  const batch = writeBatch(db)
  const unread = notifications.value.filter((n) => !n.read)
  unread.forEach((n) => {
    batch.update(doc(db, 'notifications', n.id), { read: true })
  })
  await batch.commit()
}

function openBusiness(id: string) {
  panelOpen.value = false
  router.push(`/admin/businesses/${id}`)
}
</script>
```

---

## Vitest Tests for API Endpoints

File: `apps/admin/server/api/admin/__tests__/businesses.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { performTransition } from '../../../utils/status-transitions'

// Mock firebase-admin
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        update: vi.fn(),
      })),
    })),
  })),
}))

describe('performTransition', () => {
  it('transitions draft → demo successfully', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const mockGet = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ status: 'draft', name: 'Test Business' }),
    })

    vi.mocked(require('firebase-admin/firestore').getFirestore).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: mockGet,
          update: mockUpdate,
        }),
      }),
    })

    await performTransition('business-id-123', 'demo')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'demo' })
    )
  })

  it('throws 422 for invalid transition active → demo', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ status: 'active' }),
    })

    vi.mocked(require('firebase-admin/firestore').getFirestore).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: mockGet,
          update: vi.fn(),
        }),
      }),
    })

    await expect(performTransition('business-id-123', 'demo')).rejects.toMatchObject({
      statusCode: 422,
    })
  })

  it('throws 404 when business does not exist', async () => {
    const mockGet = vi.fn().mockResolvedValue({ exists: false })

    vi.mocked(require('firebase-admin/firestore').getFirestore).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: mockGet,
          update: vi.fn(),
        }),
      }),
    })

    await expect(performTransition('nonexistent-id', 'demo')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

describe('generate.post.ts input validation', () => {
  it('returns 400 when businessName is empty', async () => {
    // This tests the Zod schema validation layer
    const { GenerateSchema } = await import('../demos/generate.post')
    const result = GenerateSchema.safeParse({ businessName: '', businessType: 'cafe' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.businessName).toBeDefined()
  })

  it('returns 400 when businessType is invalid', async () => {
    const { GenerateSchema } = await import('../demos/generate.post')
    const result = GenerateSchema.safeParse({ businessName: 'Test', businessType: 'invalid_type' })
    expect(result.success).toBe(false)
  })

  it('accepts valid businessName and businessType', async () => {
    const { GenerateSchema } = await import('../demos/generate.post')
    const result = GenerateSchema.safeParse({ businessName: 'Heladería Test', businessType: 'ice_cream' })
    expect(result.success).toBe(true)
  })
})
```

---

## Gherkin Specifications

```gherkin
Feature: Admin generates a business demo via AI
  As Erick (admin)
  I want to input a business name and type and have Claude generate a full catalog demo
  So that I can create demos quickly for potential customers

  Background:
    Given Erick is logged in to the admin panel
    And Erick has generated fewer than 5 demos today
    And the Anthropic API is available

  Scenario: Successful generation streams to browser
    Given Erick is on the /admin (GenerateForm) page
    When Erick enters business name "Heladería El Pingüino" and type "ice_cream"
    And clicks "Generar Catálogo"
    Then the form is replaced by a streaming progress view
    And the partial JSON streams in the typing display area
    And the step label shows "Claude está generando el catálogo..."
    And after completion, the step label shows "Guardando en Firestore..."
    And a success message appears: "Demo generado exitosamente — X productos en Y categorías"
    And a "Ver demo" link appears pointing to /demo/{slug}
    And the business is saved in Firestore with status "draft"
    And items are saved as a subcollection under the business document

  Scenario: Generation with empty prompt returns 400
    Given Erick is on the /admin page
    When Erick submits the GenerateForm with businessName=""
    Then no POST request is made to /api/admin/demos/generate
    And a validation error appears: "El nombre del negocio es requerido"
    And the form remains open

  Scenario: Generation fails mid-stream, error state shown
    Given Erick is on the /admin page
    And the Anthropic API returns an error mid-stream
    When Erick submits a valid GenerateForm
    Then the SSE stream sends an error event
    And the UI shows the error state: "Error al generar"
    And an "Intentar de nuevo" button resets the form
    And the business is NOT saved in Firestore (partial saves are rolled back)

  Scenario: Rate limit exceeded (5/day) returns 429
    Given Erick has already generated 5 demos today
    When Erick submits a new GenerateForm
    Then the POST to /api/admin/demos/generate returns 429
    And the UI shows "Límite diario alcanzado (5 demos por día)"
    And the form remains open

Feature: Business status transitions
  As Erick (admin)
  I want to move businesses through their lifecycle states
  So that I can control when customers see their demo and when they get activated

  Background:
    Given Erick is logged in to the admin panel

  Scenario: Admin publishes draft → demo (storefront becomes accessible)
    Given a business "Heladería El Pingüino" has status "draft"
    When Erick clicks "Publicar demo" in the StatusActions menu
    Then POST /api/admin/businesses/{id}/publish is called
    And the business status in Firestore changes to "demo"
    And the storefront at /demo/{slug} returns 200 with the catalog
    And the DemoCard in the UI updates to show the "Demo" badge without page refresh

  Scenario: Admin tries invalid transition (active → demo) is rejected with 422
    Given a business has status "active"
    When a PUT/POST request is made to transition it to status "demo"
    Then the server returns 422
    And the response body contains "Invalid status transition: active → demo"
    And the business status in Firestore remains "active"
    And the UI shows an error toast

  Scenario: Admin activates accepted business → business goes live
    Given a business has status "accepted"
    And Erick provides the owner's phone "+5215512345678" and email "owner@test.com"
    When Erick clicks "Activar negocio"
    Then POST /api/admin/businesses/{id}/activate is called
    And the business status in Firestore changes to "active"
    And the storefront at /{slug} (without /demo prefix) returns 200
    And a log entry is created noting activation and owner email

  Scenario: Admin suspends active business
    Given a business has status "active"
    When Erick clicks "Suspender" and enters reason "Falta de pago"
    Then POST /api/admin/businesses/{id}/suspend is called with reason
    And the business status changes to "suspended"
    And the storefront at /{slug} returns 410
    And the admin DemoCard shows the "Suspendido" red badge

  Scenario: Admin re-activates suspended business
    Given a business has status "suspended"
    When Erick clicks "Reactivar"
    Then POST /api/admin/businesses/{id}/activate is called
    And the business status changes to "active"
    And the storefront is accessible again

Feature: Real-time prospect notification
  As Erick
  I want to be notified within 5 seconds when a prospect accepts a demo
  So that I can follow up immediately while they're engaged

  Background:
    Given Erick has the admin panel open in his browser
    And the notification bell is visible in the header
    And a business "Test Helados" has status "sent"

  Scenario: Prospect submits form → admin sees notification within 5s
    Given Erick is looking at the admin panel
    When a prospect submits the ProspectModal form for "Test Helados"
    And the POST /api/prospects request succeeds
    Then within 5 seconds, the notification bell badge shows a count of 1
    And clicking the bell shows a notification: "Test Helados — prospecto aceptó el demo"
    And the notification is shown with the prospect's name and relative time ("ahora")
    And the business status in Firestore is "accepted"

  Scenario: Multiple notifications stack on the bell
    Given 3 different prospects submit forms for different businesses
    When all 3 POST /api/prospects requests succeed
    Then the notification bell badge shows 3
    And clicking the bell shows all 3 notifications in reverse chronological order

  Scenario: Marking all notifications as read clears the badge
    Given the bell shows 2 unread notifications
    When Erick clicks "Marcar todas leídas"
    Then all notification documents in Firestore are updated with read=true
    And the bell badge disappears
    And the notifications are still visible in the panel but without highlight

  Scenario: Notification click navigates to the business
    Given a notification for "Test Helados" is in the panel
    When Erick clicks the notification
    Then the panel closes
    And the router navigates to /admin/businesses/{businessId}
```

---

## Files Created / Modified This Sprint

| File | Action | Owner |
|------|--------|-------|
| `apps/admin/app/pages/login.vue` | CREATE | shell-agent |
| `apps/admin/app/middleware/auth.ts` | CREATE | shell-agent |
| `apps/admin/app/layouts/admin.vue` | CREATE | shell-agent |
| `apps/admin/app/components/AdminSidebar.vue` | CREATE | shell-agent |
| `apps/admin/app/components/MfeErrorBoundary.vue` | CREATE | shell-agent |
| `apps/admin/app/components/ProspectNotificationBell.vue` | CREATE | shell-agent |
| `apps/admin/app/composables/useStatusCounts.ts` | CREATE | shell-agent |
| `apps/admin/app/composables/useCurrentUser.ts` | CREATE | shell-agent |
| `apps/admin/app/composables/useAdminBusinesses.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/demos/generate.post.ts` | REWRITE (keep SSE infra) | demo-mf-agent |
| `apps/admin/server/api/admin/businesses/index.get.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/businesses/[id]/publish.post.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/businesses/[id]/send.post.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/businesses/[id]/activate.post.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/businesses/[id]/suspend.post.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/prospects/index.get.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/utils/status-transitions.ts` | CREATE | demo-mf-agent |
| `apps/admin/server/api/admin/__tests__/businesses.test.ts` | CREATE | demo-mf-agent |
| `apps/mfe/demo/components/GenerateForm.vue` | REWRITE (was placeholder) | demo-mf-agent |
| `apps/mfe/demo/components/DemoList.vue` | REWRITE (was placeholder) | demo-mf-agent |
| `apps/mfe/demo/components/DemoCard.vue` | CREATE | demo-mf-agent |
| `apps/mfe/demo/components/StatusActions.vue` | CREATE | demo-mf-agent |
| `apps/mfe/demo/composables/useAuth.ts` | CREATE | demo-mf-agent |
| `apps/mfe/demo/composables/useStatusCounts.ts` | CREATE | demo-mf-agent |
| `apps/mfe/demo/composables/useAdminBusinesses.ts` | CREATE | demo-mf-agent |

---

## MR Template

**Title:** `feat(sprint-4): admin shell auth + demo generator MFE with AI catalog generation`

**Description:**

```
## What this MR does

Sprint 4 deliverable: the internal admin tool that drives the entire sales flow.

### Admin Shell (apps/admin — shell-agent)
- pages/login.vue: Firebase email/password login; redirects with ?redirect= query param on protected routes
- middleware/auth.ts: client-side route guard using Firebase onAuthStateChanged
- layouts/admin.vue: sidebar + header layout with MFE error boundary
- AdminSidebar.vue: navigation with real-time status counts from Firestore onSnapshot
- MfeErrorBoundary.vue: catches MFE remote load failures, shows fallback UI
- ProspectNotificationBell.vue: real-time bell with Firestore listener, mark-all-read, navigation on click
- useStatusCounts.ts: composable — subscribes to all BusinessStatus counts via Firestore listeners

### Demo MFE rewrite (apps/mfe/demo — demo-mf-agent)
- GenerateForm.vue: text input → POST /api/admin/demos/generate → SSE stream with progress display
  - Shows streaming JSON as it arrives
  - Handles 400 (validation), 429 (rate limit), mid-stream errors
  - On success: shows business slug link and edit link
- DemoList.vue: paginated list with status filter tabs and "load more" pagination
- DemoCard.vue: emoji, name, tagline, relative created time, StatusBadge, StatusActions dropdown
- StatusActions.vue: per-status action dropdown (publish/send/activate/suspend/reactivate)

### generate.post.ts — Repurposed for catalog domain
- SSE streaming infrastructure kept exactly as-is
- New system prompt: generates Business (name, tagline, theme) + categories + items in JSON
- New output schema: Business (draft status) + Category subcollection + Item subcollection in Firestore
- Zod input validation: businessName (required), businessType (enum), notes (optional)
- Server-side rate limit check: 5 generations/day/user via checkGenerationLimit()

### Business lifecycle API (6 new endpoints)
- POST /api/admin/businesses/{id}/publish: draft → demo
- POST /api/admin/businesses/{id}/send: demo → sent (sets sentAt + 7-day expiresAt)
- POST /api/admin/businesses/{id}/activate: accepted → active (requires phone + ownerEmail)
- POST /api/admin/businesses/{id}/suspend: active → suspended (requires reason)
- GET /api/admin/businesses: paginated, filterable by status
- GET /api/admin/prospects: paginated, filterable by status and businessId
- server/utils/status-transitions.ts: validateTransition from @sass-factory/core enforced server-side

### Tests
- Vitest: performTransition (valid transition, invalid transition 422, missing business 404)
- Vitest: GenerateSchema validation (empty name, invalid type, valid input)

## Pre-merge checklist
- [ ] `pnpm typecheck` passes across all packages
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (unit tests for status transitions + generate validation)
- [ ] Visiting /admin without login redirects to /login
- [ ] Login with valid credentials redirects to /admin
- [ ] Login with wrong password shows "Correo o contraseña incorrectos"
- [ ] GenerateForm: empty businessName shows validation error, no API call
- [ ] GenerateForm: valid input streams SSE events, shows progress steps
- [ ] GenerateForm: after successful generation, business exists in Firestore with status "draft"
- [ ] POST /api/admin/businesses/{id}/publish with draft business returns 200, status becomes "demo"
- [ ] POST /api/admin/businesses/{id}/publish with active business returns 422
- [ ] POST /api/admin/businesses/{id}/activate with accepted business returns 200, status becomes "active"
- [ ] /demo/{slug} is accessible after publish (status=demo)
- [ ] /{slug} is accessible after activate (status=active)
- [ ] /{slug} returns 410 after suspend (status=suspended)
- [ ] Notification bell shows count within 5s of prospect submission (manual test with emulator)
- [ ] MfeErrorBoundary shows fallback when demo-mf remote is not running
- [ ] StatusActions dropdown shows correct actions per business status
- [ ] GET /api/admin/businesses without Authorization returns 401
- [ ] GET /api/admin/businesses with valid token returns business list
```

---

## Definition of Done

- [ ] `pnpm typecheck` exits 0 across all packages
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 (all unit tests pass)
- [ ] Firebase login works: email/password → redirect to `/admin`
- [ ] Protected routes redirect to `/login?redirect=...` when unauthenticated
- [ ] GenerateForm submits → SSE stream → business saved in Firestore with status `draft`
- [ ] Empty businessName field blocks form submission with visible error
- [ ] 6th generation attempt on the same day returns 429 with clear message
- [ ] `performTransition('active', 'demo')` throws 422 (verified in unit test)
- [ ] All 5 status transition endpoints return 200 for valid transitions
- [ ] `GET /api/admin/businesses?status=draft` returns only draft businesses
- [ ] ProspectNotificationBell shows a new notification within 5s of a test prospect submission (Firebase emulator)
- [ ] MFE error boundary renders fallback when demo-mf remote URL is unreachable
- [ ] Admin sidebar status counts update without page refresh when a business changes status
- [ ] MR opened to `develop`, Erick reviewed and approved, merged
