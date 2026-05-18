# Master Plan — Catálogo SaaS para Negocios
> Versión 2.0 — Plan Híbrido Definitivo — 2026-05-16

---

## 1. DIAGNÓSTICO HONESTO

### ¿Qué hay hoy que vale?

| Pieza existente | Valor real | Decisión |
|-----------------|-----------|----------|
| `generate.post.ts` — Claude + SSE streaming | ✅ Alto — es el motor de demos | **CONSERVAR, repropósito** |
| `local-simulator.ts` — Docker runner con health check | ✅ Alto — dev workflow real | **CONSERVAR** |
| `job-store.ts` — patrón de jobs con pasos | ✅ Medio — estructura sólida | **CONSERVAR, mover a Firestore** |
| `@sass-factory/core` — barrel de tipos | ✅ Estructura útil | **CONSERVAR, reescribir tipos** |
| `@sass-factory/ui` — componentes Vue | ✅ Medio | **CONSERVAR, adaptar** |
| SSE streaming pattern | ✅ Alto | **CONSERVAR** |
| Nitro/H3 + Nuxt 4 + UnoCSS | ✅ Stack correcto | **CONSERVAR** |
| Firebase Auth + Firestore SDK | ✅ Configurado | **CONSERVAR** |
| `TOPIC_PRESETS` (love/bday/xmas) | ❌ Dominio equivocado | **ELIMINAR** |
| `provisioning.ts` con sleeps falsos | ❌ Teatro | **ELIMINAR, reescribir** |
| `apps/admin/server/api/infra/` | ❌ Stubs inútiles | **ELIMINAR** |
| `AppConfig.features` (hero/timeline/moments) | ❌ Dominio de eventos | **ELIMINAR** |
| `docs/architecture/backend.md` (Python FastAPI) | ❌ Stack equivocado | **ELIMINAR** |
| Todo doc que mencione Next.js / React / Tailwind | ❌ Stack equivocado | **ELIMINAR** |

### Repropósito del generador AI — el giro clave

El generador de Claude **no se elimina**. Se repropone para el flujo de ventas:

> "Antes el AI generaba landing pages de eventos.  
> Ahora el AI genera **demos completos de catálogos** para prospectos específicos."

El admin usa el generador para crear "Heladería El Pingüino" con branding, colores, productos de muestra y lo comparte. Cuando el prospecto dice que sí → se activa. Es el mismo motor, diferente dominio.

---

## 2. MODELO DE NEGOCIO Y FLUJO DE VENTAS

### El insight central: venta proactiva con demos pre-generados

```
ADMIN                    PROSPECTO              SISTEMA
  │                          │                     │
  ├─ Genera demo con AI ────►│                     │
  │  "Heladería El Pingüino" │                     │
  │                          │                     │
  ├─ Comparte URL ──────────►│                     │
  │  catalog.mx/demo/slug    │                     │
  │                          │                     │
  │                    Ve su negocio               │
  │                    en full color               │
  │                          │                     │
  │                    [¿Quieres esto?]             │
  │                          │                     │
  │                    Click en CTA ──────────────►│
  │                          │              ACCEPTED│
  │                          │                     │
  ├◄── Notificación ─────────┼─────────────────────┤
  │    "El Pingüino aceptó"  │                     │
  │                          │                     │
  ├─ Activa negocio ─────────┼────────────────────►│
  │  Envía credenciales      │                     │
  │                          │              ACTIVE  │
  │                   Recibe email                 │
  │                   con login                    │
  │                          │                     │
  │                   [Gestiona catálogo]           │
```

---

## 3. BUSINESS STATUS MACHINE

El estado de un negocio es el eje central del producto. Cada transición tiene una acción.

```
                    ┌─────────┐
                    │  DRAFT  │  ← Admin genera el demo con AI
                    └────┬────┘
                         │  Admin publica demo
                         ▼
                    ┌─────────┐
                    │  DEMO   │  ← URL pública preview/{slug}
                    └────┬────┘     Banner: "¿Quieres esto?"
                         │
              ┌──────────┴──────────┐
              │ Admin marca "Enviado"│
              ▼                      ▼
         ┌────────┐           ┌──────────┐
         │  SENT  │           │ EXPIRED  │  ← 30 días sin respuesta
         └────┬───┘           └──────────┘
              │
    ┌─────────┴─────────┐
    │ Prospecto acepta  │
    ▼                   ▼
┌──────────┐      ┌──────────┐
│ ACCEPTED │      │ REJECTED │ → ARCHIVED
└────┬─────┘      └──────────┘
     │ Admin activa + envía credenciales
     ▼
┌─────────┐
│  ACTIVE │  ← Negocio gestionando su catálogo
└────┬────┘
     │
  ┌──┴──────────────┐
  ▼                 ▼
┌───────────┐  ┌──────────┐
│ SUSPENDED │  │ ARCHIVED │
└───────────┘  └──────────┘
  ↑ pago fallido / violación
```

### Tipo TypeScript (fuente de verdad)

```typescript
// packages/core/src/types/business.ts

export type BusinessStatus =
  | 'draft'      // generado, sin publicar
  | 'demo'       // publicado en preview URL
  | 'sent'       // link enviado al prospecto
  | 'accepted'   // prospecto aceptó
  | 'active'     // dueño gestionando
  | 'suspended'  // desactivado temporalmente
  | 'expired'    // 30 días sin respuesta
  | 'rejected'   // prospecto rechazó
  | 'archived'   // archivado

export type BusinessType =
  | 'heladeria'
  | 'barberia'
  | 'estetica'
  | 'restaurante'
  | 'panaderia'
  | 'gym'
  | 'mecanico'
  | 'otro'

export interface BusinessTheme {
  primary: string      // hex
  secondary: string    // hex
  accent: string       // hex
  background: string   // hex
  font: string         // Google Font
  emoji: string
  gradient: [string, string]
}

export interface Business {
  id: string
  slug: string
  name: string
  type: BusinessType
  whatsapp: string       // formato E.164: +521234567890
  city: string
  logo?: string          // Cloud Storage URL
  tagline?: string
  theme: BusinessTheme
  status: BusinessStatus
  plan: 'free' | 'pro' | 'growth'
  ownerId?: string       // null hasta que se active
  domain?: string        // custom domain (plan Growth)
  demoGeneratedAt?: string
  sentAt?: string
  acceptedAt?: string
  activatedAt?: string
  createdAt: string      // ISO 8601
  updatedAt: string
}

export interface Item {
  id: string
  businessId: string
  name: string
  price: number
  currency: 'MXN'
  description?: string
  image?: string         // Cloud Storage URL
  category?: string      // categoryId
  visible: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  order: number
}

export interface Click {
  id: string
  businessId: string
  itemId: string
  source: 'storefront' | 'shared_link' | 'whatsapp'
  referrer?: string
  createdAt: string
}

export interface Prospect {
  id: string
  businessId: string
  contactName?: string
  phone?: string
  email?: string
  notes?: string
  status: 'contacted' | 'interested' | 'accepted' | 'rejected'
  createdAt: string
}
```

---

## 4. WIREFRAMES ASCII — Todas las pantallas

### 4.1 Admin — Gestión de demos (flujo de ventas)

```
PANEL DE DEMOS (admin)
┌─────────────────────────────────────────────────────┐
│  SaaS Factory Admin           [+ Nuevo demo]        │
├──────────┬──────────────────────────────────────────┤
│ Demos    │  Mis demos                               │
│ Negocios │                                          │
│ Analytics│  [Todos ▾] [Draft] [Enviados] [Activos]  │
│ Config   │                                          │
│          │  Negocio          Tipo      Estado  Acc. │
│          │  ─────────────────────────────────────── │
│          │  Heladería Pingüino Heladería DEMO   [▾] │
│          │    → catalog.mx/demo/hel-pinguino         │
│          │    → Creado hace 2 días                   │
│          │  ─────────────────────────────────────── │
│          │  Barber King       Barbería SENT    [▾]  │
│          │    → Enviado a Juan hace 1 día            │
│          │  ─────────────────────────────────────── │
│          │  Studio Glow       Estética ACTIVE  [▾]  │
│          │    → 45 productos · 1,234 visitas         │
└──────────┴──────────────────────────────────────────┘

[▾] dropdown por demo:
  DEMO:   [Ver demo] [Editar] [Marcar enviado] [Archivar]
  SENT:   [Ver demo] [Marcar aceptado] [Marcar rechazado]
  ACCEPTED: [Activar negocio]
  ACTIVE: [Ver catálogo] [Suspender]
```

### 4.2 Admin — Generar nuevo demo con AI

```
NUEVO DEMO
┌─────────────────────────────────────────────────────┐
│  ← Volver    Generar demo con AI                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Describe el negocio:                               │
│  ┌─────────────────────────────────────────────┐    │
│  │ Heladería en Monterrey llamada El Pingüino,  │    │
│  │ venden helados artesanales y sundaes,        │    │
│  │ ambiente familiar, colores frescos           │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│           [✨ Generar Demo]                         │
│                                                     │
│  ── Generando ────────────────────────────────────  │
│  ✅ Analizando descripción...                       │
│  ✅ Definiendo paleta de colores...                 │
│  ⏳ Generando productos de muestra...              │
│  ○  Creando estructura del catálogo...              │
│                                                     │
│  Vista previa:                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🍦 Heladería El Pingüino                    │   │
│  │ Color: #06B6D4  Font: Quicksand             │   │
│  │ Productos: Sundae, Nieve, Malteada (3 items)│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Ver demo completo →]   [Guardar como draft]       │
└─────────────────────────────────────────────────────┘
```

### 4.3 Storefront demo (lo que ve el prospecto)

```
catalog.mx/demo/heladeria-pinguino
┌─────────────────────────────────────────────────────┐
│ ⚠️  Este es un demo — ¿Quieres este catálogo para   │ ← banner sticky
│      tu negocio? [Sí, lo quiero →]                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [LOGO]  Heladería El Pingüino  🍦                  │
│         Monterrey, NL                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│   La mejor heladería artesanal de Monterrey         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Todos] [Helados] [Sundaes] [Bebidas]              │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  🖼️     │  │  🖼️     │  │  🖼️     │          │
│  │ Sundae   │  │ Nieve    │  │ Malteada │          │
│  │ $85      │  │ $40      │  │ $65      │          │
│  │ [Pedir]  │  │ [Pedir]  │  │ [Pedir]  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│ (Estos son productos de ejemplo — serán los tuyos)  │
├─────────────────────────────────────────────────────┤
│  🚀 Hecho con catalog.mx — Empieza gratis           │
└─────────────────────────────────────────────────────┘

[Sí, lo quiero →] → modal:
┌──────────────────────────────────────┐
│  ¡Perfecto! Cuéntanos sobre ti       │
│                                      │
│  Tu nombre:   [________________]     │
│  WhatsApp:    [________________]     │
│  Email:       [________________]     │
│                                      │
│  [  Quiero mi catálogo real  ]       │
│                                      │
│  Te contactaremos en menos de 24h   │
└──────────────────────────────────────┘
```

### 4.4 Storefront activo (catálogo real)

```
catalog.mx/heladeria-pinguino  (o hel-pinguino.catalog.mx en plan Pro)
┌─────────────────────────────────────────────────────┐
│ [LOGO]  Heladería El Pingüino  ☎️ WhatsApp          │
├─────────────────────────────────────────────────────┤
│   La mejor heladería artesanal de Monterrey 🍦      │
│   Lun-Dom  12:00 - 22:00   📍 Col. del Valle        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Todos] [Helados] [Sundaes] [Bebidas]              │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  📸     │  │  📸     │  │  📸     │           │
│  │ Sundae   │  │ Nieve    │  │ Malteada │          │
│  │ $85      │  │ $40      │  │ $65      │          │
│  │ [Pedir]  │  │ [Pedir]  │  │ [Pedir]  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🚀 Hecho con catalog.mx  ·  Gratis para tu negocio │
└─────────────────────────────────────────────────────┘

Modal al hacer [Pedir]:
┌───────────────────────────────────┐
│  Sundae de chocolate              │
│  📸  [foto grande]               │
│                                   │
│  Con 3 bolas de helado artesanal, │
│  crema batida y cereza.           │
│                                   │
│  $85                              │
│                                   │
│  Cantidad:  [ - ]  1  [ + ]       │
│                                   │
│  [  📱  Pedir por WhatsApp  ]     │
│   abre wa.me/52...?text=Hola...  │
│                                   │
│          [Cerrar]                 │
└───────────────────────────────────┘
```

### 4.5 Dashboard del dueño del negocio

```
dashboard.catalog.mx  (login con email+password)
┌─────────────────────────────────────────────────────┐
│ [≡] Mi Dashboard     Plan: Gratis  [Avatar ▾]       │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ ▶ Inicio │   Mayo 2026                              │
│   Catálogo│  ┌────────┐ ┌────────┐ ┌────────┐      │
│   Apariencia│ │ 1,234  │ │  89    │ │  0     │     │
│   Analytics│  │Visitas │ │Clicks  │ │Ventas  │     │
│   Plan    │  │ +12% ↑ │ │ +5%  ↑ │ │(manual)│     │
│   Config  │  └────────┘ └────────┘ └────────┘      │
│           │                                         │
│           │  Tu catálogo:                           │
│           │  catalog.mx/heladeria-pinguino          │
│           │  [Copiar] [Ver] [Compartir en WhatsApp]  │
│           │                                         │
│           │  Mis productos                          │
│           │  ┌──────────────────────────────────┐   │
│           │  │ ● Sundae chocolate     $85  [···] │   │
│           │  │ ● Nieve vainilla       $40  [···] │   │
│           │  │ ● Malteada fresa       $65  [···] │   │
│           │  │ ○ Paleta (oculto)      $30  [···] │   │
│           │  └──────────────────────────────────┘   │
│           │  [+ Agregar producto]                   │
│           │                                         │
│           │  ⬆️ Upgrade a Pro — Más productos,      │
│           │     subdominio propio · $199/mes        │
└──────────┴──────────────────────────────────────────┘
```

### 4.6 Super Admin

```
ops.catalog.mx
┌─────────────────────────────────────────────────────┐
│  Super Admin                         [Avatar ▾]     │
├──────────┬──────────────────────────────────────────┤
│ Demos    │                                          │
│ Negocios │  Hoy: 16 mayo 2026                       │
│ Analytics│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐  │
│ Billing  │  │ 2,341│ │  12  │ │ 45   │ │ $8,900 │  │
│ Config   │  │Total │ │Nuevos│ │Demos │ │  MRR   │  │
│          │  └──────┘ └──────┘ └──────┘ └────────┘  │
│          │                                          │
│          │  Conversión demos → activos: 34%         │
│          │  ▓▓▓▓▓▓▓░░░░░░░░░░░░ 34%                │
│          │                                          │
│          │  Pipeline de demos                       │
│          │  [Todos ▾] [Draft:5] [Demo:12] [Sent:8] │
│          │                                          │
│          │  Negocio        Tipo    Estado  Días     │
│          │  ──────────────────────────────────────  │
│          │  El Pingüino  Heladería SENT    2d [▾]  │
│          │  Barber King  Barbería  DEMO    1d [▾]  │
│          │  Studio Glow  Estética  ACTIVE  15d[▾]  │
└──────────┴──────────────────────────────────────────┘
```

---

## 5. ARQUITECTURA MICROFRONTEND

### Estructura con Module Federation (Vite)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CDN / Cloud Load Balancer                     │
└────┬──────────────────┬────────────────────┬───────────────────-┘
     │                  │                    │
     ▼                  ▼                    ▼
┌──────────┐    ┌───────────────┐    ┌──────────────┐
│STOREFRONT│    │  ADMIN SHELL  │    │  SUPER ADMIN │
│ apps/    │    │  apps/admin   │    │  apps/ops    │
│ storefront│   │  (HOST MFE)   │    │  (CSR)       │
│ Nuxt SSG │    │  Nuxt CSR     │    │  Nuxt CSR    │
│ +ISR     │    │               │    │              │
│Cloud Run │    │ Auth + Router │    │ Auth(admin)  │
│(public)  │    │ Carga remotes │    │ Own deploy   │
└──────────┘    └──────┬────────┘    └──────────────┘
                        │
         ┌──────────────┼──────────────────┐
         │              │                  │
         ▼              ▼                  ▼
  ┌─────────────┐ ┌───────────┐  ┌──────────────────┐
  │  demo-mf    │ │catalog-mf │  │  appearance-mf   │
  │ apps/mfe/   │ │ apps/mfe/ │  │  apps/mfe/       │
  │ demo        │ │ catalog   │  │  appearance      │
  │─────────────│ │───────────│  │──────────────────│
  │ AI generate │ │ CRUD items│  │ Theme editor     │
  │ Demo mgmt   │ │ Categories│  │ Logo upload      │
  │ Sales flow  │ │ Visibility│  │ Preview live     │
  │ Prospect CRM│ │           │  │                  │
  └─────────────┘ └───────────┘  └──────────────────┘
         ▲              ▲                  ▲
         └──────────────┴──────────────────┘
                        │
              Shared via Module Federation:
              @sass-factory/core (tipos)
              @sass-factory/ui   (componentes)
              @sass-factory/auth (composables de auth)
```

### Despliegue independiente por MFE

```
Cada remote tiene su propio:
  - Cloud Run service
  - Pipeline CI/CD
  - Build independiente
  - URL pública (usada por el shell para cargarlo)

Shell carga remotes en runtime:
  const DemoManager = defineAsyncComponent(() =>
    import('demo_mf/DemoManager')   ← Module Federation
  )
```

### Configuración Module Federation (ejemplo)

```
// apps/admin (HOST) — vite.config.ts
federation({
  name: 'admin_shell',
  remotes: {
    demo_mf:       'http://demo-mf.internal/assets/remoteEntry.js',
    catalog_mf:    'http://catalog-mf.internal/assets/remoteEntry.js',
    appearance_mf: 'http://appearance-mf.internal/assets/remoteEntry.js',
  },
  shared: ['vue', '@sass-factory/core', '@sass-factory/ui'],
})

// apps/mfe/demo (REMOTE) — vite.config.ts
federation({
  name: 'demo_mf',
  filename: 'remoteEntry.js',
  exposes: {
    './DemoManager': './src/components/DemoManager.vue',
    './GenerateForm': './src/components/GenerateForm.vue',
  },
  shared: ['vue', '@sass-factory/core', '@sass-factory/ui'],
})
```

---

## 6. GITFLOW

### Estructura de ramas

```
production ─────────────────────────────────────────────────────►
                │                    ▲
                │ merge              │ merge + tag
                │                   │
release/v1.0 ──┴────────────────────┘
                │                    ▲
                │ branched from      │ merge + smoke tests
                │ develop            │
develop ────────┴────────────────────┴──────────────────────────►
       ▲   ▲   ▲   ▲   ▲   ▲   ▲   ▲
       │   │   │   │   │   │   │   │
    feat feat feat bug  feat feat hot  feat
    /mfe /auth /items /fix /analytics  ...


Regla de nombre:
  feature/{ticket}-descripcion-corta
  bugfix/{ticket}-descripcion-corta
  hotfix/{ticket}-descripcion-corta   ← solo van a production directa
  release/v{major}.{minor}.{patch}
```

### Mapa Rama → Ambiente

```
┌──────────────────────┬─────────┬──────────────────────────────┐
│ Rama                 │ Ambiente│ Trigger                       │
├──────────────────────┼─────────┼──────────────────────────────┤
│ feature/* → develop  │  dev    │ Auto en merge a develop       │
│ bugfix/*  → develop  │  dev    │ Auto en merge a develop       │
│ develop              │  dev    │ Push a develop                │
│ release/*            │  stg    │ Push a release/* (auto)       │
│ production           │  prod   │ Merge a production (manual)   │
│ hotfix/* → production│  prod   │ Manual + notificación         │
└──────────────────────┴─────────┴──────────────────────────────┘
```

### CI/CD Pipeline por rama

```
develop push:
  ├── pnpm typecheck
  ├── pnpm lint
  ├── pnpm test:unit
  ├── pnpm test:integration (Firebase Emulator)
  └── deploy → dev (Cloud Run cada servicio)

release/* push:
  ├── Todo lo anterior
  ├── pnpm test:e2e (Playwright contra stg)
  ├── Smoke tests automáticos
  └── deploy → stg

production merge (manual gate):
  ├── Aprobación de 1 revisor
  ├── pnpm test:e2e contra stg (re-run)
  ├── deploy → prod (canary 10% → 100%)
  └── tag v{version}

hotfix → production:
  ├── Fast-track: solo typecheck + unit tests
  ├── Deploy inmediato a prod
  └── Cherry-pick a develop
```

---

## 7. OBSERVABILIDAD

### Tres capas

```
┌─────────────────────────────────────────────────────┐
│  MÉTRICAS DE NEGOCIO (custom)                       │
│  demos_created, demos_sent, acceptance_rate,        │
│  active_businesses, mrr, conversion_funnel          │
├─────────────────────────────────────────────────────┤
│  MÉTRICAS DE SISTEMA                                │
│  request_latency p50/p95/p99, error_rate,           │
│  cold_start_count, ai_generation_duration,          │
│  firestore_read_count, storage_bytes                │
├─────────────────────────────────────────────────────┤
│  LOGS ESTRUCTURADOS (JSON)                          │
│  severity, trace_id, business_id, user_id,          │
│  duration_ms, error_code                            │
└─────────────────────────────────────────────────────┘
```

### Logging estructurado (implementación)

```typescript
// packages/core/src/utils/logger.ts
interface LogEntry {
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  message: string
  traceId?: string
  businessId?: string
  userId?: string
  durationMs?: number
  errorCode?: string
  [key: string]: unknown
}

export const logger = {
  info: (msg: string, meta?: Partial<LogEntry>) =>
    console.log(JSON.stringify({ severity: 'INFO', message: msg, ...meta })),
  error: (msg: string, err: Error, meta?: Partial<LogEntry>) =>
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: msg,
      error: err.message,
      stack: err.stack,
      ...meta,
    })),
}

// Uso:
logger.info('Demo generated', { businessId: b.id, durationMs: 1234 })
```

### SLOs (Service Level Objectives)

| Servicio | Métrica | Target |
|---------|---------|--------|
| Storefront | LCP | < 2.5s (p75) |
| Storefront | Disponibilidad | 99.9% |
| Admin API | Latencia p99 | < 500ms |
| AI Generate | Tiempo total | < 15s |
| AI Generate | Error rate | < 1% |

### Alertas

```
Error rate > 1% por 5 min      → PagerDuty (crítico)
Latencia p99 > 2s por 5 min    → Slack #alerts (warning)
Costo diario > $5              → Email (info)
Costo mensual > $40            → Email + Slack (warning)
Demo acceptance rate < 10%     → Slack #product (info)
Cold starts > 10/min           → Slack #infra (warning)
```

### Dashboard en Cloud Monitoring

```
┌─────────────────────────────────────────────────────┐
│  Business Funnel                                    │
│  Demos creados: 45  Enviados: 32  Aceptados: 15    │
│  Conversión: 34%  ▓▓▓▓▓▓▓░░░░░░░░░░░              │
├─────────────────────────────────────────────────────┤
│  System Health                                      │
│  Storefront p99: 320ms ✅   Error rate: 0.2% ✅    │
│  AI generate avg: 8.2s ✅   Cold starts/h: 3 ✅    │
├─────────────────────────────────────────────────────┤
│  Cost today: $1.23  This month: $18.40 / $40 limit  │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 46%                         │
└─────────────────────────────────────────────────────┘
```

---

## 8. ARQUITECTURA DE DATOS — FIRESTORE

```
/businesses/{businessId}
  ├── name, slug, type, whatsapp, city
  ├── logo, tagline, theme
  ├── status: BusinessStatus
  ├── plan: 'free' | 'pro' | 'growth'
  ├── ownerId, domain
  ├── demoGeneratedAt, sentAt, acceptedAt, activatedAt
  ├── createdAt, updatedAt
  │
  ├── /items/{itemId}
  │     └── name, price, currency, description, image
  │         category, visible, order
  │
  ├── /categories/{categoryId}
  │     └── name, order
  │
  └── /clicks/{clickId}
        └── itemId, source, referrer, createdAt

/users/{userId}
  └── email, role: 'owner'|'admin'|'superadmin'
      businessId (para owners), createdAt

/prospects/{prospectId}
  └── businessId, contactName, phone, email
      notes, status, createdAt

/system/config
  └── maintenanceMode, featureFlags
```

### Reglas de seguridad

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    // Storefront: solo lectura pública de negocios activos
    match /businesses/{bId} {
      allow read: if resource.data.status == 'active'
                  || isAdmin();
      allow write: if isAdmin()
                   || (isOwner(bId) && onlyAllowedFields());

      // Items: públicos si el negocio está activo
      match /items/{iId} {
        allow read: if get(/databases/$(db)/documents/businesses/$(bId))
                       .data.status == 'active'
                    || isOwner(bId) || isAdmin();
        allow write: if isOwner(bId) || isAdmin();
      }

      // Clicks: write-only desde storefront (anónimo)
      match /clicks/{cId} {
        allow create: if true;  // público, sin auth
        allow read:   if isOwner(bId) || isAdmin();
      }
    }

    function isAdmin() {
      return request.auth.token.role in ['admin', 'superadmin'];
    }
    function isOwner(bId) {
      return request.auth != null
          && request.auth.token.businessId == bId;
    }
    function onlyAllowedFields() {
      // Owners no pueden cambiar su plan ni status
      return !('plan' in request.resource.data.diff(resource.data).affectedKeys())
          && !('status' in request.resource.data.diff(resource.data).affectedKeys());
    }
  }
}
```

---

## 9. PLAN DE SPRINTS

### Sprint 0 — Limpieza + SDD (1 semana)

**Objetivo**: Base honesta. Zero deuda técnica heredada.

**Eliminar:**
- [ ] `docs/architecture/backend.md` — Python FastAPI (stack equivocado)
- [ ] `docs/architecture/microservices.md` — Node.js modular (irrelevante)
- [ ] `docs/architecture/event-driven.md` — Eventarc/Cloud Functions (no aplica)
- [ ] `docs/development/monorepo.md` — menciona Next.js
- [ ] `docs/development/notifications.md` — React/Sonner
- [ ] `docs/development/testing.md` — Vitest/Playwright para Next.js
- [ ] `docs/planning/sprint-backlog.md` — sprints que nunca ocurrieron
- [ ] `packages/core/src/types/app.ts` — tipos de eventos (reescribir)
- [ ] `TOPIC_PRESETS` — dominio equivocado
- [ ] `apps/admin/server/utils/provisioning.ts` — sleeps falsos
- [ ] `apps/admin/server/api/infra/` — stubs engañosos
- [ ] `apps/template/` — evaluar qué sirve para el storefront

**Crear:**
- [ ] `packages/core/src/types/business.ts` — tipos del dominio catálogo
- [ ] `packages/core/src/types/item.ts`
- [ ] `packages/core/src/types/prospect.ts`
- [ ] `docs/planning/master-plan.md` — este documento ✅
- [ ] Actualizar CLAUDE.md con estructura final

---

### Sprint 1 — Fundación técnica (1 semana)

**Objetivo**: Testing, auth, estructura MFE.

- [ ] Instalar Vitest en todos los packages con cobertura
- [ ] Instalar Playwright para E2E
- [ ] Configurar `@module-federation/vite` en admin (host) + primer remote
- [ ] Auth middleware en Nitro: `requireAuth()`, `requireRole()`
- [ ] Rate limiting: 100 req/min/IP general, 5 AI generates/día/user
- [ ] Endpoint `/api/health` con versión, timestamp, dependencias
- [ ] Variables de entorno validadas al startup con Zod
- [ ] Logger estructurado en `@sass-factory/core`
- [ ] GitHub Actions: typecheck → lint → test:unit
- [ ] Firebase Emulator setup para tests de integración

**Tests mínimos a escribir primero (TDD):**
```
packages/core/__tests__/
  business-slug.test.ts    — slug generation, collisions
  status-machine.test.ts   — transiciones válidas e inválidas

apps/admin/server/__tests__/
  auth.middleware.test.ts  — 401 sin token, 403 sin rol
  rate-limit.test.ts       — 429 al exceder límite
```

---

### Sprint 2 — Design System (1 semana)

**Objetivo**: Tokens + componentes base con tests.

- [ ] Design tokens: colores, tipografía, spacing, radios en CSS custom props
- [ ] Componentes: `Button`, `Input`, `Card`, `Badge`, `Modal`, `Toast`, `Skeleton`, `StatusBadge`
- [ ] `StatusBadge` para estados del negocio (draft/demo/sent/accepted/active)
- [ ] Tests unitarios con Vue Test Utils por componente
- [ ] Mobile-first: breakpoints sm/md/lg
- [ ] Accesibilidad: contraste WCAG 2.1 AA, focus visible, aria-labels
- [ ] Fuentes de Google Fonts (subset, self-hosted para performance)

---

### Sprint 3 — Storefront (1.5 semanas)

**Objetivo**: Lo que ven los clientes del negocio. SSG + ISR.

- [ ] `apps/storefront/` — Nuxt app independiente (Cloud Run)
- [ ] Ruta `/{slug}` → carga Business + Items de Firestore
- [ ] Grid de productos con filtro por categoría
- [ ] Modal de producto con foto, precio, descripción
- [ ] Botón WhatsApp con URL estructurada y texto pre-llenado
- [ ] Ruta `/demo/{slug}` — igual pero con banner "¿Lo quieres?" + modal de contacto
- [ ] Modal de contacto → crea `Prospect` en Firestore + notifica admin
- [ ] Footer viral "Hecho con catalog.mx"
- [ ] Meta OG para WhatsApp (imagen + título del negocio)
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1
- [ ] 404 para slugs inválidos o negocios suspendidos

**Tests E2E (Playwright):**
```
storefront.spec.ts:
  ✓ carga catálogo activo por slug
  ✓ filtra por categoría
  ✓ abre modal de producto
  ✓ URL WhatsApp correcta
  ✓ slug inválido → 404
  ✓ demo: banner visible
  ✓ demo: modal de contacto guarda prospect
```

---

### Sprint 4 — Admin Panel + Demo Generator (1.5 semanas)

**Objetivo**: El dashboard del admin de la plataforma (nosotros).

- [ ] `apps/admin` como shell MFE con auth + routing
- [ ] Login con Firebase Auth (email/password)
- [ ] `demo-mf` remote: formulario AI + gestión de demos
  - Repropósito de `generate.post.ts` con nuevo system prompt (catálogos, no eventos)
  - SSE streaming conservado
  - Lista de demos con filtros por status
  - Acciones por status (publicar, marcar enviado, activar)
- [ ] `catalog-mf` remote: (se usa en Dashboard del dueño, Sprint 5)
- [ ] Notificación cuando un prospecto acepta (SSE o polling)
- [ ] Flujo de activación: marcar ACCEPTED → ACTIVE + enviar credenciales

---

### Sprint 5 — Dashboard del dueño (1.5 semanas)

**Objetivo**: Lo que usa el dueño del negocio tras activarse.

- [ ] Auth con Firebase: credenciales generadas al activar
- [ ] Onboarding: 3 pasos (personalizar, agregar producto, compartir)
- [ ] `catalog-mf`: CRUD productos y categorías
  - Agregar producto (nombre, precio, foto, categoría)
  - Ocultar/mostrar producto
  - Ordenar productos con drag
- [ ] `appearance-mf`: Cambiar color, logo, tagline con preview live
- [ ] Página "Mi catálogo" con link + compartir WhatsApp
- [ ] Upload de imágenes a Cloud Storage (max 2MB, MIME validation)
- [ ] Límites por plan aplicados en el servidor (no solo en UI)

---

### Sprint 6 — Analytics + Super Admin (1 semana)

**Objetivo**: Visibilidad de negocio.

- [ ] Registro de clicks desde storefront (sin auth, Firestore write-only)
- [ ] `analytics-mf`: visitas/día, clicks por producto (gráficas simples)
- [ ] Super admin: lista de negocios, filtros, pipeline de demos
- [ ] Métricas globales: total, nuevos, MRR, conversión
- [ ] Moderación: suspender/reactivar negocio
- [ ] Notificación por email al suspender (Firebase Extension o SendGrid)

---

### Sprint 7 — Billing (1 semana)

**Objetivo**: Monetización.

- [ ] Definir feature flags por plan en `@sass-factory/core`
  - Free: 10 productos, path URL, footer visible
  - Pro: 100 productos, subdominio, footer opcional
  - Growth: ilimitado, dominio propio, sin footer
- [ ] Integración MercadoPago (México primero) o Stripe
- [ ] Webhook de pago → actualiza `plan` en Firestore
- [ ] Email de bienvenida al upgrade
- [ ] Upgrade CTA en dashboard del dueño

---

### Sprint 8 — Infra Producción (1 semana)

**Objetivo**: Deploy real con IaC.

- [ ] Terraform: Cloud Run (storefront, admin shell, cada MFE remote), Cloud Storage, Secret Manager
- [ ] Variables de entorno en Secret Manager (0 secrets en código)
- [ ] CI/CD: push develop → build → test → deploy dev
- [ ] CI/CD: release/* → build → test → deploy stg → smoke tests
- [ ] CI/CD: merge production → deploy prod (canary 10% → 100%)
- [ ] Budget alert: $40/mes → email + Slack
- [ ] Custom domains con SSL automático (Cloud Load Balancer + Certificate Manager)
- [ ] GDPR: endpoint DELETE /api/v1/account + retención de clicks 90 días

---

## 10. FINOPS

### Target: < $35/mes para primeros 500 negocios activos

| Servicio | Estimado | Control |
|----------|---------|---------|
| Cloud Run (storefront) | $8/mes | Scale-to-zero, min-instances=0 |
| Cloud Run (admin shell) | $4/mes | Scale-to-zero |
| Cloud Run (3 MFE remotes) | $6/mes | Scale-to-zero |
| Firestore | $5/mes | Índices compuestos, no full scans |
| Cloud Storage | $3/mes | Lifecycle: borrar +1 año, resize imágenes |
| Claude API (demos) | $3/mes | 5 demos/día límite, max_tokens controlado |
| Firebase Auth | $0 | Gratis hasta 10K users |
| CI/CD (Cloud Build) | $2/mes | Límite de minutos |
| **Total** | **~$31/mes** | |

### Anti-patterns prohibidos

- ❌ Una instancia Cloud Run por negocio — multi-tenancy en una sola instancia
- ❌ Firestore sin índices — query lento = CPU = costo
- ❌ Imágenes sin CDN — Cloud Storage + CDN tier
- ❌ AI generation sin rate limit — un usuario puede vaciar el budget
- ❌ Logs verbosos en prod — Cloud Logging cobra por volumen (nivel WARN+)
- ❌ Secrets en env del repo — siempre Secret Manager

---

## 11. SEGURIDAD

| Capa | Control |
|------|---------|
| Auth | Firebase JWT en todas las rutas `/api/v1/admin/*` |
| Autorización | `requireRole('admin' | 'superadmin' | 'owner')` |
| Firestore | Rules: owner solo lee/escribe sus datos |
| Input | Zod validation en todos los endpoints (no trust client) |
| Upload | Validar MIME real, max 2MB, no SVG, sanitizar filename |
| AI | Rate limit 5 generates/día/user, max_tokens=2048 |
| Rate limiting | 100 req/min/IP en API general |
| Secrets | Secret Manager, `pnpm audit` en CI (block high severity) |
| Headers | CSP, X-Frame-Options, HSTS en storefront |
| CORS | Solo dominios propios (no wildcard) |
| PII | No logs con email/phone. Firestore no indexa campos PII |

---

## 12. DECISIONES QUE NO SE CONSTRUYEN (y por qué)

| Feature | Decisión |
|---------|----------|
| Chat en tiempo real | WhatsApp lo resuelve, agregar chat es competir con WhatsApp |
| App nativa iOS/Android | La web en WhatsApp es suficiente para el MVP |
| Pagos en plataforma (procesar pagos del cliente final) | Regulación, licencias, fuera del scope |
| Sistema de inventario | Los negocios lo manejan externamente |
| One GCP project per tenant | Costo prohibitivo, no aporta aislamiento necesario para MVP |
| IA para imágenes de productos | Calidad impredecible, mejor que el negocio suba fotos reales |
| Multi-idioma | Solo es-MX en MVP |

---

## ORDEN ESTRICTO DE TRABAJO

```
SDD (este doc) → Tests → Design System → Storefront → Admin/Demo → Dashboard Dueño → Backend Real → Infra

1. Define (SDD) antes de codificar
2. Escribe el test que falla (TDD red) antes del código
3. Código mínimo para pasar (green)
4. Refactoriza sin romper tests
5. PR: typecheck + lint + tests en verde = merge
```
