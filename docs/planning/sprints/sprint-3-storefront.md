# Sprint 3 — Storefront Público

**Branch:** `sprint/3-storefront` from `develop`
**Duration:** 1.5 weeks
**Agents:** `storefront-agent` (solo, worktree isolated)
**Initiatives covered:** Business Catalog (E8)
**Pre-condition:** Sprint 2 MR merged to `develop`

---

## Objective

Build the public-facing storefront — the page that **customers of a business** visit to browse the catalog and send WhatsApp order messages. This is a separate Nuxt 4 app (`apps/storefront`) deployed independently to Cloud Run.

Key requirements:
- **Mobile-first** — the primary device is a phone customer clicking a WhatsApp link.
- **SSG for known slugs** — pre-render at build time, revalidate every 60 seconds (ISR).
- **SSR fallback** — new slugs that aren't pre-rendered serve from Nitro SSR.
- **Zero authentication** — the storefront is entirely public.
- **Demo mode** — same page, same catalog, with a sticky "¿Quieres esto?" banner when accessed via `/demo/{slug}`.
- **Prospect capture** — the CTA form in demo mode creates a Prospect record in Firestore.
- **Core Web Vitals** — LCP < 2.5s, CLS < 0.1, INP < 200ms on a 4G mobile connection.

---

## New App: `apps/storefront`

### Directory structure

```
apps/storefront/
├── app/
│   ├── layouts/
│   │   └── default.vue              ← minimal layout (no admin chrome)
│   ├── pages/
│   │   ├── [slug].vue               ← active business catalog
│   │   ├── demo/
│   │   │   └── [slug].vue           ← demo view with banner
│   │   ├── 404.vue                  ← styled not found
│   │   └── suspended.vue            ← business suspended page
│   └── components/
│       ├── StorefrontHeader.vue
│       ├── CategoryFilter.vue
│       ├── ProductGrid.vue
│       ├── ProductCard.vue          ← Tier 3, NOT in packages/ui
│       ├── ProductModal.vue
│       ├── DemoBanner.vue
│       ├── ProspectModal.vue
│       └── ViralFooter.vue
├── server/
│   └── api/
│       ├── storefront/
│       │   └── [slug].get.ts        ← public Firestore read
│       └── prospects.post.ts        ← public Prospect creation
├── nuxt.config.ts
├── package.json
└── vitest.config.ts
```

### `apps/storefront/package.json`

```json
{
  "name": "@sass-factory/storefront",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev":       "nuxt dev --port 3010",
    "build":     "nuxt build",
    "generate":  "nuxt generate",
    "preview":   "nuxt preview",
    "typecheck": "nuxt typecheck",
    "test":      "vitest run"
  },
  "dependencies": {
    "nuxt":               "^4.0.0",
    "vue":                "^3.4.0",
    "@sass-factory/core": "workspace:*",
    "@sass-factory/ui":   "workspace:*",
    "@sass-factory/tokens": "workspace:*",
    "firebase":           "^10.0.0",
    "firebase-admin":     "^12.0.0",
    "zod":                "^3.22.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "@vue/test-utils":    "^2.4.0",
    "vitest":             "^1.0.0",
    "happy-dom":          "^14.0.0"
  }
}
```

### `apps/storefront/nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  routeRules: {
    // Active business pages: SSG with ISR revalidation every 60 seconds
    '/:slug': { isr: 60 },
    // Demo pages: SSR only (do not cache — demo URLs are transient)
    '/demo/:slug': { ssr: true, cache: false },
    // API: no cache on storefront reads (Firestore is source of truth)
    '/api/storefront/**': { cache: false },
    // Prospects: no cache
    '/api/prospects': { cache: false },
  },

  nitro: {
    preset: 'cloudflare-pages',  // or 'gcp-cloud-run' for Cloud Run deployment
  },

  css: ['@sass-factory/tokens/dist/tokens.css'],

  modules: ['@unocss/nuxt'],

  unocss: {
    // UnoCSS config extends from root uno.config.ts
  },

  runtimeConfig: {
    // Private — server only
    firebaseProjectId:  '',
    firebasePrivateKey: '',
    firebaseClientEmail: '',
    // Public
    public: {
      whatsappBaseUrl: 'https://wa.me',
    },
  },
})
```

---

## Pages

### `app/pages/[slug].vue`

```vue
<template>
  <div>
    <StorefrontHeader
      :name="business.name"
      :tagline="business.tagline"
      :logo-url="business.logoUrl"
      :phone="business.phone"
    />

    <main class="max-w-screen-lg mx-auto px-4 py-6">
      <CategoryFilter
        :categories="categories"
        :active-id="activeCategory"
        @select="activeCategory = $event"
      />

      <ProductGrid
        :items="filteredItems"
        @select="openProduct"
      />
    </main>

    <ViralFooter />

    <ProductModal
      v-if="selectedItem"
      v-model="productModalOpen"
      :item="selectedItem"
      :phone="business.phone"
      :business-name="business.name"
    />
  </div>
</template>

<script setup lang="ts">
import type { Business, Item, Category } from '@sass-factory/core'

const route = useRoute()
const slug = route.params.slug as string

// useFetch with SSG — data is pre-rendered and revalidated via ISR
const { data, error } = await useFetch(`/api/storefront/${slug}`)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Negocio no encontrado' })
}

if (data.value.business.status === 'suspended') {
  navigateTo('/suspended')
}

if (data.value.business.status !== 'active') {
  throw createError({ statusCode: 404, statusMessage: 'Negocio no encontrado' })
}

const business = data.value.business as Business
const items = data.value.items as Item[]
const categories = data.value.categories as Category[]

const activeCategory = ref<string | null>(null)
const selectedItem = ref<Item | null>(null)
const productModalOpen = ref(false)

const filteredItems = computed(() => {
  if (!activeCategory.value) return items.filter((i) => i.available)
  return items.filter((i) => i.available && i.categoryId === activeCategory.value)
})

function openProduct(item: Item) {
  selectedItem.value = item
  productModalOpen.value = true
}

// SEO
useSeoMeta({
  title: `${business.name} — Catálogo`,
  description: business.tagline,
  ogTitle: business.name,
  ogDescription: business.tagline,
  ogImage: business.logoUrl,
})
</script>
```

### `app/pages/demo/[slug].vue`

```vue
<template>
  <div>
    <!-- Sticky demo banner — always visible in demo mode -->
    <DemoBanner
      :business-name="business.name"
      @cta-click="prospectModalOpen = true"
    />

    <StorefrontHeader
      :name="business.name"
      :tagline="business.tagline"
      :logo-url="business.logoUrl"
      :phone="business.phone"
      :is-demo="true"
    />

    <main class="max-w-screen-lg mx-auto px-4 py-6 mt-14">
      <!-- mt-14 to clear the sticky demo banner -->
      <CategoryFilter
        :categories="categories"
        :active-id="activeCategory"
        @select="activeCategory = $event"
      />

      <ProductGrid
        :items="filteredItems"
        :is-demo="true"
        @select="openProduct"
      />
    </main>

    <ViralFooter />

    <ProductModal
      v-if="selectedItem"
      v-model="productModalOpen"
      :item="selectedItem"
      :phone="business.phone"
      :business-name="business.name"
      :is-demo="true"
    />

    <ProspectModal
      v-model="prospectModalOpen"
      :business-id="business.id"
      :business-name="business.name"
    />
  </div>
</template>

<script setup lang="ts">
import type { Business, Item, Category } from '@sass-factory/core'

const route = useRoute()
const slug = route.params.slug as string

// Demo page: always SSR, never cached
const { data, error } = await useFetch(`/api/storefront/${slug}`)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Demo no encontrado' })
}

// Demo mode accepts demo, sent, accepted status
const validDemoStatuses = ['demo', 'sent', 'accepted']
if (!validDemoStatuses.includes(data.value.business.status)) {
  throw createError({ statusCode: 404, statusMessage: 'Demo no disponible' })
}

const business = data.value.business as Business
const items = data.value.items as Item[]
const categories = data.value.categories as Category[]

const activeCategory = ref<string | null>(null)
const selectedItem = ref<Item | null>(null)
const productModalOpen = ref(false)
const prospectModalOpen = ref(false)

const filteredItems = computed(() => {
  if (!activeCategory.value) return items
  return items.filter((i) => i.categoryId === activeCategory.value)
})

function openProduct(item: Item) {
  selectedItem.value = item
  productModalOpen.value = true
}

useSeoMeta({
  title: `${business.name} — Vista previa`,
  robots: 'noindex, nofollow',  // Demo pages must not be indexed
})
</script>
```

---

## Components (detailed)

### `StorefrontHeader.vue`

**Props:**
```typescript
interface Props {
  name: string
  tagline: string
  logoUrl?: string
  phone: string           // E.164 format
  isDemo?: boolean        // Adds "DEMO" label to header
}
```

Renders: logo (img or emoji fallback), business name, tagline, and a WhatsApp floating action button.

WhatsApp button: `<a :href="\`https://wa.me/${phone.replace(/\D/g, '')}\`" target="_blank" rel="noopener">`

---

### `CategoryFilter.vue`

**Props:**
```typescript
interface Props {
  categories: Category[]
  activeId: string | null
}
```

**Emits:**
```typescript
const emit = defineEmits<{ select: [categoryId: string | null] }>()
```

Renders pill/chip buttons. "Todos" pill is always first with value `null`. When a category is selected, its pill has the active state.

**Behavior:** Horizontally scrollable on mobile (overflow-x: auto, snap-x). Single row.

---

### `ProductGrid.vue`

**Props:**
```typescript
interface Props {
  items: Item[]
  isDemo?: boolean
}
```

**Emits:**
```typescript
const emit = defineEmits<{ select: [item: Item] }>()
```

**Layout:**
- Mobile: 2 columns
- Tablet (md+): 3 columns
- Desktop (lg+): 4 columns

Renders `ProductCard` for each item. Shows `EmptyState` when items array is empty.

---

### `ProductCard.vue` (Tier 3 — stays in apps/storefront)

**Props:**
```typescript
interface Props {
  item: Item
  isDemo?: boolean
}
```

**Emits:**
```typescript
const emit = defineEmits<{ select: [] }>()
```

**Renders:**
- Image: lazy-loaded with skeleton placeholder while loading. Falls back to emoji + colored background if no imageUrl.
- Name: max 2 lines, overflow ellipsis.
- Price: uses `<PriceDisplay>` from `@sass-factory/ui`.
- "Pedir" button: emits `select` — opens ProductModal.
- If `isDemo`: button label is "Me gusta" instead of "Pedir".

**CSS:** aspect-ratio: 1/1 on the image container to prevent CLS.

---

### `ProductModal.vue`

**Props:**
```typescript
interface Props {
  modelValue: boolean
  item: Item
  phone: string
  businessName: string
  isDemo?: boolean
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
```

**Renders:**
- Large product image (if available)
- Product name and description
- `<PriceDisplay>` component
- Quantity selector: − / [number] / + (min 1, max 99)
- WhatsApp CTA button

**WhatsApp URL format:**
```
https://wa.me/{e164phone}?text=Hola,%20quiero%20pedir%20{quantity}x%20{productName}%20(%24{price}%20MXN)%20de%20{businessName}
```

Where:
- `e164phone` = phone with all non-digits stripped
- `productName` = encodeURIComponent(item.name)
- `price` = item.price.toFixed(2)
- `businessName` = encodeURIComponent(business.name)
- `quantity` = current quantity value

**When `isDemo=true`:** WhatsApp button is replaced with a "Me interesa" button that opens ProspectModal.

---

### `DemoBanner.vue`

**Props:**
```typescript
interface Props {
  businessName: string
}
```

**Emits:**
```typescript
const emit = defineEmits<{ ctaClick: [] }>()
```

**Renders:** Sticky top bar (`position: sticky; top: 0; z-index: 1200`) with:
- Text: "¿Quieres un catálogo así para {businessName}?"
- Button: "¡Lo quiero!" → emits `ctaClick`

Background: primary color from the business theme (passed via CSS variable override or prop).

---

### `ProspectModal.vue`

**Props:**
```typescript
interface Props {
  modelValue: boolean
  businessId: string
  businessName: string
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()
```

**Form fields:**
- `name` (text, required, min 2 chars)
- `phone` (tel, required, must match Mexican phone: 10 digits or +52 prefix)
- `email` (email, optional)
- `message` (textarea, optional, max 300 chars)

**Validation:**
- Uses Zod schema matching `ProspectCreateInput` from `@sass-factory/core`
- Phone validation regex: `/^(\+?52)?[1-9]\d{9}$/`
- Shows inline field errors below each input

**On submit:**
1. Disable submit button + show loading state
2. POST to `/api/prospects` with `{ businessId, name, phone, email, message }`
3. On 200: show "¡Gracias! Te contactaremos pronto." → close modal after 2s
4. On 409 (duplicate): show "Ya recibimos tu mensaje. Te contactaremos pronto."
5. On validation error (400): show field errors
6. On server error (500): show "Hubo un error. Intenta de nuevo."

---

### `ViralFooter.vue`

Minimal footer. No props.

```vue
<template>
  <footer class="text-center py-8 text-sm text-neutral-400">
    <a
      href="https://catalog.mx"
      target="_blank"
      rel="noopener"
      class="hover:text-primary-600 transition-colors"
    >
      Hecho con catalog.mx
    </a>
  </footer>
</template>
```

---

## API Endpoints (Nitro)

### `GET /api/storefront/[slug]`

```typescript
// server/api/storefront/[slug].get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { getFirestore } from 'firebase-admin/firestore'
import { initAdmin } from '../utils/firebase-admin'
import type { Business, Item, Category } from '@sass-factory/core'

export default defineEventHandler(async (event) => {
  initAdmin()
  const slug = getRouterParam(event, 'slug')!
  const db = getFirestore()

  // Businesses are keyed by slug (the document ID is the slug)
  const businessRef = db.collection('businesses').doc(slug)
  const businessSnap = await businessRef.get()

  if (!businessSnap.exists) {
    throw createError({ statusCode: 404, message: 'Business not found' })
  }

  const business = { id: businessSnap.id, ...businessSnap.data() } as Business

  // Only serve public data for active or demo statuses
  const publicStatuses = ['active', 'demo', 'sent', 'accepted']
  if (!publicStatuses.includes(business.status)) {
    throw createError({
      statusCode: business.status === 'suspended' ? 410 : 404,
      message: business.status === 'suspended' ? 'Business suspended' : 'Business not found',
    })
  }

  // Fetch items and categories in parallel
  const [itemsSnap, categoriesSnap] = await Promise.all([
    businessRef.collection('items').where('available', '==', true).orderBy('order').get(),
    businessRef.collection('categories').orderBy('order').get(),
  ])

  const items: Item[] = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Item))
  const categories: Category[] = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))

  // Strip sensitive fields before sending to public
  const { ownerId, generatedBy, prospectId, ...publicBusiness } = business

  return {
    business: publicBusiness,
    items,
    categories,
  }
})
```

### `POST /api/prospects`

```typescript
// server/api/prospects.post.ts
import { defineEventHandler, createError, readValidatedBody, getHeader } from 'h3'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { initAdmin } from './utils/firebase-admin'
import type { Prospect } from '@sass-factory/core'

const ProspectSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^(\+?52)?[1-9]\d{9}$/, 'Teléfono mexicano inválido'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().max(300).optional(),
})

export default defineEventHandler(async (event) => {
  initAdmin()
  const db = getFirestore()

  const body = await readValidatedBody(event, ProspectSchema.parse)

  // Normalize phone to E.164
  let phone = body.phone.replace(/\D/g, '')
  if (phone.length === 10) phone = `+52${phone}`
  else if (phone.startsWith('52') && phone.length === 12) phone = `+${phone}`

  // Validate business exists and is in demo/sent/accepted status
  const businessRef = db.collection('businesses').doc(body.businessId)
  const businessSnap = await businessRef.get()

  if (!businessSnap.exists) {
    throw createError({ statusCode: 404, message: 'Business not found' })
  }

  const business = businessSnap.data()!
  const validStatuses = ['demo', 'sent', 'accepted']
  if (!validStatuses.includes(business.status)) {
    throw createError({ statusCode: 422, message: 'Business is not accepting prospects' })
  }

  // Duplicate detection: same phone + same businessId within 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const duplicateSnap = await db
    .collection('prospects')
    .where('businessId', '==', body.businessId)
    .where('phone', '==', phone)
    .where('submittedAt', '>', oneHourAgo.toISOString())
    .limit(1)
    .get()

  if (!duplicateSnap.empty) {
    throw createError({ statusCode: 409, message: 'Duplicate submission within 1 hour' })
  }

  // Create prospect document
  const now = new Date().toISOString()
  const prospect: Omit<Prospect, 'id'> = {
    businessId: body.businessId,
    businessName: business.name,
    name: body.name,
    phone,
    email: body.email || undefined,
    message: body.message || undefined,
    status: 'pending',
    submittedAt: now,
  }

  const docRef = await db.collection('prospects').add(prospect)

  // Update business status to 'accepted' if it was 'demo' or 'sent'
  if (['demo', 'sent'].includes(business.status)) {
    await businessRef.update({
      status: 'accepted',
      acceptedAt: now,
      prospectId: docRef.id,
      updatedAt: now,
    })
  }

  // Notify admin via Firestore (admin panel polls or uses real-time listener)
  await db.collection('notifications').add({
    type: 'prospect_accepted',
    prospectId: docRef.id,
    businessId: body.businessId,
    businessName: business.name,
    prospectName: body.name,
    prospectPhone: phone,
    read: false,
    createdAt: now,
  })

  return {
    id: docRef.id,
    message: '¡Gracias! Te contactaremos pronto.',
  }
})
```

---

## WhatsApp URL Format

### Standard order (active business):
```
https://wa.me/{e164phone}?text=Hola%2C%20quiero%20pedir%20{quantity}x%20{productName}%20(%24{price}%20MXN)%20de%20{businessName}
```

### Example:
- Phone: `+5215512345678`
- Product: `Nieve de Vainilla`
- Price: `35.00`
- Quantity: `2`
- Business: `Heladería El Pingüino`

Result:
```
https://wa.me/5215512345678?text=Hola%2C%20quiero%20pedir%202x%20Nieve%20de%20Vainilla%20(%2435.00%20MXN)%20de%20Helader%C3%ADa%20El%20Ping%C3%BCino
```

### TypeScript helper function (in `apps/storefront/app/utils/whatsapp.ts`):
```typescript
export function buildWhatsAppUrl(params: {
  phone: string
  productName: string
  price: number
  quantity: number
  businessName: string
}): string {
  const cleanPhone = params.phone.replace(/\D/g, '')
  const text = `Hola, quiero pedir ${params.quantity}x ${params.productName} ($${params.price.toFixed(2)} MXN) de ${params.businessName}`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
}
```

---

## Performance Requirements and Implementation

### Core Web Vitals targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s (4G mobile) | SSG/ISR pre-renders HTML; hero image has `fetchpriority="high"` and `loading="eager"`; all other images use `loading="lazy"` |
| CLS | < 0.1 | All image containers have explicit aspect-ratio; fonts use `font-display: optional`; category pills have fixed height |
| INP | < 200ms | No blocking JS on interaction; product modal opens immediately (no network request for data); WhatsApp link is a plain `<a>` tag |

### Implementation details

**Logo image loading:**
```html
<img
  :src="logoUrl"
  :alt="name"
  width="80"
  height="80"
  fetchpriority="high"
  loading="eager"
  decoding="async"
/>
```

**Product images (below fold):**
```html
<img
  :src="item.imageUrl"
  :alt="item.name"
  loading="lazy"
  decoding="async"
  class="w-full aspect-square object-cover"
/>
```

**Font loading in `<head>`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  as="style"
  :href="`https://fonts.googleapis.com/css2?family=${encodeURIComponent(business.theme.font)}&display=optional`"
/>
```

**Prevent layout shift on category pills:**
```css
.category-strip {
  height: 44px;   /* Fixed height prevents shift when pills load */
  overflow-x: auto;
  scrollbar-width: none;
}
```

### Core Web Vitals monitoring

Add in `nuxt.config.ts`:
```typescript
app: {
  head: {
    script: [
      {
        // Web Vitals reporting to Cloud Logging via navigator.sendBeacon
        innerHTML: `
          import('https://unpkg.com/web-vitals/dist/web-vitals.js').then(({getCLS,getLCP,getINP}) => {
            const report = (metric) => {
              const body = JSON.stringify({
                metric: metric.name,
                value: metric.value,
                slug: location.pathname.replace('/', ''),
                ts: Date.now()
              });
              navigator.sendBeacon('/api/vitals', body);
            };
            getCLS(report); getLCP(report); getINP(report);
          });
        `,
        type: 'module',
      },
    ],
  },
},
```

---

## Playwright E2E Tests

File: `apps/storefront/e2e/catalog.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

// Assumes Firebase emulator is running and seeded with test data:
// - Business: slug="test-helados", status="active", name="Test Helados"
// - Business: slug="test-demo", status="demo", name="Test Demo"
// - Business: slug="test-suspended", status="suspended"
// - Item: "Nieve de Vainilla", price=35, available=true, businessId=test-helados

test.describe('Customer browses active catalog', () => {
  test('valid active slug loads catalog with business name', async ({ page }) => {
    await page.goto('/test-helados')
    await expect(page.getByRole('heading', { name: 'Test Helados' })).toBeVisible()
    await expect(page).toHaveTitle(/Test Helados/)
  })

  test('page has no demo banner on active slug', async ({ page }) => {
    await page.goto('/test-helados')
    await expect(page.locator('[data-testid="demo-banner"]')).not.toBeVisible()
  })

  test('product grid renders at least one product', async ({ page }) => {
    await page.goto('/test-helados')
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  })

  test('category filter shows Todos and categories', async ({ page }) => {
    await page.goto('/test-helados')
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible()
  })

  test('clicking a category filters the product grid', async ({ page }) => {
    await page.goto('/test-helados')
    const categoryButton = page.locator('[data-testid="category-pill"]').first()
    const categoryName = await categoryButton.textContent()
    await categoryButton.click()
    await expect(categoryButton).toHaveClass(/active/)
  })

  test('invalid slug shows 404 page', async ({ page }) => {
    const response = await page.goto('/slug-that-does-not-exist-xyz123')
    expect(response?.status()).toBe(404)
    await expect(page.getByText(/no encontrado/i)).toBeVisible()
  })

  test('suspended business shows suspended page', async ({ page }) => {
    await page.goto('/test-suspended')
    await expect(page.getByText(/suspendido/i)).toBeVisible()
  })
})

test.describe('Demo slug shows catalog with banner', () => {
  test('demo slug loads catalog', async ({ page }) => {
    await page.goto('/demo/test-demo')
    await expect(page.getByRole('heading', { name: 'Test Demo' })).toBeVisible()
  })

  test('demo banner is visible on demo slug', async ({ page }) => {
    await page.goto('/demo/test-demo')
    await expect(page.locator('[data-testid="demo-banner"]')).toBeVisible()
  })

  test('demo banner contains CTA button', async ({ page }) => {
    await page.goto('/demo/test-demo')
    await expect(page.getByRole('button', { name: /Lo quiero/i })).toBeVisible()
  })

  test('demo pages have noindex meta', async ({ page }) => {
    await page.goto('/demo/test-demo')
    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(robots).toContain('noindex')
  })
})

test.describe('Product interaction', () => {
  test('tapping product card opens product modal', async ({ page }) => {
    await page.goto('/test-helados')
    await page.locator('[data-testid="product-card"]').first().click()
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible()
  })

  test('product modal shows product name and price', async ({ page }) => {
    await page.goto('/test-helados')
    await page.locator('[data-testid="product-card"]').first().click()
    await expect(page.locator('[data-testid="product-modal-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-modal-price"]')).toBeVisible()
  })

  test('WhatsApp button contains correct wa.me URL', async ({ page }) => {
    await page.goto('/test-helados')
    await page.locator('[data-testid="product-card"]').first().click()
    const waLink = page.locator('[data-testid="whatsapp-cta"]')
    const href = await waLink.getAttribute('href')
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
    expect(href).toContain('quiero%20pedir')
  })

  test('quantity selector changes WhatsApp message', async ({ page }) => {
    await page.goto('/test-helados')
    await page.locator('[data-testid="product-card"]').first().click()

    const waLink = page.locator('[data-testid="whatsapp-cta"]')
    const hrefBefore = await waLink.getAttribute('href')

    await page.locator('[data-testid="qty-increment"]').click()
    const hrefAfter = await waLink.getAttribute('href')

    expect(hrefAfter).not.toBe(hrefBefore)
    expect(hrefAfter).toContain('2x')
  })

  test('product modal closes when overlay is clicked', async ({ page }) => {
    await page.goto('/test-helados')
    await page.locator('[data-testid="product-card"]').first().click()
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible()
    await page.locator('[data-testid="modal-overlay"]').click()
    await expect(page.locator('[data-testid="product-modal"]')).not.toBeVisible()
  })
})

test.describe('Demo prospect capture', () => {
  test('CTA button opens prospect modal', async ({ page }) => {
    await page.goto('/demo/test-demo')
    await page.getByRole('button', { name: /Lo quiero/i }).click()
    await expect(page.locator('[data-testid="prospect-modal"]')).toBeVisible()
  })

  test('prospect submits form with valid data and sees success message', async ({ page }) => {
    await page.goto('/demo/test-demo')
    await page.getByRole('button', { name: /Lo quiero/i }).click()

    await page.fill('[data-testid="prospect-name"]', 'María González')
    await page.fill('[data-testid="prospect-phone"]', '5512345678')
    await page.fill('[data-testid="prospect-email"]', 'maria@example.com')

    await page.getByRole('button', { name: /Enviar/i }).click()

    await expect(page.getByText(/Gracias/i)).toBeVisible()
  })

  test('invalid phone shows validation error', async ({ page }) => {
    await page.goto('/demo/test-demo')
    await page.getByRole('button', { name: /Lo quiero/i }).click()

    await page.fill('[data-testid="prospect-name"]', 'Juan')
    await page.fill('[data-testid="prospect-phone"]', '1234')  // too short

    await page.getByRole('button', { name: /Enviar/i }).click()

    await expect(page.getByText(/inválido/i)).toBeVisible()
    // Modal should still be open
    await expect(page.locator('[data-testid="prospect-modal"]')).toBeVisible()
  })

  test('duplicate submission within 1 hour shows duplicate message', async ({ page, request }) => {
    // Pre-seed a prospect via API for the same phone
    await request.post('/api/prospects', {
      data: {
        businessId: 'test-demo',
        name: 'Pedro',
        phone: '5598765432',
      },
    })

    await page.goto('/demo/test-demo')
    await page.getByRole('button', { name: /Lo quiero/i }).click()

    await page.fill('[data-testid="prospect-name"]', 'Pedro Again')
    await page.fill('[data-testid="prospect-phone"]', '5598765432')

    await page.getByRole('button', { name: /Enviar/i }).click()

    await expect(page.getByText(/Ya recibimos/i)).toBeVisible()
  })
})

test.describe('Core Web Vitals', () => {
  test('LCP is below 2500ms on simulated 4G', async ({ page }) => {
    await page.emulateMedia({ media: 'screen' })
    // Simulate 4G: ~10 Mbps down, 100ms latency
    const cdpSession = await page.context().newCDPSession(page)
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (10 * 1024 * 1024) / 8,
      uploadThroughput: (2 * 1024 * 1024) / 8,
      latency: 100,
    })

    const lcpValues: number[] = []
    await page.addInitScript(() => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          (window as any).__lcpValues = (window as any).__lcpValues || []
          ;(window as any).__lcpValues.push(entry.startTime)
        })
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })

    await page.goto('/test-helados')
    await page.waitForLoadState('networkidle')

    const lcp: number = await page.evaluate(() => {
      const values = (window as any).__lcpValues || []
      return values.length ? values[values.length - 1] : 9999
    })

    expect(lcp).toBeLessThan(2500)
  })
})
```

---

## Playwright Configuration

File: `apps/storefront/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.STOREFRONT_URL ?? 'http://localhost:3010',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'Mobile Chrome',  use: { ...devices['Pixel 7'] } },
    { name: 'Mobile Safari',  use: { ...devices['iPhone 14'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    env: {
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    },
  },
})
```

---

## Gherkin Specifications

```gherkin
Feature: Customer browses active business catalog
  As a customer who received a catalog link
  I want to browse the business catalog on my phone
  So that I can find a product and order it via WhatsApp

  Background:
    Given a business with slug "test-helados" exists in Firestore with status "active"
    And it has 3 categories and 12 products (all available=true)

  Scenario: Valid active slug loads catalog page
    Given a customer navigates to /test-helados
    When the page loads
    Then the business name is visible in the header
    And the product grid shows products in 2 columns on mobile
    And the category filter shows "Todos" and the 3 category names
    And there is no demo banner visible
    And the page title is "{businessName} — Catálogo"

  Scenario: Invalid slug shows 404
    Given a customer navigates to /slug-that-does-not-exist-xyz123
    When the page loads
    Then the HTTP response status is 404
    And the page shows a styled "no encontrado" message
    And there is no server error in the console

  Scenario: Suspended business shows suspended page
    Given a business with slug "test-suspended" has status "suspended"
    When a customer navigates to /test-suspended
    Then the page shows a suspension notice
    And the HTTP response status is 410 or redirects to /suspended
    And no products are visible

  Scenario: Demo slug shows catalog with banner and noindex
    Given a business with slug "test-demo" has status "demo"
    When a customer navigates to /demo/test-demo
    Then the business catalog is visible
    And a sticky demo banner is visible at the top with "¿Quieres esto?"
    And the page meta robots tag is "noindex, nofollow"
    And the HTTP response is not cached

Feature: Product interaction and WhatsApp ordering
  As a customer browsing the catalog
  I want to tap a product and send a WhatsApp order
  So that I can buy the product without leaving my phone

  Scenario: Customer taps product card and modal opens
    Given the customer is on the /test-helados catalog page
    When the customer taps on a product card
    Then the product modal opens
    And the modal shows the product name, description, and price
    And the modal shows a quantity selector starting at 1

  Scenario: WhatsApp CTA button opens correct URL with product info
    Given the product modal is open for "Nieve de Vainilla" at price $35.00
    And the business phone is "+5215512345678"
    When the customer taps the WhatsApp CTA
    Then the href is "https://wa.me/5215512345678?text=Hola%2C%20quiero%20pedir%201x%20Nieve%20de%20Vainilla%20(%2435.00%20MXN)..."
    And the link opens in a new tab with rel="noopener"

  Scenario: Quantity selector changes WhatsApp message
    Given the product modal is open for "Nieve de Vainilla"
    And the quantity is 1
    When the customer taps the "+" button
    Then the quantity becomes 2
    And the WhatsApp URL text contains "2x Nieve de Vainilla"
    And the price in the URL is "$70.00 MXN" (2 × $35.00)

  Scenario: Quantity cannot go below 1
    Given the product modal is open with quantity = 1
    When the customer taps the "−" button
    Then the quantity remains 1
    And no error is shown

Feature: Demo prospect capture
  As a prospective business owner viewing the demo
  I want to fill out a contact form
  So that the admin knows I'm interested

  Background:
    Given a business with slug "test-demo" has status "demo"
    And the customer is on /demo/test-demo

  Scenario: Prospect submits form with valid data
    Given the customer clicks "¡Lo quiero!"
    And the ProspectModal opens
    When the customer fills in name="María González", phone="5512345678"
    And taps "Enviar"
    Then a POST request is made to /api/prospects
    And the response is 200
    And the business status changes to "accepted" in Firestore
    And a notification document is created in Firestore
    And the modal shows "¡Gracias! Te contactaremos pronto."
    And the modal closes after 2 seconds

  Scenario: Prospect submits form with invalid phone
    Given the customer clicks "¡Lo quiero!"
    And the ProspectModal opens
    When the customer fills in name="Juan", phone="1234"
    And taps "Enviar"
    Then no POST request is made to /api/prospects
    And a validation error appears below the phone field: "Teléfono mexicano inválido"
    And the modal remains open

  Scenario: Duplicate submission within 1 hour is rejected
    Given the same phone "5598765432" submitted a prospect for this business 30 minutes ago
    When the customer fills in phone="5598765432" and taps "Enviar"
    Then the POST to /api/prospects returns 409
    And the modal shows "Ya recibimos tu mensaje. Te contactaremos pronto."
    And no duplicate Prospect document is created in Firestore

  Scenario: Empty required field shows error
    Given the customer clicks "¡Lo quiero!"
    When the customer submits the form with empty "name" field
    Then a validation error appears: "Nombre requerido"
    And no POST request is sent
```

---

## MR Template

**Title:** `feat(sprint-3): public storefront — SSG/ISR catalog pages, WhatsApp CTA, prospect capture`

**Description:**

```
## What this MR does

Sprint 3 deliverable: apps/storefront — a new standalone Nuxt 4 app for the public business catalog.

### New app: apps/storefront
- pages/[slug].vue: active business catalog (SSG with ISR revalidate 60s via routeRules)
- pages/demo/[slug].vue: demo view with sticky "¿Quieres esto?" banner (SSR, noindex)
- pages/404.vue and pages/suspended.vue: styled error pages

### Components (all Tier 3 — not published)
- StorefrontHeader: logo, name, tagline, floating WhatsApp contact button
- CategoryFilter: horizontally scrollable pill buttons, "Todos" default
- ProductGrid: 2-col mobile / 3-col tablet / 4-col desktop responsive grid
- ProductCard: lazy image with aspect-ratio, PriceDisplay, "Pedir" button
- ProductModal: full product details, quantity selector, WhatsApp URL built from wa.me format
- DemoBanner: sticky top, "¿Quieres esto?" CTA
- ProspectModal: contact form with Zod validation, duplicate detection, success state
- ViralFooter: "Hecho con catalog.mx" link

### API
- GET /api/storefront/[slug]: public Firestore read, strips sensitive fields (ownerId, generatedBy)
  - Returns 410 for suspended, 404 for draft/expired
- POST /api/prospects: Zod validated, phone normalization, duplicate detection (1h window)
  - Sets business status to 'accepted' when prospect submits
  - Creates notification document in Firestore

### Performance
- Hero logo: fetchpriority=high, loading=eager
- Product images: loading=lazy, explicit aspect-ratio to prevent CLS
- Google Fonts: preconnect + preload with display=optional
- Web Vitals beacon to /api/vitals

### Tests
- Playwright E2E: 20 test cases across 4 describe blocks
  - Active catalog browsing
  - Demo slug behavior
  - Product modal + WhatsApp URL
  - Prospect capture (valid, invalid phone, duplicate)
- Unit tests for buildWhatsAppUrl() helper

## Pre-merge checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Playwright tests pass: `pnpm --filter storefront e2e`
- [ ] LCP < 2500ms measured by Playwright on simulated 4G
- [ ] /test-helados page loads without JS errors in browser console
- [ ] /demo/test-demo has noindex meta tag
- [ ] /slug-xyz123 returns 404
- [ ] POST /api/prospects with invalid phone returns 400 with field error
- [ ] POST /api/prospects duplicate within 1h returns 409
- [ ] Product modal WhatsApp URL contains correct phone, product name, and quantity
- [ ] Quantity increment changes WhatsApp URL
- [ ] Firebase emulator seeded with test data for E2E runs
- [ ] apps/storefront added to pnpm-workspace.yaml
```

---

## Definition of Done

- [ ] `pnpm typecheck` exits 0 including apps/storefront
- [ ] `pnpm lint` exits 0
- [ ] All 20+ Playwright E2E tests pass on Mobile Chrome
- [ ] LCP measurement < 2500ms on simulated 4G (logged in CI output)
- [ ] `/api/storefront/{slug}` never returns ownerId or generatedBy fields
- [ ] `/api/prospects` rejects SVG upload attempts (not applicable), duplicate phone within 1h, and invalid phone format
- [ ] Demo pages have `robots: noindex, nofollow` meta tag
- [ ] WhatsApp URL encodes product name and price correctly (verified in Playwright)
- [ ] Quantity selector min=1 enforced in UI
- [ ] Business status transitions to 'accepted' in Firestore when prospect submits
- [ ] Notification document created in Firestore on prospect submission
- [ ] apps/storefront `pnpm dev` starts on port 3010 without errors
- [ ] MR opened to `develop`, Erick reviewed and approved, merged
