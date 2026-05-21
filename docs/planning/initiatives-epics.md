# Project Management Hierarchy — SaaS Catalog Platform

> **Platform:** Small businesses (heladerías, barberías, estéticas, restaurantes) create branded product catalogs. Customers browse and order via WhatsApp. Admin generates AI-powered demos to sell to prospects.
>
> **Stack:** Nuxt 4 + Vue 3 + UnoCSS + Firebase/Firestore + Nitro/H3 + Module Federation MFE + GCP Cloud Run

---

## Index

| ID | Initiative | Epics |
|----|-----------|-------|
| I1 | Platform Core | E1, E2, E3, E4 |
| I2 | Sales Engine | E5, E6, E7 |
| I3 | Business Catalog | E8, E9, E10 |
| I4 | Business Intelligence | E11, E12 |
| I5 | Growth & Monetization | E13, E14, E15 |

---

## INITIATIVE 1 — Platform Core

> Platform foundation that enables all other work.

### Epics

| ID | Name |
|----|------|
| E1 | Monorepo foundation + CI/CD + testing infrastructure |
| E2 | Component library `@sass-factory/ui` + `@sass-factory/tokens` |
| E3 | Authentication & authorization |
| E4 | Observability, logging, monitoring |

---

### US-001: Developer can run typecheck + lint + unit tests in one command

**Epic:** E1 — Monorepo foundation + CI/CD + testing infrastructure
**Initiative:** I1 — Platform Core
**Como** desarrollador, **quiero** ejecutar typecheck, lint y unit tests con un solo comando desde la raíz del monorepo, **para que** pueda verificar la salud del código antes de hacer commit sin recordar comandos por paquete.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Unified dev quality command

  Scenario: Developer runs all checks and everything passes
    Given the developer is at the monorepo root
    And all packages have no type errors
    And all packages comply with ESLint rules
    And all unit tests are passing
    When the developer runs "pnpm check"
    Then typecheck runs across all packages
    And ESLint runs across all packages
    And Vitest runs all unit tests
    And the exit code is 0
    And the total runtime is under 60 seconds on a cold run

  Scenario: Typecheck fails in one package
    Given the developer is at the monorepo root
    And `packages/core/src/types/app.ts` has a type error
    When the developer runs "pnpm check"
    Then the process exits with code 1
    And the output clearly identifies the file and line number of the type error
    And lint and tests are skipped after the typecheck failure

  Scenario: ESLint finds a violation after typecheck passes
    Given typecheck passes for all packages
    And `apps/admin/app/pages/index.vue` has an unused import
    When the developer runs "pnpm check"
    Then the process exits with code 1
    And the output reports the ESLint rule violation with file and line
    And unit tests are not executed

  Scenario: A unit test fails after typecheck and lint pass
    Given typecheck passes
    And lint passes
    And one unit test in `packages/ui` fails an assertion
    When the developer runs "pnpm check"
    Then the process exits with code 1
    And Vitest output shows the failing test name and assertion diff
```

**Subtareas:**
- [ ] ST-001: Crear script `check` en root `package.json` que encadene `typecheck`, `lint`, `test` (Sprint 1)
- [ ] ST-002: Configurar Vitest en `packages/ui` con cobertura mínima del 70% (Sprint 1)
- [ ] ST-003: Configurar Vitest en `packages/core` (Sprint 1)
- [ ] ST-004: Documentar el comando en `CLAUDE.md` y `README.md` (Sprint 1)
- [ ] ST-005: Verificar que `pnpm typecheck` ya corre correctamente en todos los workspaces (Sprint 1)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-002: GitHub Actions CI runs on every PR to develop

**Epic:** E1 — Monorepo foundation + CI/CD + testing infrastructure
**Initiative:** I1 — Platform Core
**Como** mantenedor del repositorio, **quiero** que GitHub Actions ejecute typecheck, lint y tests automáticamente en cada PR hacia `develop`, **para que** ningún código roto llegue a la rama principal.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: GitHub Actions CI pipeline on pull requests

  Scenario: PR is opened to develop and all checks pass
    Given a developer opens a pull request targeting the "develop" branch
    And the branch has no type errors, lint violations, or failing tests
    When GitHub Actions triggers the CI workflow
    Then the workflow runs on ubuntu-latest with Node 20
    And pnpm dependencies are installed with cache restored
    And "pnpm check" completes successfully
    And the PR shows a green status check named "CI / check"
    And merging is unblocked

  Scenario: PR has a type error and CI fails
    Given a developer opens a pull request targeting "develop"
    And the branch introduces a type error in "apps/admin/server/api/v1/businesses.get.ts"
    When GitHub Actions triggers the CI workflow
    And "pnpm check" exits with code 1
    Then the PR shows a red status check named "CI / check"
    And merging is blocked by branch protection
    And the workflow logs show the exact type error

  Scenario: CI is skipped for PRs not targeting develop
    Given a developer opens a pull request targeting a feature branch
    When GitHub Actions evaluates triggers
    Then the CI workflow does not run
    And no status check is posted to the PR

  Scenario: Dependency cache is restored on second run
    Given the CI workflow ran successfully on a previous commit
    And pnpm-lock.yaml has not changed
    When a new commit is pushed to the same PR
    Then the pnpm install step restores from cache
    And the total workflow runtime is under 90 seconds
```

**Subtareas:**
- [ ] ST-006: Crear `.github/workflows/ci.yml` con trigger `pull_request` targeting `develop` (Sprint 1)
- [ ] ST-007: Configurar pnpm cache en el workflow usando `actions/cache` (Sprint 1)
- [ ] ST-008: Habilitar branch protection en `develop` requiriendo el status check `CI / check` (Sprint 1)
- [ ] ST-009: Añadir badge de CI al `README.md` raíz (Sprint 1)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-003: Generic Button component is published to GitHub Packages and consumed in admin app

**Epic:** E2 — Component library `@sass-factory/ui` + `@sass-factory/tokens`
**Initiative:** I1 — Platform Core
**Como** desarrollador frontend, **quiero** importar el componente `Button` desde `@sass-factory/ui` en la app admin, **para que** no duplique implementaciones de UI entre apps.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Button component published and consumed from package registry

  Scenario: Button renders with primary variant
    Given the admin app has "@sass-factory/ui" installed as a dependency
    When a developer uses "<AppButton variant="primary">Guardar</AppButton>" in a Vue template
    Then the button renders with the primary background color from design tokens
    And the button displays the text "Guardar"
    And the button has role="button" and is keyboard-focusable

  Scenario: Button renders with destructive variant
    Given the Button component is imported in a page
    When variant="destructive" is passed
    Then the button renders with the destructive color token
    And the button has aria-label support via the label prop

  Scenario: Button shows loading state
    Given a Button with variant="primary" is rendered
    When the ":loading="true"" prop is set
    Then a spinner icon replaces the button text
    And the button has "disabled" attribute set
    And the button has aria-busy="true"

  Scenario: Button is disabled
    Given a Button component is rendered
    When ":disabled="true"" prop is passed
    Then the button has the "disabled" HTML attribute
    And clicking the button does not emit the "click" event

  Scenario: Package is published to GitHub Packages registry
    Given the CI workflow runs on a merge to main
    And the version in "packages/ui/package.json" has been bumped
    When the publish job runs
    Then the package "@sass-factory/ui" appears in the GitHub Packages registry
    And the new version is installable via "pnpm add @sass-factory/ui"
```

**Subtareas:**
- [ ] ST-010: Crear estructura base de `packages/ui` con Vite + vue-tsc build (Sprint 1)
- [ ] ST-011: Implementar `AppButton.vue` con variants primary, secondary, destructive, ghost (Sprint 1)
- [ ] ST-012: Crear `packages/tokens` con design tokens CSS variables (Sprint 1)
- [ ] ST-013: Escribir unit tests para AppButton con Vitest + @vue/test-utils (Sprint 1)
- [ ] ST-014: Configurar `.npmrc` y publish step en GitHub Actions (Sprint 2)
- [ ] ST-015: Consumir `@sass-factory/ui` en `apps/admin` reemplazando botones existentes (Sprint 2)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-004: StatusBadge component renders correct color for each business status

**Epic:** E2 — Component library `@sass-factory/ui` + `@sass-factory/tokens`
**Initiative:** I1 — Platform Core
**Como** administrador, **quiero** ver el estado de cada negocio con un badge de color consistente, **para que** pueda identificar el estado del ciclo de vida de un vistazo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: StatusBadge component color per business lifecycle status

  Scenario: Draft status renders with gray color
    Given the StatusBadge component receives status="draft"
    When the component renders
    Then the badge displays the text "Borrador"
    And the badge background uses the token "--color-status-draft" (gray)

  Scenario: Demo status renders with blue color
    Given the StatusBadge component receives status="demo"
    When the component renders
    Then the badge displays the text "Demo"
    And the badge background uses the token "--color-status-demo" (blue)

  Scenario: Sent status renders with yellow color
    Given the StatusBadge component receives status="sent"
    When the component renders
    Then the badge displays the text "Enviado"
    And the badge background uses the token "--color-status-sent" (yellow/amber)

  Scenario: Accepted status renders with teal color
    Given the StatusBadge component receives status="accepted"
    When the component renders
    Then the badge displays the text "Aceptado"
    And the badge background uses the token "--color-status-accepted" (teal)

  Scenario: Active status renders with green color
    Given the StatusBadge component receives status="active"
    When the component renders
    Then the badge displays the text "Activo"
    And the badge background uses the token "--color-status-active" (green)

  Scenario: Suspended status renders with red color
    Given the StatusBadge component receives status="suspended"
    When the component renders
    Then the badge displays the text "Suspendido"
    And the badge background uses the token "--color-status-suspended" (red)

  Scenario: Unknown status renders gracefully
    Given the StatusBadge component receives an unrecognized status value
    When the component renders
    Then the badge displays the raw status value
    And the badge uses a neutral gray fallback color
    And no console error is thrown
```

**Subtareas:**
- [ ] ST-016: Crear `StatusBadge.vue` en `packages/ui/src/components/` (Sprint 1)
- [ ] ST-017: Añadir tokens CSS para cada status en `packages/tokens` (Sprint 1)
- [ ] ST-018: Escribir unit tests cubriendo los 6 estados + fallback (Sprint 1)
- [ ] ST-019: Exportar `StatusBadge` desde el barrel `packages/ui/src/index.ts` (Sprint 1)
- [ ] ST-020: Integrar `StatusBadge` en la tabla de negocios del admin (Sprint 2)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-005: Admin accesses protected route with valid Firebase JWT

**Epic:** E3 — Authentication & authorization
**Initiative:** I1 — Platform Core
**Como** administrador, **quiero** acceder a las rutas protegidas del admin con mi cuenta de Firebase, **para que** solo usuarios autorizados puedan gestionar negocios y demos.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Protected route access with Firebase JWT

  Scenario: Admin with valid JWT accesses protected page
    Given the admin user is signed in with Firebase Auth
    And the user has a valid non-expired JWT token
    When the user navigates to "/admin/businesses"
    Then the page renders with the full businesses list
    And the Nitro middleware validates the JWT via Firebase Admin SDK
    And the response status is 200

  Scenario: Admin JWT is validated server-side on API call
    Given the admin user has a valid Firebase JWT
    When the browser makes a GET request to "/api/v1/admin/businesses"
    And the Authorization header contains "Bearer {validToken}"
    Then the Nitro route handler decodes the token
    And the decoded UID is attached to the H3 event context
    And the route returns the businesses data with status 200

  Scenario: Session expires and user is redirected to login
    Given the admin user's Firebase token has expired
    When the user navigates to "/admin/businesses"
    Then the client-side auth middleware detects the expired token
    And the user is redirected to "/login"
    And no API call to "/api/v1/admin/businesses" is made

  Scenario: Admin role is verified from Firestore custom claims
    Given a Firebase user exists with no "admin" custom claim
    When they authenticate and navigate to "/admin/businesses"
    Then the server middleware returns HTTP 403
    And the client redirects to "/unauthorized"
```

**Subtareas:**
- [ ] ST-021: Instalar Firebase Admin SDK en `apps/admin/server` (Sprint 2)
- [ ] ST-022: Crear Nitro middleware `server/middleware/auth.ts` que valide JWT (Sprint 2)
- [ ] ST-023: Crear composable `useAdminAuth` en `apps/admin/app/composables/` (Sprint 2)
- [ ] ST-024: Crear route middleware de Nuxt para redirigir a `/login` si no autenticado (Sprint 2)
- [ ] ST-025: Configurar Firebase Auth con Google provider en el admin (Sprint 2)
- [ ] ST-026: Escribir unit tests para el middleware de auth (Sprint 2)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-006: Unauthenticated request to /api/v1/admin/* returns 401

**Epic:** E3 — Authentication & authorization
**Initiative:** I1 — Platform Core
**Como** sistema, **quiero** rechazar todas las peticiones sin token válido a las rutas del admin API, **para que** los datos de negocios y prospects estén protegidos.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: API authentication enforcement

  Scenario: Request with no Authorization header returns 401
    Given no Authorization header is present in the request
    When a GET request is made to "/api/v1/admin/businesses"
    Then the server returns HTTP 401
    And the response body is {"error": "Unauthorized", "code": "MISSING_TOKEN"}
    And no database query is executed

  Scenario: Request with malformed token returns 401
    Given the Authorization header contains "Bearer invalid.token.here"
    When a GET request is made to "/api/v1/admin/businesses"
    Then the Firebase Admin SDK throws a token verification error
    And the server returns HTTP 401
    And the response body is {"error": "Unauthorized", "code": "INVALID_TOKEN"}

  Scenario: Request with expired token returns 401
    Given the Authorization header contains a valid but expired Firebase JWT
    When a GET request is made to "/api/v1/admin/businesses"
    Then the server returns HTTP 401
    And the response body is {"error": "Unauthorized", "code": "TOKEN_EXPIRED"}

  Scenario: Public routes are not affected by auth middleware
    Given no Authorization header is present
    When a GET request is made to "/api/v1/catalog/{slug}"
    Then the server returns HTTP 200
    And the catalog data is returned normally

  Scenario: Auth middleware does not log sensitive token data
    Given a request with any Authorization header arrives
    When the middleware processes the request
    Then the raw token value is never written to server logs
    And only the decoded UID appears in structured log output
```

**Subtareas:**
- [ ] ST-027: Configurar el middleware de auth para aplicarse solo a rutas `/api/v1/admin/**` (Sprint 2)
- [ ] ST-028: Definir códigos de error estandarizados en `packages/core/src/types/errors.ts` (Sprint 2)
- [ ] ST-029: Escribir unit tests con fetch mock para los 3 escenarios de token inválido (Sprint 2)
- [ ] ST-030: Asegurar que rutas públicas `/api/v1/catalog/**` están excluidas del middleware (Sprint 2)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-007: Error in API route is logged as structured JSON with traceId and businessId

**Epic:** E4 — Observability, logging, monitoring
**Initiative:** I1 — Platform Core
**Como** ingeniero de operaciones, **quiero** que cada error en una ruta de API se registre como JSON estructurado con traceId y businessId, **para que** pueda correlacionar errores en producción con contexto suficiente para diagnóstico.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Structured error logging in API routes

  Scenario: Unhandled error in API route produces structured log
    Given the API route "/api/v1/admin/businesses/{id}" throws an unhandled Error
    When the Nitro error handler catches the exception
    Then a JSON log entry is written to stdout with the following fields:
      | field       | value                          |
      | level       | "error"                        |
      | message     | the error message              |
      | traceId     | a unique UUID for the request  |
      | businessId  | the id from the route param    |
      | route       | "/api/v1/admin/businesses/{id}"|
      | timestamp   | ISO 8601 format                |
      | stack       | the error stack trace          |
    And the HTTP response returns status 500
    And the response body does not expose the stack trace to the client

  Scenario: traceId is propagated from request header
    Given the incoming request has header "X-Trace-Id: abc-123"
    When an error occurs in the route handler
    Then the structured log entry has traceId="abc-123"
    And the HTTP 500 response includes header "X-Trace-Id: abc-123"

  Scenario: traceId is generated when header is absent
    Given the incoming request has no "X-Trace-Id" header
    When an error occurs in the route handler
    Then the server generates a UUID v4 as traceId
    And the structured log entry uses that generated traceId
    And the HTTP 500 response includes that traceId in the "X-Trace-Id" header

  Scenario: Non-error log levels are also structured
    Given a successful request to "/api/v1/admin/businesses"
    When the route handler completes
    Then an INFO log entry is written with level, route, traceId, duration_ms, and status fields
    And no stack field is present in the INFO log
```

**Subtareas:**
- [ ] ST-031: Crear utilidad `server/utils/logger.ts` con salida JSON estructurada (Sprint 2)
- [ ] ST-032: Crear plugin Nitro `server/plugins/error-handler.ts` que capture errores globales (Sprint 2)
- [ ] ST-033: Crear middleware `server/middleware/trace.ts` que genere/propague traceId (Sprint 2)
- [ ] ST-034: Añadir businessId al contexto H3 en rutas que reciban ese parámetro (Sprint 2)
- [ ] ST-035: Escribir unit tests para el logger verificando el schema JSON de salida (Sprint 2)
- [ ] ST-036: Configurar Cloud Logging en GCP para parsear JSON logs automáticamente (Sprint 3)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

## INITIATIVE 2 — Sales Engine

> Admin generates AI demos, sends to prospects, tracks acceptance, activates businesses.

### Epics

| ID | Name |
|----|------|
| E5 | AI demo generation (repurpose existing Claude + SSE endpoint) |
| E6 | Business status lifecycle (draft→demo→sent→accepted→active→suspended) |
| E7 | Prospect capture (demo banner CTA → prospect form → Firestore) |
| E16 | Prospect CRM & qualification (contact, accept, reject — linked to pipeline) |

---

### US-008: Admin generates a business catalog demo from a text description

**Epic:** E5 — AI demo generation
**Initiative:** I2 — Sales Engine
**Como** administrador, **quiero** generar un demo de catálogo de negocio a partir de una descripción en texto libre, **para que** pueda mostrar una demo personalizada a un prospecto en minutos.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: AI-powered business catalog demo generation

  Scenario: Admin generates a demo with valid business description
    Given the admin is on the "Nuevo Demo" page
    And the admin types "Heladería artesanal en Guadalajara, especialidad en sabores tropicales, 15 productos"
    And the admin selects business type "heladería"
    When the admin clicks "Generar Demo"
    Then the Claude API is called with the description and business type
    And a new business document is created in Firestore with status="demo"
    And the document contains generated fields: name, slug, theme, products (min 5), tagline
    And the admin is redirected to "/admin/businesses/{newId}/preview"

  Scenario: Generated products match the described business type
    Given the demo description mentions "heladería" and "sabores tropicales"
    When the generation completes
    Then all generated products have a category of "helados" or "bebidas"
    And product names reflect tropical flavors (mango, coco, maracuyá, etc.)
    And each product has name, price (MXN), description, and category fields

  Scenario: Generated slug is URL-safe and unique
    Given a demo is generated for "Heladería La Palma"
    When the slug is created
    Then the slug is "heladeria-la-palma" or a suffixed variant like "heladeria-la-palma-2"
    And the slug contains only lowercase letters, numbers, and hyphens
    And no existing business in Firestore has the same slug

  Scenario: Admin cannot submit without a description
    Given the admin is on the "Nuevo Demo" page
    And the description textarea is empty
    When the admin clicks "Generar Demo"
    Then the button remains disabled
    And a validation message "Escribe una descripción del negocio" is shown
    And no API call is made
```

**Subtareas:**
- [ ] ST-037: Crear endpoint `POST /api/v1/admin/demos` en Nitro (Sprint 3)
- [ ] ST-038: Escribir prompt de sistema para generación de catálogo en `server/utils/prompts.ts` (Sprint 3)
- [ ] ST-039: Integrar Anthropic SDK en el endpoint de generación (Sprint 3)
- [ ] ST-040: Crear función de escritura a Firestore en `server/utils/firestore.ts` (Sprint 3)
- [ ] ST-041: Implementar generación de slug único con verificación en Firestore (Sprint 3)
- [ ] ST-042: Crear página `app/pages/admin/demos/new.vue` con formulario (Sprint 3)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-009: Demo generation streams progress via SSE to the browser

**Epic:** E5 — AI demo generation
**Initiative:** I2 — Sales Engine
**Como** administrador, **quiero** ver el progreso de la generación del demo en tiempo real, **para que** no me quede con una pantalla en blanco mientras espero la respuesta de la IA.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Server-Sent Events streaming for demo generation progress

  Scenario: Generation progress events stream to the browser
    Given the admin has submitted a valid demo generation request
    When the server begins calling the Claude API
    Then the HTTP response uses Content-Type "text/event-stream"
    And the browser receives a stream of SSE events in this order:
      | event        | data example                            |
      | progress     | {"step": "analyzing", "pct": 10}        |
      | progress     | {"step": "generating_products", "pct": 40} |
      | progress     | {"step": "building_theme", "pct": 70}   |
      | progress     | {"step": "saving", "pct": 90}           |
      | complete     | {"businessId": "abc123", "slug": "..."}  |
    And after the "complete" event the connection closes

  Scenario: UI displays a progress bar during streaming
    Given the SSE connection is established
    When a "progress" event arrives with pct=40
    Then the UI progress bar advances to 40%
    And the step label updates to "Generando productos..."
    And the "Generar Demo" button shows a loading spinner

  Scenario: SSE connection handles client disconnect gracefully
    Given the generation is in progress (pct=50)
    When the browser closes the connection (tab closed / navigated away)
    Then the server detects the disconnect via the "close" event on the response
    And the Claude API stream is aborted
    And no Firestore document is written for an incomplete generation
    And no error is thrown server-side

  Scenario: Stream is received correctly across multiple buffered chunks
    Given the Claude API returns the JSON response in multiple TCP chunks
    When all chunks are received and reassembled
    Then the final parsed JSON is valid and complete
    And the complete event carries the correct businessId
```

**Subtareas:**
- [ ] ST-043: Crear endpoint SSE `GET /api/v1/admin/demos/stream` en Nitro con `setHeader(event, 'Content-Type', 'text/event-stream')` (Sprint 3)
- [ ] ST-044: Implementar EventSource client en `app/composables/useDemoGeneration.ts` (Sprint 3)
- [ ] ST-045: Crear componente `GenerationProgress.vue` con barra de progreso animada (Sprint 3)
- [ ] ST-046: Manejar abort del stream cuando el cliente desconecta (Sprint 3)
- [ ] ST-047: Escribir unit test para el ensamblado de chunks del stream (Sprint 3)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-010: Failed generation shows error state, not blank screen

**Epic:** E5 — AI demo generation
**Initiative:** I2 — Sales Engine
**Como** administrador, **quiero** ver un mensaje de error claro cuando falla la generación del demo, **para que** sepa qué pasó y pueda volver a intentarlo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Error handling during demo generation

  Scenario: Claude API returns 500 error during generation
    Given the admin has submitted a demo generation request
    And the Claude API returns an HTTP 500 response
    When the SSE stream receives an "error" event
    Then the UI hides the progress bar
    And displays an error card with message "Error al generar el demo. Intenta de nuevo."
    And a "Reintentar" button is shown that resets the form
    And the partial Firestore document (if any) is deleted

  Scenario: Claude API timeout after 30 seconds
    Given the generation request is in progress
    And 30 seconds pass without a "complete" event
    When the client-side timeout fires
    Then the EventSource connection is closed by the client
    And the UI shows "La generación tardó demasiado. Intenta con una descripción más corta."
    And the "Reintentar" button is available

  Scenario: Network drops mid-stream
    Given the SSE stream is at 60% progress
    When the network connection is interrupted
    Then the EventSource fires an "error" event
    And the UI detects the disconnection
    And shows "Se perdió la conexión. Verifica tu red y vuelve a intentarlo."
    And does not show a blank loading state

  Scenario: Invalid JSON in Claude response
    Given the Claude API returns a response with malformed JSON
    When the server attempts to parse the generated catalog
    Then the server sends an SSE "error" event with code "PARSE_ERROR"
    And the UI displays the error card
    And the error is logged server-side with traceId and the raw response snippet (first 200 chars)

  Scenario: Retry after error resets state cleanly
    Given the UI is showing the error state
    When the admin clicks "Reintentar"
    Then the error card disappears
    And the form resets to the initial empty state
    And a new generation can be started without refreshing the page
```

**Subtareas:**
- [ ] ST-048: Añadir evento SSE `error` con código estructurado en el endpoint (Sprint 3)
- [ ] ST-049: Implementar timeout de 30s en el composable `useDemoGeneration` (Sprint 3)
- [ ] ST-050: Crear componente `GenerationError.vue` con mensaje y botón de reintento (Sprint 3)
- [ ] ST-051: Implementar cleanup de documento Firestore incompleto en caso de error (Sprint 3)
- [ ] ST-052: Escribir unit tests para cada escenario de error del composable (Sprint 3)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-011: Admin publishes a draft demo to make it accessible at /demo/{slug}

**Epic:** E6 — Business status lifecycle
**Initiative:** I2 — Sales Engine
**Como** administrador, **quiero** publicar un demo en borrador para que sea accesible en la URL pública `/demo/{slug}`, **para que** pueda compartirlo con el prospecto.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Demo publication lifecycle transition

  Scenario: Admin publishes a draft demo successfully
    Given a business document exists in Firestore with status="draft" and slug="heladeria-la-palma"
    When the admin clicks "Publicar Demo" on the preview page
    Then a PATCH request is sent to "/api/v1/admin/businesses/{id}/status"
    And the request body is {"status": "demo"}
    And the Firestore document is updated to status="demo"
    And publishedAt timestamp is set to the current server time
    And the admin sees a success toast "Demo publicado correctamente"
    And the button changes to "Ver Demo" with the URL "/demo/heladeria-la-palma"

  Scenario: Demo URL is publicly accessible after publication
    Given the business status is "demo"
    When an unauthenticated user visits "/demo/heladeria-la-palma"
    Then the page renders the full catalog with the generated products and theme
    And the page includes the prospect capture banner
    And the HTTP response is 200

  Scenario: Draft demo URL returns 404 when not yet published
    Given the business status is "draft"
    When any user visits "/demo/heladeria-la-palma"
    Then the server returns HTTP 404
    And the page renders a "Demo no disponible" message

  Scenario: Admin cannot publish a demo that already has status="active"
    Given the business status is "active"
    When the admin attempts to set status="demo"
    Then the server returns HTTP 422
    And the response body is {"error": "Invalid status transition", "from": "active", "to": "demo"}
    And the Firestore document is not modified

  Scenario: Status transition is recorded in an audit subcollection
    Given the admin publishes a draft demo
    When the status changes to "demo"
    Then a document is added to "businesses/{id}/statusHistory"
    And the document contains {from: "draft", to: "demo", changedBy: adminUID, changedAt: timestamp}
```

**Subtareas:**
- [ ] ST-053: Crear endpoint `PATCH /api/v1/admin/businesses/{id}/status` (Sprint 3)
- [ ] ST-054: Implementar state machine de transiciones válidas en `packages/core/src/utils/status.ts` (Sprint 3)
- [ ] ST-055: Crear ruta pública `apps/admin/app/pages/demo/[slug].vue` (Sprint 3)
- [ ] ST-056: Escribir unit tests para la state machine de status (Sprint 3)
- [ ] ST-057: Implementar escritura al subcollection `statusHistory` en Firestore (Sprint 4)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-012: Prospect clicks "Sí, lo quiero" on demo page and submits contact form

**Epic:** E6 — Business status lifecycle
**Initiative:** I2 — Sales Engine
**Como** prospecto, **quiero** expresar mi interés en el demo que me compartieron y dejar mis datos de contacto, **para que** el equipo de catalog.mx me contacte para activar mi catálogo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Prospect acceptance form submission

  Scenario: Prospect submits acceptance form successfully
    Given the prospect is viewing the demo at "/demo/heladeria-la-palma"
    And the page shows a banner with button "Sí, lo quiero"
    When the prospect clicks "Sí, lo quiero"
    Then a modal opens with fields: nombre, teléfono (required), email (optional), mensaje (optional)
    When the prospect fills nombre="María López" and teléfono="3312345678"
    And clicks "Enviar"
    Then a POST request is made to "/api/v1/prospects"
    And a prospect document is created in Firestore under "prospects/{businessId}/{prospectId}"
    And the business document status updates to "accepted"
    And the modal closes and shows a thank-you message "¡Genial! Te contactaremos pronto."

  Scenario: Prospect form validates phone number format
    Given the acceptance modal is open
    When the prospect enters teléfono="123" (too short)
    And clicks "Enviar"
    Then the form shows "Ingresa un número de 10 dígitos"
    And the POST request is not made

  Scenario: Prospect form validates required fields
    Given the acceptance modal is open
    And nombre is empty
    When the prospect clicks "Enviar"
    Then the form shows "El nombre es requerido"
    And no request is made

  Scenario: Duplicate submission is rejected
    Given the prospect has already submitted the acceptance form for this business
    When the same phone number submits the form again
    Then the server returns HTTP 409
    And the UI shows "Ya recibimos tu solicitud para este catálogo"

  Scenario: Form submission works without authentication
    Given the prospect has no Firebase account or session
    When the prospect submits the acceptance form
    Then the POST request to "/api/v1/prospects" succeeds without an Authorization header
    And the prospect document is saved correctly
```

**Subtareas:**
- [ ] ST-058: Crear endpoint público `POST /api/v1/prospects` (Sprint 4)
- [ ] ST-059: Crear modal `ProspectForm.vue` con validación de campos (Sprint 4)
- [ ] ST-060: Implementar detección de duplicados por teléfono+businessId en Firestore (Sprint 4)
- [ ] ST-061: Actualizar status del negocio a "accepted" al guardar el prospecto (Sprint 4)
- [ ] ST-062: Escribir unit tests para validaciones del formulario (Sprint 4)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-013: Admin activates an accepted business (sends credentials, status → active)

**Epic:** E6 — Business status lifecycle
**Initiative:** I2 — Sales Engine
**Como** administrador, **quiero** activar un negocio aceptado enviando las credenciales al dueño y cambiando su estado a "active", **para que** el dueño pueda empezar a gestionar su catálogo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Business activation after prospect acceptance

  Scenario: Admin activates an accepted business
    Given a business document has status="accepted"
    And the prospect data includes teléfono="3312345678" and email="maria@example.com"
    When the admin clicks "Activar Negocio" on the business detail page
    Then a POST request is made to "/api/v1/admin/businesses/{id}/activate"
    And a Firebase Auth user is created with a temporary password
    And the business document status updates to "active"
    And activatedAt timestamp is set
    And an email is sent to the owner with login URL and temporary password
    And the admin sees "Negocio activado. Credenciales enviadas."

  Scenario: Activation creates the owner's Firebase Auth account
    Given the admin triggers activation for business with email="maria@example.com"
    When the activation endpoint runs
    Then Firebase Admin SDK creates a user with email="maria@example.com"
    And the user is assigned custom claim {"role": "owner", "businessId": "{id}"}
    And the user's UID is stored in the business Firestore document as "ownerUid"

  Scenario: Activation fails if Firebase user creation fails
    Given Firebase Auth returns an error during user creation
    When the activation endpoint handles the error
    Then the business status is NOT changed
    And the server returns HTTP 500 with {"error": "Activation failed", "code": "AUTH_CREATE_ERROR"}
    And the error is logged with traceId and businessId

  Scenario: Admin cannot activate a business that is not in "accepted" status
    Given the business has status="draft"
    When the admin calls the activation endpoint
    Then the server returns HTTP 422
    And the response body is {"error": "Invalid status transition", "from": "draft", "to": "active"}

  Scenario: Activated business storefront is accessible at catalog.mx/{slug}
    Given the business status changes to "active"
    When an unauthenticated user visits "/{slug}"
    Then the full public storefront renders with status 200
    And the prospect capture banner is no longer shown
```

**Subtareas:**
- [ ] ST-063: Crear endpoint `POST /api/v1/admin/businesses/{id}/activate` (Sprint 4)
- [ ] ST-064: Implementar creación de usuario Firebase Auth con custom claims (Sprint 4)
- [ ] ST-065: Integrar envío de email con SendGrid o Firebase Email Extension (Sprint 4)
- [ ] ST-066: Asegurar que la activación es idempotente (segundo intento no crea segundo usuario) (Sprint 4)
- [ ] ST-067: Escribir integration tests para el flujo completo de activación (Sprint 4)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-014: Demo page shows "¿Quieres esto para tu negocio?" banner with contact CTA

**Epic:** E7 — Prospect capture
**Initiative:** I2 — Sales Engine
**Como** prospecto que ve un demo, **quiero** ver un call-to-action prominente que me invite a contratar el servicio, **para que** sepa cómo obtener mi propio catálogo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Prospect capture banner on demo pages

  Scenario: Banner renders on demo page for businesses with status="demo"
    Given the business has status="demo"
    When a visitor accesses "/demo/heladeria-la-palma"
    Then a sticky banner is visible at the bottom of the page
    And the banner contains the text "¿Quieres esto para tu negocio?"
    And a button "Sí, lo quiero" is visible and prominent

  Scenario: Banner is not shown on active business storefronts
    Given the business has status="active"
    When a visitor accesses the storefront at "/{slug}"
    Then no prospect capture banner is rendered
    And no "Sí, lo quiero" button appears

  Scenario: Banner is sticky and visible after scrolling
    Given the visitor is on a demo page with many products
    When the visitor scrolls down past 3 product cards
    Then the banner remains visible at the bottom of the viewport
    And does not overlap product content in a way that hides prices

  Scenario: Banner CTA opens the acceptance modal
    Given the banner is visible on the demo page
    When the visitor clicks "Sí, lo quiero"
    Then the ProspectForm modal opens
    And focus is set to the first form field (nombre)

  Scenario: Banner includes social proof text
    Given the business type is "heladería"
    When the banner renders
    Then it shows a secondary line such as "Únete a los negocios que ya venden por WhatsApp"
```

**Subtareas:**
- [ ] ST-068: Crear componente `ProspectBanner.vue` sticky con CTA (Sprint 4)
- [ ] ST-069: Condicionar renderizado del banner al status del negocio (Sprint 4)
- [ ] ST-070: Asegurar que el banner no bloquea el contenido en móvil (Sprint 4)
- [ ] ST-071: Conectar el CTA del banner al modal `ProspectForm.vue` (Sprint 4)
- [ ] ST-072: Escribir snapshot test del banner para los dos estados (demo vs active) (Sprint 4)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-015: Admin is notified when a prospect submits the acceptance form

**Epic:** E7 — Prospect capture
**Initiative:** I2 — Sales Engine
**Como** administrador, **quiero** recibir una notificación inmediata cuando un prospecto acepta un demo, **para que** pueda contactarlo rápidamente y cerrar la venta.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Admin notification on prospect submission

  Scenario: Admin receives in-app notification on prospect submission
    Given the admin panel is open in the browser
    And a prospect submits the acceptance form for "Heladería La Palma"
    When the Firestore document is written to "prospects/{businessId}/{prospectId}"
    Then the admin panel receives a real-time notification via Firestore listener
    And a toast notification appears: "Nuevo prospecto: Heladería La Palma — María López"
    And the notification includes a link to the business detail page

  Scenario: Notification persists in the notifications list
    Given a prospect submitted the form 2 hours ago
    When the admin opens the notifications panel
    Then the notification is listed with timestamp "hace 2 horas"
    And the notification is marked as "unread"
    And clicking it marks it as "read" and navigates to the business

  Scenario: Admin receives email notification for prospect submission
    Given the admin email is configured in environment variables
    When a new prospect document is written to Firestore
    Then a Cloud Function (or Firestore trigger) sends an email to the admin
    And the email subject is "Nuevo prospecto: {businessName}"
    And the email body includes nombre, teléfono, and a link to the admin panel

  Scenario: Notification is not sent for duplicate submissions
    Given the prospect has already submitted for this business (status already "accepted")
    When the duplicate POST /api/v1/prospects is rejected with 409
    Then no new notification is created in Firestore
    And no email is sent
```

**Subtareas:**
- [ ] ST-073: Implementar Firestore real-time listener en `useNotifications.ts` (Sprint 4)
- [ ] ST-074: Crear colección `notifications/{adminUid}/items` en Firestore (Sprint 4)
- [ ] ST-075: Escribir Cloud Function `onProspectCreated` que cree la notificación y envíe email (Sprint 4)
- [ ] ST-076: Crear componente `NotificationsPanel.vue` en el admin (Sprint 4)
- [ ] ST-077: Añadir badge de notificaciones no leídas al header del admin (Sprint 4)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-032: Admin contacts, accepts, or rejects a prospect from the Prospects page

**Epic:** E16 — Prospect CRM & qualification
**Initiative:** I2 — Sales Engine
**As** a salesperson, **I want** to act on a prospect (contact, accept, reject) directly from the admin panel, **so that** I don't need to cross-reference WhatsApp, Firestore, and the Demos list manually.

#### UI Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│ Prospects                                                              │
│ People who clicked "Yes, I want it" on a demo                          │
├────────────────────────────────────────────────────────────────────────┤
│ ┌── 1 new prospect ─────────────────────────────────────────────────┐  │
│ │ 🎉  Someone wants a catalog — reach out now.                      │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  All prospects                                               Total: 1  │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │  Erick Bárcenas                  🥐 Bakery  [View demo →]         │ │
│ │  5544712575 · erick@example.com                                   │ │
│ │  Note: "Interested in: Concha, Croissant"        ● New  just now  │ │
│ │                                                                   │ │
│ │                         [Contact]   [Accept ✓]   [Reject ✗]      │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Prospect State Machine

```
         ┌─────────────┐
  submit │     New     │  (created when prospect submits "Yes, I want it")
  ──────►│  ● badge    │
         └──────┬──────┘
                │ [Contact] — admin marks they reached out
         ┌──────▼──────┐
         │  Contacted  │
         └──────┬──────┘
          ┌─────┴──────┐
     [Accept]       [Reject]
          │              │
   ┌──────▼──────┐  ┌────▼────────┐
   │  Accepted   │  │  Rejected   │  (terminal, business NOT advanced)
   └──────┬──────┘  └─────────────┘
          │ auto-advance business pipeline
   ┌──────▼──────────────────────┐
   │  Business status: Accepted  │
   └─────────────────────────────┘
```

#### Prospect × Business Lifecycle Integration

```
PROSPECT WORKFLOW          BUSINESS PIPELINE
─────────────────          ─────────────────
     New                      Draft
      │                         │ [Publish demo]
      │                        Demo
      │                         │ [Sent to prospect]
      │                        Sent
      │                         │
  Contacted ──────────────────► │  (no auto-advance here)
      │                         │
  Accepted  ──── auto ─────►  Accepted
                                 │ [Activate]
   becomes                     Active
   "Client"  ◄────────────────── │
```

**Acceptance criteria (Gherkin):**

```gherkin
Feature: Prospect CRM actions

  Background:
    Given I am logged in as admin
    And business "Bakery" is in status "Demo"
    And prospect "Erick Bárcenas" submitted "Yes, I want it" on the Bakery demo
    And the prospect status is "new"

  Scenario: Mark prospect as contacted
    When I click "Contact" on the Erick Bárcenas prospect row
    Then the prospect status changes to "contacted"
    And a "Contacted at" timestamp is stored in Firestore
    And the row badge updates from "New" to "Contacted"
    And the [Contact] button becomes disabled (already done)

  Scenario: Accept a prospect — auto-advances business pipeline
    Given the prospect status is "contacted"
    When I click "Accept" on the prospect row
    Then the prospect status changes to "accepted"
    And a PATCH request is sent to "/api/v1/admin/prospects/{id}/accept"
    And the Bakery business status advances from "sent" to "accepted" automatically
    And a success toast shows "Prospect accepted — Bakery is now Accepted"
    And the Prospects sidebar badge decrements by 1

  Scenario: Reject a prospect — business pipeline unchanged
    Given the prospect status is "contacted"
    When I click "Reject" on the prospect row
    Then the prospect status changes to "rejected"
    And the Bakery business status does NOT change
    And the row shows a "Rejected" badge in red

  Scenario: Accept requires prior contact
    Given the prospect status is "new"
    When I click "Accept"
    Then the action is blocked
    And a tooltip shows "Mark as contacted first before accepting"

  Scenario: View demo linked from prospect row
    When I click "View demo →" on the Erick Bárcenas row
    Then I navigate to the Demos page
    And the Bakery card is scrolled into view and highlighted
```

**Subtasks:**
- [ ] ST-165: Add action buttons (Contact, Accept, Reject) to ProspectRow component (Sprint 13)
- [ ] ST-166: Create `PATCH /api/v1/admin/prospects/{id}/contact` endpoint (Sprint 13)
- [ ] ST-167: Create `PATCH /api/v1/admin/prospects/{id}/accept` endpoint — triggers business pipeline advance (Sprint 13)
- [ ] ST-168: Create `PATCH /api/v1/admin/prospects/{id}/reject` endpoint (Sprint 13)
- [ ] ST-169: Add prospect state machine validation in `packages/core/src/types/prospect.ts` (Sprint 13)
- [ ] ST-170: Write unit tests for all prospect state transitions (Sprint 13)

**Definition of Done:**
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests

---

### US-033: Demo card shows prospect activity and links bidirectionally to Prospects

**Epic:** E16 — Prospect CRM & qualification
**Initiative:** I2 — Sales Engine
**As** a salesperson, **I want** to see prospect signals on each demo card and navigate directly between demos and their prospects, **so that** I never lose context switching between pages.

#### UI Wireframe — Demo Card with Prospect Badge

```
┌──────────────────────────────────────────────────────────────────────┐
│ Demos                                                [+ New demo]   │
├──────────────────────────────────────────────────────────────────────┤
│  All   Draft   Demo(3)   Sent   Accepted   Active                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─── Demo card (status: Demo) ──────────────────────────────────┐   │
│  │  🥐 Bakery                          ● Demo           [▼]      │   │
│  │     panaderia · CDMX                                          │   │
│  │     "hola"                                                    │   │
│  │                                                               │   │
│  │     👤 2 prospects  [view →]    ← clickable badge             │   │
│  │                                                               │   │
│  │  [View demo →]          [Sent to prospect]                    │   │
│  └────────────────────────────────────────────────────────────── ┘   │
│                                                                      │
│  ┌─── Demo card (status: Sent — prospect accepted) ──────────────┐   │
│  │  🍦 Heladería XYZ                   ● Sent          [▼]      │   │
│  │     heladería · CDMX                                          │   │
│  │                                                               │   │
│  │     👤 1 prospect  ✓ Accepted  [view →]   ← status inline    │   │
│  │                                                               │   │
│  │  [View demo →]          [Mark accepted]                       │   │
│  └────────────────────────────────────────────────────────────── ┘   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Data Relationship Diagram

```
Business (Firestore)              Prospect (Firestore)
─────────────────────             ────────────────────
id: "bakery-01"        1 ───► N   businessId: "bakery-01"
status: "demo"                    contactName: "Erick"
prospectCount: 2                  status: "new"
lastProspectAt: ...               createdAt: ...

Admin UI navigation:
  Demos page  ──[2 prospects →]──►  Prospects page (filtered by businessId)
  Prospects page  ──[View demo →]──►  Demos page (card highlighted)
```

**Acceptance criteria (Gherkin):**

```gherkin
Feature: Bidirectional demo-prospect navigation

  Scenario: Demo card shows prospect count badge
    Given business "Bakery" has 2 prospects in Firestore
    When I view the Demos page
    Then the Bakery card shows "👤 2 prospects"
    And the badge is clickable

  Scenario: Prospect badge navigates to filtered Prospects page
    When I click the "2 prospects" badge on the Bakery card
    Then I navigate to /admin/prospects?businessId=bakery-01
    And only prospects for Bakery are shown
    And a "← Back to Bakery demo" breadcrumb is visible

  Scenario: Demo card shows inline prospect status when accepted
    Given one of Bakery's prospects has status="accepted"
    When I view the Bakery demo card
    Then the prospect badge shows "✓ Accepted" in green
    And the pipeline step "Accepted" is highlighted in the card

  Scenario: No prospect badge shown when business has zero prospects
    Given business "Panadería Nueva" has 0 prospects
    When I view its demo card
    Then no prospect badge is displayed

  Scenario: Navigate from Prospect row back to its Demo
    Given I am on the Prospects page viewing Erick Bárcenas
    When I click "View demo →"
    Then I navigate to /admin/demos
    And the Bakery card is scrolled into view
    And the card has a 2-second highlight animation
```

**Subtasks:**
- [ ] ST-171: Add `prospectCount` and `lastProspectAt` fields to business Firestore doc (updated on prospect write) (Sprint 13)
- [ ] ST-172: Render prospect badge on DemoCard component using `prospectCount` (Sprint 13)
- [ ] ST-173: Add `?businessId=` filter support to Prospects page (Sprint 13)
- [ ] ST-174: Add highlight-on-navigate behavior to DemoCard via URL hash (Sprint 13)

**Definition of Done:**
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests

---

### US-034: Prospect vs. client distinction — active businesses are clients, not leads

**Epic:** E16 — Prospect CRM & qualification
**Initiative:** I2 — Sales Engine
**As** a salesperson, **I want** active businesses and their owners to be labeled as clients (not prospects), **so that** I don't treat paying customers as cold leads.

#### UI Wireframe — Sidebar Separation

```
Sidebar (before)                  Sidebar (after)
────────────────                  ──────────────────────────────
 Dashboard                         Dashboard
 Demos                             Demos
 Prospects  ● 1                    Prospects  ● 1
                                   Clients
 PIPELINE                          PIPELINE
  Draft   0                         Draft      0
  Demo    3                         Demo       3
  Sent    0                         Sent       0
  Accepted 0                        Accepted   0
  Active  1  ← mixed with leads     ─────────────
                                   CLIENTS
                                    Active     1  ← promoted out
```

#### Prospect → Client Promotion Flow

```
              Prospect submits form
                      │
              ┌───────▼────────┐
              │  prospect.status = "new"          │
              │  business.status = unchanged      │
              └───────┬────────┘
                      │  admin accepts prospect
              ┌───────▼────────┐
              │  prospect.status = "accepted"     │
              │  business.status → "accepted"     │
              └───────┬────────┘
                      │  admin activates business
              ┌───────▼────────┐
              │  business.status = "active"       │
              │  prospect label → "Client"        │ ← UI only, no new collection
              │  appears under CLIENTS sidebar    │
              └────────────────┘
```

**Acceptance criteria (Gherkin):**

```gherkin
Feature: Prospect vs client labeling

  Scenario: Active business prospect is shown as a client
    Given business "Bakery" has status="active"
    And prospect "Erick Bárcenas" is associated with Bakery and has status="accepted"
    When I view the sidebar
    Then the CLIENTS section shows count 1
    And the PIPELINE / Active row shows 0
    And "Erick Bárcenas" does NOT appear on the Prospects page
    But does appear on a "Clients" page filtered by active businesses

  Scenario: Pipeline counts exclude active (client) businesses
    Given there are 2 Demo businesses and 1 Active business
    When I view the sidebar pipeline section
    Then PIPELINE shows: Demo 2, and no Active count
    And CLIENTS shows: Active 1

  Scenario: Prospect in "accepted" status before business is active stays on Prospects page
    Given business "Panadería XYZ" has status="accepted" (not yet active)
    And its prospect status is "accepted"
    When I view the Prospects page
    Then the prospect still appears there with "Accepted" badge
    And does NOT appear in Clients yet

  Scenario: Dashboard NEW PROSPECTS card navigates to Prospects page
    Given there is 1 new prospect
    When I click the "NEW PROSPECTS 1" stat card on the dashboard
    Then I navigate to /admin/prospects
```

**Subtasks:**
- [ ] ST-175: Split sidebar PIPELINE and CLIENTS sections using `status === "active"` boundary (Sprint 13)
- [ ] ST-176: Add Clients page (`/admin/clients`) filtered to active businesses + their accepted prospects (Sprint 13)
- [ ] ST-177: Make Dashboard stat cards clickable with correct navigation targets (Sprint 13)
- [ ] ST-178: Write unit tests for sidebar count logic (Sprint 13)

**Definition of Done:**
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests

---

### US-035: Dashboard quick-create button is top-right and pipeline transitions have clear labels

**Epic:** E6 — Business status lifecycle
**Initiative:** I2 — Sales Engine
**As** a salesperson, **I want** the "+ New demo" button always visible at the top of the dashboard, and pipeline action labels that clearly explain what they do, **so that** I can act fast without hunting for controls.

#### UI Wireframe — Dashboard Header Fix

```
Before                                    After
──────────────────────────────            ──────────────────────────────────────
 Dashboard                                 Dashboard              [+ New demo]
 Sales pipeline overview                   Sales pipeline overview

 ┌────────┐ ┌──────────┐ ┌──────────┐     ┌────────┐ ┌──────────┐ ┌──────────┐
 │ACTIVE  │ │IN PIPELINE│ │NEW       │     │ACTIVE  │ │IN PIPELINE│ │NEW       │
 │  1     │ │    3      │ │PROSPECTS │     │  1     │ │    3      │ │PROSPECTS │
 └────────┘ └──────────┘ │  1       │     └────────┘ └──────────┘ │  1   →   │
                         └──────────┘                              └──────────┘
 Quick create demo                                                 (clickable)
                [+ New demo]  ← buried
```

#### Pipeline Action Label Glossary (tooltip copy)

```
┌──────────────────┬─────────────────────────────────────────────────────────┐
│ Button label     │ Tooltip text                                            │
├──────────────────┼─────────────────────────────────────────────────────────┤
│ Publish demo     │ Makes the demo URL public — prospect can view catalog   │
│ Sent to prospect │ Record that you shared the demo link with the prospect  │
│ Mark accepted    │ Prospect verbally agreed — moves to contract stage      │
│ Activate         │ Creates owner account and goes live at catalog.mx/slug  │
│ Suspend          │ Temporarily hides catalog — owner retains their data    │
│ Reactivate       │ Restores catalog visibility for the owner               │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

**Acceptance criteria (Gherkin):**

```gherkin
Feature: Dashboard UX quick actions

  Scenario: New demo button is in page header
    Given I navigate to the Dashboard
    Then I see a "+ New demo" button in the top-right of the page header
    And I do NOT need to scroll to find any primary action button

  Scenario: NEW PROSPECTS stat card is clickable
    Given there is 1 new prospect
    When I click the "NEW PROSPECTS 1" card
    Then I navigate to /admin/prospects

  Scenario: Pipeline action buttons show descriptive tooltips
    Given I hover over "Sent to prospect" on a Demo-status card
    Then a tooltip appears: "Record that you shared the demo link with the prospect"

  Scenario: Action button labels reflect actual meaning
    Given a business is in "Demo" status
    When I view its card
    Then the action button reads "Sent to prospect" (not "Mark as sent")
```

**Subtasks:**
- [ ] ST-179: Move "+ New demo" button to page header top-right on Dashboard and Demos pages (Sprint 13)
- [ ] ST-180: Rename "Mark as sent" → "Sent to prospect" and add tooltip copy for all 6 pipeline actions (Sprint 13)
- [ ] ST-181: Make Dashboard stat cards clickable with correct navigation (Sprint 13)

**Definition of Done:**
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests

---

## INITIATIVE 3 — Business Catalog

> The storefront customers see, and the dashboard the business owner uses.

### Epics

| ID | Name |
|----|------|
| E8 | Public storefront (SSG/ISR, mobile-first) |
| E9 | Owner onboarding (3-step flow after activation) |
| E10 | Product & category management |
| E17 | Storefront search & wishlist (client-side filter + saved cart → WhatsApp) |

---

### US-016: Customer browses a business catalog at catalog.mx/{slug}

**Epic:** E8 — Public storefront
**Initiative:** I3 — Business Catalog
**Como** cliente, **quiero** acceder al catálogo de un negocio en una URL simple, **para que** pueda ver sus productos desde mi celular sin instalar nada.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Public business catalog storefront

  Scenario: Customer loads the storefront of an active business
    Given the business "Heladería La Palma" has status="active" and slug="heladeria-la-palma"
    And the business has 12 active products in Firestore
    When a customer visits "catalog.mx/heladeria-la-palma"
    Then the page renders with the business name, logo, and tagline
    And all 12 active products are displayed as cards with name, price, and photo
    And the page title is "Heladería La Palma — catálogo"
    And the HTTP response is 200 with Cache-Control headers for ISR

  Scenario: Storefront is mobile-first and loads in under 3 seconds
    Given the storefront page is loaded on a simulated 4G mobile device
    When the Lighthouse performance audit runs
    Then the Time to First Contentful Paint is under 1.5 seconds
    And the Largest Contentful Paint is under 3 seconds
    And there is no horizontal scroll at 375px viewport width

  Scenario: Hidden products are not shown to customers
    Given the business has 3 active products and 2 hidden products
    When the customer visits the storefront
    Then only the 3 active products are rendered
    And the 2 hidden products do not appear in the DOM or page source

  Scenario: Storefront for suspended business shows 404
    Given the business status is "suspended"
    When any user visits "catalog.mx/heladeria-la-palma"
    Then the server returns HTTP 404
    And the page renders "Este catálogo no está disponible"

  Scenario: Storefront for unknown slug shows 404
    Given no business exists with slug "negocio-inexistente"
    When any user visits "catalog.mx/negocio-inexistente"
    Then the server returns HTTP 404
    And a friendly 404 page is shown
```

**Subtareas:**
- [ ] ST-078: Crear ruta `apps/template/pages/[slug].vue` con SSR/ISR (Sprint 5)
- [ ] ST-079: Crear endpoint público `GET /api/v1/catalog/{slug}` que retorne negocio + productos activos (Sprint 5)
- [ ] ST-080: Implementar diseño mobile-first con UnoCSS (Sprint 5)
- [ ] ST-081: Configurar revalidación ISR cada 60 segundos en Nuxt (Sprint 5)
- [ ] ST-082: Manejar 404 para slugs inválidos y negocios suspendidos (Sprint 5)
- [ ] ST-083: Correr auditoría Lighthouse y optimizar hasta cumplir métricas (Sprint 5)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-017: Customer filters products by category

**Epic:** E8 — Public storefront
**Initiative:** I3 — Business Catalog
**Como** cliente, **quiero** filtrar los productos por categoría, **para que** encuentre rápidamente lo que busco sin hacer scroll por todo el catálogo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Product category filtering on storefront

  Scenario: Category tabs render based on existing product categories
    Given the business has products in categories "Helados", "Bebidas", and "Postres"
    When the customer loads the storefront
    Then category tabs appear at the top of the product grid in the order: "Todos", "Helados", "Bebidas", "Postres"
    And the "Todos" tab is selected by default
    And all 12 products are shown

  Scenario: Customer filters by a specific category
    Given the storefront is showing all products
    And the business has 5 "Helados" and 3 "Bebidas" and 4 "Postres"
    When the customer taps the "Helados" tab
    Then only the 5 products in the "Helados" category are shown
    And the "Helados" tab has a visually active state
    And the product count updates to "5 productos"

  Scenario: Switching between categories updates the product grid without page reload
    Given the customer has selected the "Bebidas" tab and sees 3 products
    When the customer taps "Postres"
    Then the product grid updates to show 4 products
    And no full page navigation occurs (client-side filtering)
    And the URL updates to include "?categoria=postres" for shareability

  Scenario: No products in selected category shows empty state
    Given the customer selects a category with no active products
    When the filter is applied
    Then the product grid shows "No hay productos en esta categoría"
    And the other category tabs remain visible

  Scenario: Category filter works correctly when navigating from a shared URL
    Given a shared URL is "catalog.mx/heladeria-la-palma?categoria=bebidas"
    When the customer opens the URL
    Then the "Bebidas" tab is pre-selected
    And only Bebidas products are shown on initial render
```

**Subtareas:**
- [ ] ST-084: Crear componente `CategoryTabs.vue` con estado activo (Sprint 5)
- [ ] ST-085: Implementar filtrado reactivo client-side en el composable `useProducts.ts` (Sprint 5)
- [ ] ST-086: Sincronizar categoría seleccionada con query param `?categoria=` (Sprint 5)
- [ ] ST-087: Crear estado vacío `EmptyCategory.vue` (Sprint 5)
- [ ] ST-088: Escribir unit tests para la lógica de filtrado del composable (Sprint 5)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-018: Customer taps "Pedir" and is redirected to WhatsApp with pre-filled message

**Epic:** E8 — Public storefront
**Initiative:** I3 — Business Catalog
**Como** cliente, **quiero** hacer un pedido tocando "Pedir" en un producto, **para que** pueda contactar al negocio por WhatsApp con el pedido ya escrito sin tener que redactar el mensaje.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: WhatsApp order redirect from product card

  Scenario: Customer taps "Pedir" on a product card
    Given the business has whatsapp="5213312345678" configured
    And the product is "Helado de Mango" priced at "$45"
    When the customer taps the "Pedir" button on the product card
    Then the browser opens WhatsApp with the number "5213312345678"
    And the pre-filled message is "Hola, me interesa pedir: Helado de Mango ($45). ¿Está disponible?"
    And the redirect URL uses the format "https://wa.me/{number}?text={encodedMessage}"

  Scenario: WhatsApp message is correctly URL-encoded
    Given the product name contains special characters like "Helado de Coco & Maracuyá"
    When the WhatsApp URL is generated
    Then the product name is properly percent-encoded in the URL
    And WhatsApp renders the decoded message correctly

  Scenario: "Pedir" click is tracked as an analytics event
    Given the customer taps "Pedir" on any product
    When the redirect occurs
    Then an analytics event is written to Firestore:
      | field      | value                    |
      | type       | "whatsapp_click"         |
      | businessId | the business Firestore ID|
      | productId  | the product Firestore ID |
      | timestamp  | server timestamp         |
    And the event is written without requiring authentication

  Scenario: Business without WhatsApp number configured shows fallback
    Given the business has no whatsapp number in its Firestore document
    When the customer taps "Pedir"
    Then no redirect occurs
    And a tooltip shows "Este negocio aún no tiene WhatsApp configurado"

  Scenario: "Pedir" button is accessible via keyboard
    Given the product card is focused via keyboard navigation
    When the user presses Enter on the "Pedir" button
    Then the same WhatsApp redirect occurs as with a tap
```

**Subtareas:**
- [ ] ST-089: Crear función `buildWhatsAppUrl(phone, productName, price)` en `packages/core/src/utils/` (Sprint 5)
- [ ] ST-090: Integrar el botón "Pedir" en `ProductCard.vue` con el redirect (Sprint 5)
- [ ] ST-091: Crear endpoint `POST /api/v1/events/click` para tracking anónimo (Sprint 5)
- [ ] ST-092: Manejar el fallback cuando no hay número de WhatsApp (Sprint 5)
- [ ] ST-093: Escribir unit tests para `buildWhatsAppUrl` cubriendo encoding especial (Sprint 5)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-019: New business owner completes 3-step onboarding after receiving credentials

**Epic:** E9 — Owner onboarding
**Initiative:** I3 — Business Catalog
**Como** dueño de negocio recién activado, **quiero** completar un flujo de onboarding guiado en 3 pasos, **para que** mi catálogo esté listo para recibir clientes sin necesitar ayuda técnica.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: 3-step owner onboarding flow

  Scenario: Owner logs in for the first time and sees onboarding
    Given the owner received credentials and logs in to the owner portal
    And the business document has onboardingCompleted=false
    When the owner lands on the dashboard
    Then the onboarding wizard opens automatically on Step 1
    And the header shows "Configura tu catálogo — Paso 1 de 3"
    And the rest of the dashboard is blurred/inaccessible

  Scenario: Step 1 — Owner sets business name and WhatsApp number
    Given the owner is on Step 1 of onboarding
    When the owner enters negocioName="Heladería La Palma" and whatsapp="3312345678"
    And clicks "Siguiente"
    Then the business document in Firestore is updated with name and whatsapp
    And the wizard advances to Step 2

  Scenario: Step 2 — Owner uploads logo and sets tagline
    Given the owner is on Step 2 of onboarding
    When the owner uploads a PNG logo under 2MB and enters tagline="Los mejores sabores de GDL"
    And clicks "Siguiente"
    Then the logo is uploaded to Firebase Storage
    And the business document is updated with logoUrl and tagline
    And the wizard advances to Step 3

  Scenario: Step 3 — Owner adds their first product
    Given the owner is on Step 3 of onboarding
    When the owner fills in product name="Helado de Mango", price="45", category="Helados"
    And clicks "Guardar y terminar"
    Then the product is saved to Firestore under "businesses/{id}/products"
    And the business document is updated with onboardingCompleted=true
    And the wizard closes
    And the owner sees the full dashboard with their first product listed

  Scenario: Owner can skip onboarding and complete it later
    Given the owner is on any step of onboarding
    When the owner clicks "Completar después"
    Then the wizard closes
    And the dashboard is accessible
    And a banner "Completa tu perfil para activar tu catálogo" is shown
    And clicking the banner reopens the onboarding wizard at the incomplete step

  Scenario: Onboarding does not show again after completion
    Given onboardingCompleted=true in the business document
    When the owner logs in again
    Then no onboarding wizard appears
    And the dashboard loads normally
```

**Subtareas:**
- [ ] ST-094: Crear componente `OnboardingWizard.vue` con stepper de 3 pasos (Sprint 5)
- [ ] ST-095: Implementar Step 1 con validación de nombre y WhatsApp (Sprint 5)
- [ ] ST-096: Implementar Step 2 con upload de logo a Firebase Storage (Sprint 5)
- [ ] ST-097: Implementar Step 3 con formulario de primer producto (Sprint 5)
- [ ] ST-098: Guardar estado de onboarding en Firestore y leerlo al login (Sprint 5)
- [ ] ST-099: Crear banner de onboarding incompleto en el dashboard (Sprint 6)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-020: Owner customizes business theme (color, logo, tagline) and sees live preview

**Epic:** E9 — Owner onboarding
**Initiative:** I3 — Business Catalog
**Como** dueño de negocio, **quiero** personalizar el color, logo y tagline de mi catálogo y ver una vista previa en tiempo real, **para que** mi catálogo refleje la identidad de mi negocio antes de publicar cambios.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Business theme customization with live preview

  Scenario: Owner changes primary color and sees instant preview
    Given the owner is on the "Personalizar" page of the owner dashboard
    And the current primary color is "#4CAF50"
    When the owner selects color "#FF5722" from the color picker
    Then the live preview panel on the right updates immediately
    And the preview shows product cards, header, and buttons in the new color
    And no save request is made yet

  Scenario: Owner saves theme changes
    Given the owner has selected a new color "#FF5722" and updated tagline
    When the owner clicks "Guardar cambios"
    Then a PATCH request is sent to "/api/v1/owner/businesses/{id}/theme"
    And the Firestore business document is updated with the new theme values
    And the public storefront reflects the new theme within 60 seconds (ISR revalidation)
    And a success toast "Cambios guardados" is shown

  Scenario: Owner uploads a new logo and sees it in the preview
    Given the owner is on the "Personalizar" page
    When the owner uploads a JPG file of 500KB
    Then the image is shown in the logo preview within the live preview panel
    And the filename is shown below the upload input
    And the previous logo is replaced in the preview

  Scenario: Logo upload validation rejects SVG files
    Given the owner attempts to upload an SVG file as logo
    When the file is selected
    Then an error message "Solo se aceptan JPG y PNG" is shown
    And the previous logo remains unchanged

  Scenario: Unsaved changes prompt on navigation away
    Given the owner has made color changes that are not saved
    When the owner clicks a navigation link to another section
    Then a confirmation dialog appears: "Tienes cambios sin guardar. ¿Salir de todas formas?"
    And clicking "Quedarme" returns to the customization page with changes intact
    And clicking "Salir" discards the changes and navigates away
```

**Subtareas:**
- [ ] ST-100: Crear página `app/pages/owner/customize.vue` con layout de dos columnas (Sprint 6)
- [ ] ST-101: Integrar color picker (native input[type=color] + hex input) (Sprint 6)
- [ ] ST-102: Crear componente `ThemePreview.vue` que reactive a los cambios del form (Sprint 6)
- [ ] ST-103: Crear endpoint `PATCH /api/v1/owner/businesses/{id}/theme` (Sprint 6)
- [ ] ST-104: Implementar guard de navegación con Vue Router beforeRouteLeave (Sprint 6)
- [ ] ST-105: Escribir unit tests para las validaciones de archivo de logo (Sprint 6)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-021: Owner adds a new product with name, price, photo, and category

**Epic:** E10 — Product & category management
**Initiative:** I3 — Business Catalog
**Como** dueño de negocio, **quiero** agregar un nuevo producto con nombre, precio, foto y categoría, **para que** aparezca inmediatamente en mi catálogo público.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Product creation by business owner

  Scenario: Owner adds a product with all fields
    Given the owner is on the "Productos" page
    When the owner clicks "Agregar producto"
    And fills in: nombre="Helado de Vainilla", precio="40", categoría="Helados"
    And uploads a JPG photo of 800KB
    And clicks "Guardar"
    Then the photo is uploaded to Firebase Storage under "businesses/{id}/products/{productId}/photo"
    And a product document is created in Firestore with status="active"
    And the product appears at the top of the products list in the dashboard
    And the product is visible on the public storefront within 60 seconds

  Scenario: Owner adds a product without a photo
    Given the owner fills in nombre, precio, and categoría but does not upload a photo
    When the owner clicks "Guardar"
    Then the product is saved with a default placeholder image URL
    And no upload error occurs

  Scenario: Duplicate product name within the same business shows a warning
    Given the business already has a product named "Helado de Vainilla"
    When the owner tries to add another product with the same name
    And clicks "Guardar"
    Then a warning is shown: "Ya tienes un producto con ese nombre. ¿Continuar de todas formas?"
    And the owner can confirm to save it anyway or change the name

  Scenario: New category is created if owner types a category not in the list
    Given the existing categories are "Helados" and "Bebidas"
    When the owner types "Postres" in the categoría field and presses Enter
    Then "Postres" is added to the categories list
    And the product is saved with category="Postres"
    And the "Postres" tab appears on the public storefront

  Scenario: Free plan owner cannot exceed 10 products
    Given the business is on the Free plan
    And the business already has 10 active products
    When the owner tries to add product number 11
    Then the "Agregar producto" button is disabled
    And a banner shows "Has alcanzado el límite de tu plan gratuito. Actualiza a Pro para agregar más."
```

**Subtareas:**
- [ ] ST-106: Crear modal `ProductForm.vue` con campos nombre, precio, categoría, foto (Sprint 6)
- [ ] ST-107: Crear endpoint `POST /api/v1/owner/businesses/{id}/products` (Sprint 6)
- [ ] ST-108: Implementar upload de foto a Firebase Storage con progreso (Sprint 6)
- [ ] ST-109: Implementar creación dinámica de categorías (Sprint 6)
- [ ] ST-110: Implementar validación de límite de plan (10 productos Free, 100 Pro) (Sprint 6)
- [ ] ST-111: Escribir unit tests para las validaciones del formulario de producto (Sprint 6)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-022: Owner hides a product and it disappears from the storefront immediately

**Epic:** E10 — Product & category management
**Initiative:** I3 — Business Catalog
**Como** dueño de negocio, **quiero** ocultar un producto temporalmente, **para que** no aparezca en mi catálogo cuando está agotado sin necesidad de eliminarlo.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Product visibility toggle

  Scenario: Owner hides an active product
    Given the owner is on the "Productos" page
    And the product "Helado de Fresa" has status="active"
    When the owner toggles the visibility switch to "Oculto"
    Then a PATCH request is sent to "/api/v1/owner/businesses/{id}/products/{productId}"
    And the request body is {"status": "hidden"}
    And the product card shows a "Oculto" badge in the dashboard
    And the product is removed from the public storefront within 60 seconds (ISR)

  Scenario: Owner makes a hidden product visible again
    Given the product "Helado de Fresa" has status="hidden"
    When the owner toggles the visibility switch to "Activo"
    Then the Firestore document is updated to status="active"
    And the product reappears on the public storefront

  Scenario: Hidden products are still editable in the dashboard
    Given the product has status="hidden"
    When the owner clicks "Editar" on the hidden product card
    Then the product form opens with the current values pre-filled
    And the owner can update name, price, and photo
    And saving updates the document but keeps status="hidden"

  Scenario: Hiding a product does not delete its data or photo
    Given the product has a photo in Firebase Storage
    When the owner hides the product
    Then the photo URL in Firestore remains intact
    And the photo file in Firebase Storage is not deleted
    And making the product active again shows the same photo

  Scenario: Toggle is optimistic — UI updates before server confirms
    Given the product is currently active
    When the owner clicks the hide toggle
    Then the UI immediately shows the "Oculto" state
    And the PATCH request is sent in the background
    If the request fails
    Then the toggle reverts to "Activo"
    And an error toast "No se pudo ocultar el producto. Intenta de nuevo." is shown
```

**Subtareas:**
- [ ] ST-112: Añadir toggle de visibilidad a `ProductCard.vue` en el dashboard del owner (Sprint 6)
- [ ] ST-113: Crear endpoint `PATCH /api/v1/owner/businesses/{id}/products/{productId}` (Sprint 6)
- [ ] ST-114: Implementar optimistic update con rollback en el composable `useProducts.ts` (Sprint 6)
- [ ] ST-115: Verificar que el filtro de productos activos en el storefront excluye status="hidden" (Sprint 6)
- [ ] ST-116: Escribir unit tests para el optimistic update y rollback (Sprint 6)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-023: Image upload rejects files larger than 2MB with clear error message

**Epic:** E10 — Product & category management
**Initiative:** I3 — Business Catalog
**Como** dueño de negocio, **quiero** recibir un mensaje de error claro si intento subir una imagen demasiado grande, **para que** entienda exactamente qué debo corregir.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Image upload size and format validation

  Scenario: User uploads a file larger than 2MB
    Given the product form is open with the photo upload field
    When the owner selects a JPG file of 3.5MB
    Then the file is rejected before any upload begins
    And an error message is shown: "La imagen no puede ser mayor a 2MB. Tu archivo pesa 3.5MB."
    And no request is sent to Firebase Storage
    And the upload field is reset to empty

  Scenario: User uploads a file of exactly 2MB
    Given the product form is open
    When the owner selects a JPG file of exactly 2MB (2,097,152 bytes)
    Then the file is accepted
    And the upload proceeds to Firebase Storage
    And no error message is shown

  Scenario: User uploads an unsupported file type
    Given the product form is open
    When the owner selects a PDF file
    Then the file is rejected immediately
    And an error message is shown: "Solo se aceptan imágenes en formato JPG o PNG"
    And no upload is initiated

  Scenario: User uploads a valid PNG file under 2MB
    Given the owner selects a PNG file of 900KB
    Then the upload proceeds
    And a progress indicator shows the upload percentage
    And on completion the image preview is shown in the form

  Scenario: Slow network shows upload progress
    Given the owner has selected a valid 1.8MB JPG
    When the upload to Firebase Storage begins
    Then a progress bar shows the upload percentage in real time
    And the "Guardar" button is disabled during the upload
    And on completion the button becomes active again

  Scenario: Upload fails due to network error
    Given the upload is in progress at 50%
    When the network connection drops
    Then the upload fails
    And an error message is shown: "Error al subir la imagen. Verifica tu conexión e intenta de nuevo."
    And the "Guardar" button remains disabled until a valid photo is uploaded or removed
```

**Subtareas:**
- [ ] ST-117: Crear composable `useImageUpload.ts` con validación de tamaño y tipo antes del upload (Sprint 6)
- [ ] ST-118: Implementar progress bar de upload usando `uploadBytesResumable` de Firebase Storage (Sprint 6)
- [ ] ST-119: Añadir validaciones en el input file con accept="image/jpeg,image/png" (Sprint 6)
- [ ] ST-120: Escribir unit tests para todas las condiciones de validación (Sprint 6)
- [ ] ST-121: Aplicar el mismo composable al upload de logo en onboarding y personalización (Sprint 6)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-036: Customer searches for products by name in the storefront

**Epic:** E17 — Storefront search & wishlist
**Initiative:** I3 — Business Catalog
**As** a customer browsing a catalog, **I want** to search for products by name, **so that** I can find what I need without scrolling through all items.

#### UI Wireframe — Storefront with Search Bar

```
┌──────────────────────────────────────────────────────────────────┐
│  🥐 Bakery                              CDMX       WhatsApp →   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  🔍  Search products...                              ✕   │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   All   Pan dulce   Croissants   Panes                           │
│   ───────────────────────────────────────────────────────────    │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │          │  │          │  │          │  │          │        │
│   │  [img]   │  │  [img]   │  │  [img]   │  │  [img]   │        │
│   │          │  │          │  │          │  │          │        │
│   │ Concha   │  │Croissant │  │Pay queso │  │ Bolillo  │        │
│   │ $18 MXN  │  │ $35 MXN  │  │ $45 MXN  │  │  $8 MXN  │        │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│   ── After typing "cro" ──────────────────────────────────────   │
│                                                                  │
│   ┌──────────┐                                                    │
│   │          │                                                    │
│   │  [img]   │                                                    │
│   │          │                                                    │
│   │Croissant │   No other results                                 │
│   │ $35 MXN  │                                                    │
│   └──────────┘                                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Search Filter Logic

```
User types query
      │
      ▼
client-side filter (no API call)
      │
      ├── normalize: toLowerCase + trim
      │
      ├── match against: product.name (contains)
      │                  product.category (contains)
      │
      ├── search + category filter compose (AND logic)
      │   "cro" + category "Croissants" → only matching items
      │
      └── zero results → "No products match '{query}'"
             with [Clear search] button
```

**Acceptance criteria (Gherkin):**

```gherkin
Feature: Storefront product search

  Background:
    Given I am viewing the "Bakery" catalog at /bakery
    And the catalog has products: Concha, Croissant de mantequilla, Pay de queso, Bolillo

  Scenario: Search filters products in real time
    When I type "cro" in the search bar
    Then only "Croissant de mantequilla" is displayed
    And the result updates without a page reload
    And the category filter bar remains visible

  Scenario: Search is case-insensitive
    When I type "CONCHA"
    Then "Concha" appears in results

  Scenario: Search composes with category filter
    Given I have selected category "Pan dulce"
    When I type "pay"
    Then only products matching both "Pan dulce" AND containing "pay" are shown

  Scenario: No results shows empty state
    When I type "xyzabc"
    Then the grid shows "No products match 'xyzabc'"
    And a "Clear search" link is shown

  Scenario: Clear search restores full catalog
    Given I have typed "cro" and only Croissant is shown
    When I click ✕ in the search bar
    Then all products are shown again
    And the search input is empty

  Scenario: Search input is accessible
    When the page loads
    Then the search input has aria-label="Search products"
    And pressing Tab from the header focuses the search input
```

**Subtasks:**
- [ ] ST-182: Add search input component to storefront catalog header (Sprint 13)
- [ ] ST-183: Implement client-side `useProductSearch` composable that filters `visibleProducts` by query (Sprint 13)
- [ ] ST-184: Compose search filter with existing category filter (AND logic) (Sprint 13)
- [ ] ST-185: Add empty state UI with "Clear search" action (Sprint 13)
- [ ] ST-186: Write unit tests for search filter composable (Sprint 13)

**Definition of Done:**
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests

---

### US-037: Customer saves products to a wishlist and orders all via WhatsApp

**Epic:** E17 — Storefront search & wishlist
**Initiative:** I3 — Business Catalog
**As** a customer browsing a catalog, **I want** to save products I like and send a single WhatsApp message with everything I want, **so that** I don't have to order one item at a time.

#### UI Wireframe — Product Card with Save + Floating Cart

```
┌──────────────────────────────────────────────────────────────────┐
│  🥐 Bakery          CDMX      🛒 3 items    WhatsApp →           │
│                              └─ floating cart badge              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                    │
│   │          │   │  ♥ saved │   │          │                    │
│   │  [img]   │   │  [img]   │   │  [img]   │                    │
│   │          │   │ ╔══════╗ │   │          │                    │
│   │ Concha   │   │ ║  ✓   ║ │   │Pay queso │                    │
│   │ $18 MXN  │   │ ╚══════╝ │   │ $45 MXN  │                    │
│   │ [♡ Save] │   │Croissant │   │ [♡ Save] │                    │
│   │          │   │ $35 MXN  │   │          │                    │
│   │          │   │[♥ Saved] │   │          │                    │
│   └──────────┘   └──────────┘   └──────────┘                    │
│                                                                  │
│                         ┌──── Wishlist panel (slides up) ─────┐  │
│                         │  🛒  Your wishlist  (3 items)   [✕] │  │
│                         │  ───────────────────────────────── │  │
│                         │  Concha           $18  [−]1[+]     │  │
│                         │  Croissant        $35  [−]2[+]     │  │
│                         │  Pay de queso     $45  [−]1[+]     │  │
│                         │  ─────────────────────────────     │  │
│                         │  Total: $133 MXN                   │  │
│                         │                                    │  │
│                         │  [Order all via WhatsApp →]        │  │
│                         └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Wishlist State & WhatsApp Message Flow

```
Customer saves items
        │
        ▼
  localStorage["wishlist-{slug}"]
  { "concha-01": 1, "croissant-02": 2, "pay-01": 1 }
        │
        │  [Open cart panel]
        ▼
  Render: name, price, qty controls
        │
        │  [Order via WhatsApp →]
        ▼
  Build WhatsApp message:
  ┌──────────────────────────────────────────────────┐
  │ Hola! Quiero ordenar de Bakery:                  │
  │ - Concha x1 ($18)                                │
  │ - Croissant de mantequilla x2 ($70)              │
  │ - Pay de queso x1 ($45)                          │
  │ Total: $133 MXN                                  │
  └──────────────────────────────────────────────────┘
        │
        ▼
  wa.me/{business.whatsapp}?text={encoded message}

  When prospect submits "Yes, I want it":
  ┌──────────────────────────────────────────────────┐
  │ ProspectForm notes field pre-filled with:        │
  │ "Interested in: Concha, Croissant, Pay de queso" │
  └──────────────────────────────────────────────────┘
```

**Acceptance criteria (Gherkin):**

```gherkin
Feature: Storefront wishlist and cart

  Background:
    Given I am viewing the "Bakery" catalog
    And the catalog has: Concha ($18), Croissant ($35), Pay de queso ($45)

  Scenario: Save a product to wishlist
    When I click "♡ Save" on the Concha card
    Then the button changes to "♥ Saved" with a filled heart
    And the floating cart badge shows "1"
    And the wishlist is persisted in localStorage

  Scenario: Saved products persist on page reload
    Given I have saved Concha and Croissant
    When I reload the page
    Then both products still show "♥ Saved"
    And the cart badge shows "2"

  Scenario: Open wishlist panel
    Given I have 3 saved items
    When I click the cart badge
    Then a panel slides up from the bottom
    And shows all 3 items with name, price, and quantity controls
    And shows a total price

  Scenario: Adjust quantity in wishlist
    Given the wishlist panel is open and Croissant has qty=1
    When I click [+] on Croissant
    Then Croissant qty becomes 2
    And the total updates to reflect the new quantity

  Scenario: Remove item from wishlist
    Given the wishlist panel is open
    When I click [−] on Concha until qty reaches 0
    Then Concha is removed from the wishlist
    And the cart badge decrements

  Scenario: Order all items via WhatsApp
    Given the wishlist has: Concha x1, Croissant x2
    When I click "Order all via WhatsApp →"
    Then the browser opens WhatsApp with a pre-filled message:
      """
      Hola! Quiero ordenar de Bakery:
      - Concha x1 ($18)
      - Croissant de mantequilla x2 ($70)
      Total: $88 MXN
      """

  Scenario: Wishlist pre-fills prospect form notes
    Given I have Concha and Pay de queso in my wishlist
    When I click "Yes, I want it" and the ProspectForm opens
    Then the notes field is pre-filled with:
      "Interested in: Concha, Pay de queso"
    And the user can edit the notes before submitting
```

**Subtasks:**
- [ ] ST-187: Create `useWishlist` composable with localStorage persistence keyed by slug (Sprint 13)
- [ ] ST-188: Add save/unsave toggle button to product card with filled/outline heart icon (Sprint 13)
- [ ] ST-189: Create floating cart badge component (fixed position, shows count) (Sprint 13)
- [ ] ST-190: Create WishlistPanel slide-up component with qty controls and total (Sprint 13)
- [ ] ST-191: Build WhatsApp message string from wishlist items and open wa.me link (Sprint 13)
- [ ] ST-192: Pre-fill ProspectForm notes field from wishlist item names (Sprint 13)

**Definition of Done:**
- [ ] Tests pass
- [ ] Typecheck clean
- [ ] PR reviewed
- [ ] All Gherkin scenarios covered by tests

---

## INITIATIVE 4 — Business Intelligence

> Analytics and super admin visibility.

### Epics

| ID | Name |
|----|------|
| E11 | Click tracking & analytics dashboard |
| E12 | Super admin panel (business management, moderation) |

---

### US-024: Click on "Pedir" button is tracked in Firestore without authentication

**Epic:** E11 — Click tracking & analytics dashboard
**Initiative:** I4 — Business Intelligence
**Como** sistema, **quiero** registrar cada click en el botón "Pedir" en Firestore sin requerir autenticación, **para que** los dueños de negocios puedan ver cuántos pedidos generan sus catálogos.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Anonymous click tracking for WhatsApp order buttons

  Scenario: Customer taps "Pedir" and the event is tracked
    Given the customer is on the storefront of "heladeria-la-palma"
    And the customer is not authenticated
    When the customer taps "Pedir" on the product "Helado de Mango"
    Then a POST request is made to "/api/v1/events/click"
    And the request body contains: {businessId, productId, eventType: "whatsapp_click"}
    And a document is created in Firestore at "analytics/{businessId}/events/{auto-id}"
    And the document contains: {businessId, productId, eventType, timestamp, sessionId}
    And the HTTP response is 201

  Scenario: Tracking does not block the WhatsApp redirect
    Given the click tracking request may be slow
    When the customer taps "Pedir"
    Then the WhatsApp redirect happens immediately (fire-and-forget)
    And the tracking request is sent in the background without awaiting response
    And the customer reaches WhatsApp within 500ms

  Scenario: Tracking endpoint is rate-limited to prevent abuse
    Given the same IP address sends 100 click events within 1 minute
    When the 101st request arrives
    Then the server returns HTTP 429
    And no Firestore document is written for the excess requests
    And the WhatsApp redirect is not affected (client-side)

  Scenario: Tracking endpoint rejects requests with missing required fields
    Given a POST request to "/api/v1/events/click" has no businessId
    When the request is received
    Then the server returns HTTP 400
    And the response body is {"error": "Missing required field: businessId"}
    And no Firestore document is written

  Scenario: Session ID is generated client-side and persisted in sessionStorage
    Given the customer is browsing the storefront
    When the first click event is sent
    Then the client generates a UUID v4 as sessionId
    And the sessionId is stored in sessionStorage
    And all subsequent click events in the same browser session use the same sessionId
```

**Subtareas:**
- [ ] ST-122: Crear endpoint público `POST /api/v1/events/click` (Sprint 7)
- [ ] ST-123: Implementar rate limiting en el endpoint (100 req/min por IP) usando `h3-rate-limiter` o similar (Sprint 7)
- [ ] ST-124: Crear composable `useAnalytics.ts` con generación de sessionId (Sprint 7)
- [ ] ST-125: Integrar el tracking en `ProductCard.vue` como fire-and-forget (Sprint 7)
- [ ] ST-126: Escribir unit tests para validaciones del endpoint (Sprint 7)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-025: Business owner sees daily visit and click counts on dashboard home

**Epic:** E11 — Click tracking & analytics dashboard
**Initiative:** I4 — Business Intelligence
**Como** dueño de negocio, **quiero** ver cuántas visitas y clicks en "Pedir" tuvo mi catálogo hoy y esta semana, **para que** pueda evaluar si mi catálogo está atrayendo clientes.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Analytics dashboard for business owners

  Scenario: Owner sees today's visit and click counts on dashboard home
    Given the owner is logged in to the owner portal
    And the business has 45 page views and 12 "Pedir" clicks today
    When the owner lands on the dashboard home
    Then a stats section shows "45 visitas hoy" and "12 pedidos hoy"
    And the data is fetched from the aggregated Firestore analytics document
    And the stats load within 2 seconds

  Scenario: Owner sees a 7-day chart of visits and clicks
    Given the business has analytics data for the past 7 days
    When the owner views the analytics section
    Then a line chart shows two series: "Visitas" and "Pedidos" per day for the last 7 days
    And the X-axis shows day labels (Lun, Mar, Mié, ...)
    And hovering a data point shows the exact count for that day

  Scenario: Owner with zero analytics sees an empty state
    Given the business was activated today and has no analytics events
    When the owner views the dashboard
    Then the stats show "0 visitas hoy" and "0 pedidos hoy"
    And a message "Comparte tu catálogo para empezar a recibir visitas" is shown
    And no chart error occurs

  Scenario: Analytics data is aggregated daily by a server process
    Given click events are written to "analytics/{businessId}/events/*"
    When the daily aggregation Cloud Function runs at midnight UTC
    Then a summary document is written to "analytics/{businessId}/daily/{YYYY-MM-DD}"
    And the document contains {visits: N, clicks: N, date: "YYYY-MM-DD"}
    And the owner dashboard reads from daily summaries (not raw events)

  Scenario: Analytics endpoint requires owner authentication
    Given no Authorization header is present
    When a GET request is made to "/api/v1/owner/businesses/{id}/analytics"
    Then the server returns HTTP 401
```

**Subtareas:**
- [ ] ST-127: Crear endpoint `GET /api/v1/owner/businesses/{id}/analytics?days=7` (Sprint 7)
- [ ] ST-128: Crear Cloud Function `aggregateDailyAnalytics` con trigger de Cloud Scheduler (Sprint 7)
- [ ] ST-129: Crear componente `AnalyticsChart.vue` con Chart.js o unovis (Sprint 7)
- [ ] ST-130: Crear componente `StatCard.vue` para mostrar métricas individuales (Sprint 7)
- [ ] ST-131: Añadir sección de analytics a la home del owner dashboard (Sprint 7)
- [ ] ST-132: Escribir unit tests para la lógica de agregación (Sprint 7)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-026: Super admin views all businesses with filters by status and type

**Epic:** E12 — Super admin panel
**Initiative:** I4 — Business Intelligence
**Como** super administrador, **quiero** ver todos los negocios de la plataforma con filtros por estado y tipo de negocio, **para que** pueda hacer seguimiento del pipeline de ventas y el estado operativo de la plataforma.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Super admin business list with filters

  Scenario: Super admin views the full business list
    Given there are 87 businesses in Firestore across all statuses
    When the super admin navigates to "/admin/businesses"
    Then all 87 businesses are listed with pagination (25 per page)
    And each row shows: slug, name, type, status badge, createdAt, activatedAt
    And the list is sorted by createdAt descending by default

  Scenario: Super admin filters by status
    Given the admin is on the businesses list page
    When the admin selects "active" from the status filter dropdown
    Then only businesses with status="active" are shown
    And the URL updates to include "?status=active"
    And the result count updates to reflect the filtered count

  Scenario: Super admin filters by business type
    Given the admin selects "heladería" from the type filter
    Then only heladería businesses are shown
    And filters can be combined (e.g., status=active AND type=heladería)

  Scenario: Super admin searches by business name or slug
    Given the admin types "palma" in the search input
    When the search is applied
    Then only businesses whose name or slug contains "palma" (case-insensitive) are shown
    And the search is debounced by 300ms before firing

  Scenario: Super admin requires the "superadmin" custom claim
    Given a user with only the "admin" role (not "superadmin") accesses "/admin/businesses"
    When the page loads
    Then the server returns HTTP 403
    And the client redirects to "/unauthorized"
```

**Subtareas:**
- [ ] ST-133: Crear endpoint `GET /api/v1/admin/businesses` con soporte de filters y pagination (Sprint 7)
- [ ] ST-134: Implementar verificación de custom claim "superadmin" en el middleware (Sprint 7)
- [ ] ST-135: Crear página `app/pages/admin/businesses/index.vue` con tabla y filtros (Sprint 7)
- [ ] ST-136: Implementar búsqueda debounced con query param sync (Sprint 7)
- [ ] ST-137: Escribir unit tests para la lógica de filtrado del endpoint (Sprint 7)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-027: Super admin suspends an active business and the storefront shows 404

**Epic:** E12 — Super admin panel
**Initiative:** I4 — Business Intelligence
**Como** super administrador, **quiero** suspender un negocio activo, **para que** su catálogo público deje de estar accesible inmediatamente en casos de violación de términos de servicio.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Business suspension by super admin

  Scenario: Super admin suspends an active business
    Given the business "Heladería La Palma" has status="active"
    When the super admin clicks "Suspender" on the business detail page
    And confirms the action in a confirmation dialog: "¿Suspender Heladería La Palma? Esta acción ocultará su catálogo."
    Then a PATCH request is sent to "/api/v1/admin/businesses/{id}/status"
    And the request body is {"status": "suspended", "reason": "..."}
    And the Firestore document status is updated to "suspended"
    And suspendedAt and suspensionReason are recorded
    And the business status badge shows "Suspendido" in red

  Scenario: Storefront of suspended business shows 404
    Given the business status has just been changed to "suspended"
    When any user visits "catalog.mx/heladeria-la-palma"
    Then the server returns HTTP 404
    And the page shows "Este catálogo no está disponible"
    And no product data is exposed in the HTML or API response

  Scenario: Suspended business owner cannot log in to owner portal
    Given the business status is "suspended"
    When the owner attempts to log in to the owner portal
    Then after successful Firebase Auth the server detects the suspended status
    And the owner is redirected to "/suspended"
    And a message is shown: "Tu cuenta ha sido suspendida. Contacta a soporte."

  Scenario: Super admin can reactivate a suspended business
    Given the business status is "suspended"
    When the super admin clicks "Reactivar"
    Then the status reverts to "active"
    And the storefront becomes accessible again within 60 seconds
    And the statusHistory subcollection records the reactivation

  Scenario: Suspension reason is required
    Given the super admin clicks "Suspender"
    And the confirmation dialog has an empty "Razón" field
    When the admin clicks "Confirmar"
    Then the request is not sent
    And an error "La razón de suspensión es requerida" is shown in the dialog
```

**Subtareas:**
- [ ] ST-138: Añadir acción "Suspender" en la página de detalle de negocio del admin (Sprint 7)
- [ ] ST-139: Actualizar el endpoint de status para manejar la transición a "suspended" (Sprint 7)
- [ ] ST-140: Añadir verificación de status="suspended" en el middleware del owner portal (Sprint 7)
- [ ] ST-141: Asegurar que ISR invalida el caché del storefront al cambiar a suspended (Sprint 7)
- [ ] ST-142: Escribir E2E test: suspender → verificar 404 en storefront (Sprint 8)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

## INITIATIVE 5 — Growth & Monetization

> Billing, plan limits, viral loop, production infrastructure.

### Epics

| ID | Name |
|----|------|
| E13 | Subscription billing (MercadoPago) |
| E14 | Viral loop (footer CTA, sharing) |
| E15 | Production infrastructure (Terraform, CI/CD, monitoring) |

---

### US-028: Business owner upgrades from Free to Pro and product limit increases to 100

**Epic:** E13 — Subscription billing
**Initiative:** I5 — Growth & Monetization
**Como** dueño de negocio en plan gratuito, **quiero** actualizar al plan Pro y que mi límite de productos suba a 100, **para que** pueda agregar todo mi catálogo sin restricciones.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Plan upgrade from Free to Pro via MercadoPago

  Scenario: Owner initiates upgrade to Pro plan
    Given the owner is on the Free plan with 10 products (at the limit)
    And the "Agregar producto" button is disabled
    When the owner clicks "Actualizar a Pro" on the upgrade banner
    Then a POST request is sent to "/api/v1/owner/billing/checkout"
    And a MercadoPago preference is created for the monthly Pro fee
    And the owner is redirected to the MercadoPago checkout page

  Scenario: Successful payment upgrades the plan to Pro
    Given the owner has completed payment on MercadoPago
    When MercadoPago sends a webhook POST to "/api/v1/webhooks/mercadopago"
    And the payment status is "approved"
    Then the business Firestore document is updated: plan="pro", planExpiresAt=+30days
    And the product limit is now 100
    And the owner sees a success banner "¡Ya eres Pro! Ahora puedes agregar hasta 100 productos."
    And a subscription document is created in "businesses/{id}/subscriptions/{id}"

  Scenario: After upgrade the owner can add up to 100 products
    Given the business plan is "pro"
    When the owner navigates to the "Agregar producto" page
    Then the "Agregar producto" button is enabled even when the business has 10+ products
    And the limit badge shows "10 / 100 productos"
    And the owner can successfully add products up to the 100 limit

  Scenario: MercadoPago webhook signature is validated
    Given a POST request arrives at "/api/v1/webhooks/mercadopago"
    When the X-Signature header does not match the computed HMAC
    Then the server returns HTTP 401
    And no changes are made to Firestore
    And the suspicious request is logged with IP and payload hash

  Scenario: MercadoPago webhook is idempotent
    Given MercadoPago sends the same payment webhook twice (retry)
    When the second webhook is received
    Then the server detects that the subscription already exists for this paymentId
    And returns HTTP 200 without duplicating the subscription document
    And no duplicate email is sent
```

**Subtareas:**
- [ ] ST-143: Crear endpoint `POST /api/v1/owner/billing/checkout` que crea preferencia MercadoPago (Sprint 8)
- [ ] ST-144: Crear endpoint público `POST /api/v1/webhooks/mercadopago` con validación de firma HMAC (Sprint 8)
- [ ] ST-145: Implementar lógica de actualización de plan en Firestore tras pago aprobado (Sprint 8)
- [ ] ST-146: Integrar límite de plan en el endpoint `POST /api/v1/owner/businesses/{id}/products` (Sprint 8)
- [ ] ST-147: Crear banner de upgrade en el owner dashboard (Sprint 8)
- [ ] ST-148: Escribir unit tests para la validación de webhook y lógica de idempotencia (Sprint 8)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-029: Failed payment suspends the business after 3 retry attempts

**Epic:** E13 — Subscription billing
**Initiative:** I5 — Growth & Monetization
**Como** sistema, **quiero** suspender automáticamente un negocio Pro cuando el pago de renovación falla 3 veces consecutivas, **para que** solo los negocios con suscripción activa tengan acceso a funciones Pro.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Automatic suspension after payment failures

  Scenario: First payment failure sends warning email
    Given a business is on the Pro plan and the monthly renewal fails
    When MercadoPago sends a webhook with payment status="rejected"
    Then the business document is updated: paymentFailures=1
    And an email is sent to the owner: "Tu pago falló. Actualiza tu método de pago."
    And the business status remains "active"
    And the plan is not downgraded yet

  Scenario: Second payment failure sends urgent email
    Given the business has paymentFailures=1
    When a second payment failure webhook arrives
    Then the business document is updated: paymentFailures=2
    And a more urgent email is sent: "Segundo intento fallido. Tu catálogo se suspenderá en 24h."
    And the business status remains "active"

  Scenario: Third payment failure suspends the business
    Given the business has paymentFailures=2
    When a third payment failure webhook arrives
    Then the business document is updated: paymentFailures=3, status="suspended", plan="free"
    And the public storefront returns 404
    And an email is sent: "Tu suscripción ha sido cancelada. Tu catálogo está suspendido."
    And the suspension reason is logged as "payment_failure_3x"

  Scenario: Successful payment after failures resets the failure counter
    Given the business has paymentFailures=1
    When a successful payment webhook arrives
    Then paymentFailures is reset to 0
    And no suspension occurs
    And the business status remains "active"

  Scenario: Reactivation after suspension via new payment
    Given the business has status="suspended" due to payment failures
    When the owner makes a new successful payment
    Then the business status returns to "active"
    And plan="pro" is restored
    And paymentFailures is reset to 0
    And the storefront becomes accessible again
```

**Subtareas:**
- [ ] ST-149: Añadir campo `paymentFailures` (integer) al schema del business en Firestore (Sprint 8)
- [ ] ST-150: Implementar lógica de conteo de fallos y suspensión en el webhook handler (Sprint 8)
- [ ] ST-151: Integrar envío de emails escalonados con plantillas diferenciadas (Sprint 8)
- [ ] ST-152: Escribir unit tests para la state machine de fallos de pago (Sprint 8)
- [ ] ST-153: Crear Cloud Function `checkExpiredSubscriptions` que corra diariamente para detectar planes expirados no cubiertos por webhooks (Sprint 9)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-030: Visitor clicks "Hecho con catalog.mx" footer and is redirected to registration

**Epic:** E14 — Viral loop
**Initiative:** I5 — Growth & Monetization
**Como** visitante de un catálogo, **quiero** poder hacer click en el footer "Hecho con catalog.mx" para aprender más sobre el servicio, **para que** pueda crear mi propio catálogo si me interesa.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Viral footer CTA for organic growth

  Scenario: Visitor clicks the footer link on a public storefront
    Given the visitor is browsing a public business catalog
    And the footer shows "Hecho con catalog.mx ✦ Crea el tuyo gratis"
    When the visitor clicks the footer link
    Then a new tab opens with "https://catalog.mx/registro"
    And the URL includes a referral param: "?ref={businessSlug}"
    And a click event is tracked in Firestore: {type: "footer_click", referrerSlug: slug}

  Scenario: Referral slug is captured during registration
    Given the visitor arrived at the registration page with "?ref=heladeria-la-palma"
    When the visitor completes the registration form
    Then the new user document in Firestore includes referredBy="heladeria-la-palma"
    And the referral data is stored for future attribution reporting

  Scenario: Footer link opens in a new tab, not in the same tab
    Given a visitor is on the storefront page
    When the footer link is rendered
    Then the anchor element has target="_blank" and rel="noopener noreferrer"
    And clicking it does not navigate the current tab away from the catalog

  Scenario: Footer is visible on all device sizes
    Given the storefront is viewed at 375px (mobile) viewport
    When the page is scrolled to the bottom
    Then the footer is visible and the link text is fully readable
    And the footer does not overlap product content

  Scenario: Footer link click on Free plan businesses shows attribution
    Given the business is on the Free plan
    When the storefront renders
    Then the footer "Hecho con catalog.mx" is visible
    And there is no option for Free plan owners to remove the footer
```

**Subtareas:**
- [ ] ST-154: Crear componente `CatalogFooter.vue` con el link de atribución (Sprint 9)
- [ ] ST-155: Implementar generación de URL con `?ref={slug}` (Sprint 9)
- [ ] ST-156: Trackear clicks del footer en Firestore (puede reusar el endpoint `/api/v1/events/click` con type="footer_click") (Sprint 9)
- [ ] ST-157: Capturar el query param `?ref=` durante el registro y guardarlo en Firestore (Sprint 9)
- [ ] ST-158: Asegurar que el footer solo es eliminable en plan Pro (Sprint 9)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

### US-031: Budget alert fires when monthly GCP cost exceeds $40

**Epic:** E15 — Production infrastructure
**Initiative:** I5 — Growth & Monetization
**Como** administrador de infraestructura, **quiero** recibir una alerta automática cuando el gasto mensual en GCP supera $40 USD, **para que** pueda detectar anomalías de costos antes de que escalen.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: GCP budget alert for infrastructure cost control

  Scenario: Monthly spend exceeds $40 and alert fires
    Given a GCP budget is configured for the catalog.mx project with a threshold of $40/month
    And the current month's accumulated spend reaches $40.01
    When GCP Billing evaluates the budget
    Then a Pub/Sub message is published to the "billing-alerts" topic
    And a Cloud Function subscriber receives the message
    And an email is sent to the admin "eibarcenas.m@gmail.com" with subject "⚠️ GCP Budget Alert: $40 threshold exceeded"
    And the email body includes current spend, project name, and a link to the GCP billing console

  Scenario: Alert fires at 50% threshold as an early warning
    Given the budget has a 50% threshold configured ($20)
    When monthly spend reaches $20.05
    Then a warning email is sent: "GCP spend is at 50% of monthly budget ($20.05 / $40)"
    And the full alert at $40 has not yet fired

  Scenario: Alert at 100% threshold does not repeat daily
    Given the $40 alert fired on the 15th of the month
    And spend continues to grow
    When the next budget evaluation runs on the 16th (same month)
    Then no duplicate email is sent for the same threshold in the same month
    And GCP natively handles this via Pub/Sub deduplication

  Scenario: Terraform provisions the budget alert automatically
    Given the Terraform configuration in "infrastructure/terraform/billing.tf" is applied
    When "terraform apply" runs in the GCP project
    Then a google_billing_budget resource is created with amount=$40
    And a Pub/Sub topic "billing-alerts" is created
    And a Cloud Function subscription is wired to the topic
    And the alert is active without manual GCP console configuration

  Scenario: Alert includes actionable context
    Given the budget alert email is received
    When the admin reads the email
    Then the email includes the top 3 GCP services by spend for the current month
    And a direct link to GCP Cost Table filtered to the current month
    And a recommendation to check Cloud Run instance count if spend is unusually high
```

**Subtareas:**
- [ ] ST-159: Crear `infrastructure/terraform/billing.tf` con `google_billing_budget` resource (Sprint 9)
- [ ] ST-160: Crear Pub/Sub topic `billing-alerts` en Terraform (Sprint 9)
- [ ] ST-161: Crear Cloud Function `onBillingAlert` que envíe email al admin (Sprint 9)
- [ ] ST-162: Configurar threshold del 50% como alerta temprana adicional (Sprint 9)
- [ ] ST-163: Documentar el setup de billing alerts en `infrastructure/README.md` (Sprint 9)
- [ ] ST-164: Verificar en entorno de staging que la alerta dispara correctamente con spend simulado (Sprint 9)

**Definition of Done:**
- [ ] Tests verdes
- [ ] Typecheck limpio
- [ ] PR revisado
- [ ] Gherkin scenarios pasan como tests E2E o unit tests

---

## Summary

| Initiative | Epics | Stories | Subtasks |
|------------|-------|---------|----------|
| I1 — Platform Core | E1–E4 | US-001 to US-007 | ST-001 to ST-036 |
| I2 — Sales Engine | E5–E7, E16 | US-008 to US-015, US-032 to US-035 | ST-037 to ST-077, ST-165 to ST-181 |
| I3 — Business Catalog | E8–E10, E17 | US-016 to US-023, US-036 to US-037 | ST-078 to ST-121, ST-182 to ST-192 |
| I4 — Business Intelligence | E11–E12 | US-024 to US-027 | ST-122 to ST-142 |
| I5 — Growth & Monetization | E13–E15 | US-028 to US-031 | ST-143 to ST-164 |
| **Total** | **17** | **37** | **192** |

### Sprint 13 — Prospect CRM + Storefront UX (new)

| Story | Epic | Priority | Effort |
|-------|------|----------|--------|
| US-032: Prospect contact/accept/reject actions | E16 | P1 — Critical | M |
| US-033: Demo-prospect bidirectional link | E16 | P1 — Critical | S |
| US-034: Prospect vs. client labeling | E16 | P2 — High | S |
| US-035: Dashboard UX + action label copy | E6 | P3 — Medium | XS |
| US-036: Storefront search bar | E17 | P2 — High | S |
| US-037: Storefront wishlist/cart | E17 | P3 — Medium | M |
