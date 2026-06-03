# De la Idea al Código — Workflow Completo

> **Por qué existe este documento**
>
> El proyecto SaaS Factory comenzó en desorden. La arquitectura fue diseñada antes de validar el producto. La documentación describía un stack completamente diferente (Next.js + Python FastAPI) al que existía en el código (Nuxt 4 + Nitro/H3). Dos productos competidores (landing pages de eventos + catálogos de negocios) coexistían en el mismo codebase sin una decisión explícita. El arquitecto lo resumió: *"creo de momento hicimos muchas cosas en desorden."*
>
> Este documento existe para que eso no vuelva a pasar. Es el workflow obligatorio para cualquier proyecto nuevo: desde la primera idea hasta operaciones en producción.

---

## Índice de fases

| Fase | Nombre | Duración típica | ¿Se puede saltar? |
|------|--------|-----------------|-------------------|
| 0 | Validación de la idea | 1–2 semanas | **Nunca** |
| 1 | Definición de producto (SDD) | 1–2 semanas | **Nunca** |
| 2 | Diseño de arquitectura | 3–5 días | **Nunca** |
| 3 | Sprint de fundación (Sprint 0 + 1) | 1–2 semanas | **Nunca** |
| 4 | Desarrollo de features | Ciclo por sprint | Ongoing |
| 5 | Release | Por versión | Nunca si vas a prod |
| 6 | Operaciones y mejora continua | Perpetuo | Solo si pausas el proyecto |

---

## Fase 0 — Validación de la idea (ANTES de cualquier código o arquitectura)

### Objetivo

Confirmar que el problema existe, que es lo suficientemente doloroso como para que alguien pague por resolverlo, y que tus supuestos más arriesgados tienen evidencia real antes de invertir un solo día en código.

### Inputs

- Una intuición, una frustración personal, o una oportunidad de mercado observada
- Tiempo: 1–2 semanas de conversaciones y research
- Template: `[[idea-brief-template]]` en Obsidian

### Outputs

- **Problem Brief completado:**
  - ¿Quién tiene este problema? (rol, industria, tamaño de empresa)
  - ¿Con qué frecuencia ocurre? (diario / semanal / mensual)
  - ¿Qué tan doloroso es en una escala del 1 al 10?
  - ¿Qué hace hoy la persona para resolverlo? (workaround actual)
- **Research de mercado:**
  - Soluciones existentes y sus limitaciones
  - Categoría del mercado (¿existe? ¿está saturada? ¿es emergente?)
  - Tamaño estimado del mercado (no necesita ser perfecto, solo razonable)
- **3 Personas de usuario** con jobs-to-be-done:
  - Funcional: ¿qué tarea quieren completar?
  - Emocional: ¿cómo quieren sentirse al completarla?
  - Social: ¿cómo quieren ser percibidos por otros al usarla?
- **Hipótesis de monetización:**
  - ¿Quién paga? (usuario final, empresa, marketplace fee)
  - ¿Cuánto pagaría? (benchmark vs alternativas)
  - ¿Por qué ahora? (¿qué cambió en el mercado o en la tecnología?)
- **Supuesto más arriesgado identificado** (The Riskiest Assumption — TRA):
  - ¿Cuál es la suposición que, si es falsa, destruye completamente la idea?
  - Escríbela explícitamente antes de buscar validarla
- **3 entrevistas reales con usuarios** (no supuestos, no encuestas):
  - Personas que representan al cliente objetivo
  - Preguntas sobre el pasado, no sobre el futuro ("¿cuándo fue la última vez que...")
  - Notas textuales de cada entrevista

### Tools / Skills

- `[[idea-brief-template]]` en Obsidian (`~/obsidian/architect-brain/60-Templates/`)
- Notion / Google Docs para notas de entrevistas si se prefiere colaborar con otros
- Stripe Atlas / Lemon Squeezy para validar disposición a pagar (landing + waitlist + CTA de pago)

### Gate: Go / No-Go

**No se avanza a Fase 1 sin cumplir los tres criterios:**

```
[ ] Nivel de dolor >= 7/10 confirmado en entrevistas (no autoevaluado)
[ ] Al menos 2 de 3 entrevistados expresaron disposición a pagar (no solo "sí me gustaría")
[ ] El supuesto más arriesgado tiene evidencia de validación (no solo lógica interna)
```

Si el gate falla: el problema puede ser real pero el timing, el segmento, o la solución están mal. Pivotar la hipótesis y repetir Fase 0, no avanzar.

### Errores comunes

> **Lo que pasó en SaaS Factory:** Se construyeron landing pages de eventos Y demos de catálogos de negocios sin usuarios validados. El arquitecto construyó un sistema de generación de templates con IA antes de tener claridad sobre qué producto vender. Resultado: dos productos a medias, código mezclado, y una sesión de auditoría para limpiar el desorden.

- **Construir antes de validar.** La emoción de codificar es más fuerte que la disciplina de preguntar. La regla es: ninguna línea de código hasta que el gate de Fase 0 esté verde.
- **Enamorarse de la solución.** "Ya sé que el problema existe, tengo años viéndolo." Los sesgos de confirmación son el enemigo. Las entrevistas deben buscar falsificar la hipótesis, no confirmarla.
- **Saltarse "¿quién paga?"** Un producto puede tener usuarios entusiastas y cero disposición a pagar. Validar si el pain es suficiente para abrir la billetera es diferente a validar si el pain existe.
- **Contar con amigos y familia.** Sus respuestas son socialmente sesgadas. Las entrevistas deben ser con extraños que encajan en el perfil de usuario.

---

## Fase 1 — Definición de producto (SDD)

### Objetivo

Traducir el problema validado en un producto concreto: personas claras, un happy path que todos entienden, un feature map priorizado, y un modelo de datos que antecede cualquier código. Este documento es el contrato entre producto, diseño, e ingeniería.

### Inputs

- Problem Brief completado de Fase 0
- 3 entrevistas de usuario con notas
- Gate de Fase 0 en verde

### Outputs

- **Personas de usuario** (al menos 3 roles):
  - Persona primaria: el usuario que usa el producto a diario
  - Persona secundaria: usuario ocasional o stakeholder
  - Anti-persona: explícitamente definida — quién NO es el cliente objetivo y por qué construir para ellos sería un error
- **Jobs-to-be-done por persona:**
  - Funcional, emocional, social para cada persona
  - Mapeado a pain points de las entrevistas de Fase 0
- **Happy Path Flow** (ASCII, 5–10 pasos):
  ```
  [Usuario llega] -> [Ve propuesta de valor] -> [Se registra]
       -> [Completa onboarding] -> [Realiza acción core]
       -> [Ve resultado de valor] -> [Vuelve mañana]
  ```
  - El happy path define el núcleo del producto. Si no cabe en 10 pasos, el producto es demasiado complejo para MVP.
- **Feature Map con MoSCoW:**
  ```
  Must (MVP sin esto no funciona):
    - [Feature]
  Should (importante, pero el MVP puede vivir sin esto 2 semanas):
    - [Feature]
  Could (nice to have, Sprint 3+):
    - [Feature]
  Won't (explícitamente fuera del scope ahora):
    - [Feature]
  ```
- **Diagrama Entidad-Relación** (ANTES de escribir tipos TypeScript — esta es la regla):
  - Entidades principales con atributos
  - Relaciones y cardinalidades
  - Herramienta: draw.io, Mermaid, o papel fotografiado
  - El ER debe revisarse con alguien que no escribió el código
- **Sketch de contratos API** (lista de endpoints, no OpenAPI completo todavía):
  ```
  POST   /api/auth/register
  GET    /api/apps
  POST   /api/apps
  GET    /api/apps/:id
  PUT    /api/apps/:id/publish
  DELETE /api/apps/:id
  ```
- **Requisitos no funcionales:**
  - LCP target (ej. < 2.5s en conexión 4G)
  - Requisitos de seguridad (autenticación, autorización, datos sensibles)
  - Expectativas de escala (usuarios concurrentes, volumen de datos en Año 1)
  - SLA objetivo si aplica
- **Wireframes ASCII para cada superficie:**
  ```
  Dashboard:
  +----------------------------------+
  | [Logo]          [User] [Logout]  |
  +----------------------------------+
  | [+ New App]                      |
  | +--------+  +--------+           |
  | | App 1  |  | App 2  |           |
  | | Active |  | Draft  |           |
  | +--------+  +--------+           |
  +----------------------------------+
  ```

### Tools / Skills

- Obsidian para el SDD (Software Design Document)
- draw.io o Mermaid para diagramas
- Figma solo si hay diseñador en el equipo; si no, ASCII es suficiente para el SDD
- `[[SDD-template]]` en Obsidian

### Gate: Go / No-Go

**No se avanza a Fase 2 sin aprobación explícita de todos los stakeholders en:**

```
[ ] Persona primaria + secundaria + anti-persona definidas
[ ] Happy path revisado y aprobado (todos deben poder dibujarlo sin ver el doc)
[ ] Feature map con Must/Should/Could/Won't aprobado
[ ] ER diagram revisado por al menos una persona que no lo escribió
[ ] Requisitos no funcionales acordados
```

### Errores comunes

> **Lo que pasó en SaaS Factory:** Los tipos TypeScript (`AppConfig`, `AppTheme`) fueron escritos antes de tener un ER diagram. Esto creó un modelo de datos que reflejaba conveniencia de implementación en lugar de la realidad del dominio. Cuando la arquitectura fue auditada, los tipos tuvieron que ser reconciliados con el modelo de negocio real.

- **TypeScript antes del ER.** Los tipos de datos de programación no son el modelo de dominio. El ER diagram fuerza pensar en entidades, relaciones, y cardinalidades sin el ruido de la sintaxis de lenguaje.
- **Features "Could" en Sprint 1.** La presión de mostrar avance lleva a incluir features que "quedan bien en el demo" pero que no son parte del happy path. El MVP debe ser incómodo de mostrar — si no da un poco de vergüenza, no es suficientemente mínimo.
- **No definir la anti-persona.** Sin anti-persona explícita, cada feature request de cada usuario potencial parece legítimo. La anti-persona es el filtro que mantiene el foco del producto.

---

## Fase 2 — Diseño de arquitectura

### Objetivo

Diseñar el sistema técnico que implementará el producto definido en Fase 1. Cada decisión arquitectónica importante debe estar documentada con alternativas consideradas, trade-offs evaluados, y una opción elegida con justificación.

### Inputs

- SDD completado de Fase 1
- Gate de Fase 1 en verde
- Template: `[[ADR-template]]` en Obsidian

### Outputs

- **C4 Level 1 — System Context:**
  - El sistema como caja negra
  - Actores externos (usuarios, sistemas terceros, servicios de pago)
  - Relaciones de comunicación entre actores y el sistema
- **C4 Level 2 — Container diagram:**
  - Contenedores del sistema (frontend, backend, base de datos, servicios externos)
  - Tecnologías de cada contenedor
  - Protocolos de comunicación entre contenedores
- **ADR por cada decisión mayor** (mínimo uno por cada categoría):
  - Tech stack (framework frontend, framework backend)
  - Base de datos (SQL vs NoSQL, proveedor específico)
  - Autenticación (JWT, OAuth, sessions, proveedor)
  - Deployment (contenedores, serverless, cloud provider, región)
  - Observabilidad (logging, metrics, tracing, alerting)
  - Estructura del repositorio (monorepo vs polyrepo, herramienta)

  Formato de cada ADR:
  ```markdown
  # ADR-NNN: [Título]

  **Estado:** Accepted | Proposed | Deprecated | Superseded
  **Fecha:** YYYY-MM-DD
  **Contexto:** ¿Qué situación requiere esta decisión?
  **Opciones consideradas:**
    1. Opción A — pros / cons
    2. Opción B — pros / cons
    3. Opción C — pros / cons
  **Decisión:** Opción X
  **Justificación:** ¿Por qué esta opción sobre las demás?
  **Consecuencias:** ¿Qué se vuelve más fácil? ¿Qué se vuelve más difícil?
  ```

- **SPIKE: prueba desechable para el riesgo técnico más alto** (máximo 1 día):
  - Identificar la suposición técnica más arriesgada (ej. "Nuxt 4 + Module Federation funcionan juntos")
  - Escribir el objetivo del spike antes de empezar: "Probar que X es posible con Y"
  - Tiempo box: máximo 8 horas
  - Output: sí/no con evidencia — el código del spike se descarta después
  - Si el spike falla: revisar el ADR correspondiente y elegir la siguiente opción
- **Definición de estructura del monorepo:**
  ```
  apps/
    admin/       — aplicación principal
    template/    — app spawnable por tenant
  packages/
    core/        — tipos y utils compartidos
    ui/          — component library
  infrastructure/
    k8s/         — manifiestos kubernetes
    terraform/   — infraestructura como código
  docs/
    architecture/decisions/   — ADRs
    workflow/
    interview/
  ```
- **Definición de Gitflow:**
  - Branch principal: `main` (solo merges desde `release/*`)
  - Branch de integración: `develop`
  - Feature branches: `feature/TICKET-descripcion`
  - Release branches: `release/vX.Y.Z`
  - Hotfix branches: `hotfix/descripcion`
  - Branch protection rules en `main` y `develop`
- **Modelo FinOps:**
  - Costo estimado por 100 usuarios activos
  - Costo estimado por 1,000 usuarios activos
  - Costo estimado por 10,000 usuarios activos
  - Threshold para alertas de budget (ej. 80% del presupuesto mensual)
  - Estrategia de escala horizontal vs vertical
- **Modelo de amenazas de seguridad** (simplificado):
  - STRIDE para cada componente principal
  - Amenazas priorizadas por probabilidad x impacto
  - Controles propuestos para amenazas de riesgo alto

### Tools / Skills

- draw.io o Structurizr para diagramas C4
- `[[ADR-template]]` en Obsidian
- GCP Cost Calculator / AWS Pricing Calculator para el modelo FinOps
- OWASP Threat Dragon para el threat model

### Gate: Go / No-Go

```
[ ] Todos los ADRs escritos y revisados
[ ] Spike ejecutado y demuestra viabilidad del riesgo técnico más alto
[ ] Modelo de costo validado: costo proyectado <= presupuesto target
[ ] Threat model completado con controles para riesgos altos
[ ] C4 Level 1 y Level 2 revisados y aprobados
```

### Errores comunes

> **Lo que pasó en SaaS Factory:** Se consideró Module Federation (MFE) para una aplicación con 0 usuarios. El overhead de configuración de Module Federation con Nuxt 4 era significativo y la combinación era suficientemente nueva para necesitar un spike antes de comprometerse. No hubo un spike formal, y la decisión quedó ambigua por semanas.

- **MFE / microservicios para 0 usuarios.** La complejidad operacional de una arquitectura distribuida existe desde el día 1, pero los beneficios (escala independiente, equipos independientes) solo aparecen a partir de cierto volumen. La regla: empezar con el monolito modular más simple que funcione. Extraer cuando el dolor de la deuda sea medible.
- **No hacer el spike antes de comprometerse.** Un supuesto técnico no probado es una bomba de tiempo. El spike de 1 día cuesta infinitamente menos que descubrir la incompatibilidad en Sprint 3.
- **No tener modelo de costo.** Los costos de nube son invisibles hasta que llega la factura. El modelo FinOps no necesita ser exacto — necesita revelar el orden de magnitud.

---

## Fase 3 — Sprint de fundación (Sprint 0 + 1)

### Objetivo

Construir el esqueleto del sistema: la infraestructura, el pipeline de CI/CD, los bloques de construcción reutilizables, y los controles de calidad que gobernarán todo el desarrollo futuro. Nada de features reales todavía — solo los cimientos.

### Inputs

- Arquitectura aprobada de Fase 2
- ADRs completos
- Spike exitoso

### Outputs

- **Monorepo scaffoldeado** con la estructura definida en Fase 2:
  - `package.json` en root con workspaces configurados
  - `pnpm-workspace.yaml` (o equivalente)
  - `tsconfig.json` base y tsconfigs por paquete
  - `.eslintrc` / `biome.json` con reglas acordadas
  - `.prettierrc` (si se usa Prettier)
- **CI/CD que falla a propósito** (prueba que el pipeline funciona):
  - GitHub Actions workflow con: install → typecheck → lint → test → build
  - El pipeline debe fallar en al menos un paso en el commit inicial (prueba que los checks están activos)
  - Branch protection en `main`: require PR, require CI green, require review
- **Paquete de design tokens:**
  ```
  packages/
    tokens/
      src/
        colors.ts
        typography.ts
        spacing.ts
        breakpoints.ts
      index.ts
  ```
  - Colores de marca, tipografía base, espaciado, breakpoints
  - Exportados como variables CSS y como constantes TypeScript
- **Component library con Storybook:**
  - Storybook configurado en `packages/ui/`
  - Al menos 3 componentes base documentados: Button, Input, Card
  - Stories para cada estado: default, hover, disabled, error
  - Deploy de Storybook a GitHub Pages o Chromatic
- **Auth middleware skeleton** (retorna 401 siempre, implementación viene después):
  ```typescript
  // server/middleware/auth.ts
  export default defineEventHandler((event) => {
    // TODO: implement Firebase JWT validation
    // For now, always reject to prove middleware is active
    throw createError({ statusCode: 401, message: 'Not implemented' })
  })
  ```
  - El objetivo es tener el hook de autenticación en el lugar correcto desde el inicio, no implementarlo todavía
- **Logging estructurado** en todos los servicios:
  ```typescript
  // Cada log debe tener: timestamp, level, service, correlationId, message, metadata
  logger.info({ service: 'api', correlationId, userId }, 'App created')
  ```
- **Health endpoint** en cada servicio:
  ```
  GET /health -> { status: 'ok', version: '0.1.0', timestamp: '...' }
  ```
- **Branch protection rules** configuradas en GitHub/GitLab

### Definition of Done para Fase de Fundación

**El Sprint de Fundación no está completo hasta que:**

```
[ ] CI pipeline verde en el último commit de develop
[ ] Auth middleware retorna 401 (prueba que el middleware está activo)
[ ] Design tokens visibles en Storybook
[ ] pnpm typecheck pasa sin errores
[ ] pnpm lint pasa sin errores
[ ] Health endpoint responde en todos los servicios
[ ] Branch protection activa en main y develop
[ ] README con instrucciones de setup funciona desde cero (clone -> funciona)
```

### Errores comunes

- **Saltarse la fundación para "llegar a features más rápido."** Esta es la trampa más seductora. La fundación parece lenta pero previene meses de deuda técnica. Sin CI, los bugs se descubren en producción. Sin design tokens, los colores se hardcodean. Sin auth skeleton, la autenticación se agrega "al final" y nunca se hace bien.
- **Storybook como afterthought.** Si se agrega después de tener 50 componentes, documentarlos es una tarea enorme que nunca se hace. Desde el primer componente.
- **CI que solo corre en main.** El CI debe correr en cada PR. Si solo corre en main, los bugs llegan a main antes de detectarse.

---

## Fase 4 — Desarrollo de features (ciclo por sprint)

### Objetivo

Implementar features de forma sostenible: validadas antes de empezar, probadas antes de mergear, y revisadas antes de considerar done.

### Definition of Ready (DoR) — Gate antes de empezar cualquier historia

**Una historia NO puede comenzar sin:**

```
[ ] Escenarios Gherkin escritos y revisados por al menos una persona
[ ] Contrato API finalizado (si la historia toca una API)
[ ] Wireframe o referencia de diseño existe (puede ser ASCII)
[ ] Dependencias técnicas resueltas (no hay blockers conocidos)
[ ] Estimación acordada por el equipo
[ ] Criterios de aceptación claros y verificables
```

Si algún checkbox está vacío, la historia vuelve al backlog hasta que esté lista.

### Ciclo de desarrollo por historia

**Paso 1 — Gherkin (BDD)**

```gherkin
Feature: Generación de demo de aplicación

  Scenario: Admin genera demo exitosamente
    Given que soy un admin autenticado
    And que existe un negocio con slug "tacos-el-rey"
    When envío POST /api/apps/generate con { businessId: "tacos-el-rey" }
    Then recibo status 202
    And se crea un job de generación
    And recibo un SSE stream con progreso

  Scenario: Generación falla sin autenticación
    Given que no estoy autenticado
    When envío POST /api/apps/generate
    Then recibo status 401
    And no se crea ningún job
```

**Paso 2 — Test en rojo (TDD)**

Escribir el test antes de la implementación. El test debe fallar.

```typescript
describe('POST /api/apps/generate', () => {
  it('returns 401 without authentication', async () => {
    const response = await $fetch('/api/apps/generate', { method: 'POST' })
    expect(response.status).toBe(401)
  })

  it('creates a generation job for authenticated admin', async () => {
    const response = await $fetch('/api/apps/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { businessId: 'tacos-el-rey' }
    })
    expect(response.status).toBe(202)
    expect(response.body.jobId).toBeDefined()
  })
})
```

**Paso 3 — Implementar (verde)**

Escribir el código mínimo para que los tests pasen. No más.

**Paso 4 — Refactorizar (mantener tests verdes)**

Mejorar la implementación sin cambiar el comportamiento. Los tests son la red de seguridad.

**Paso 5 — /simplify skill**

Ejecutar el skill `/simplify` para revisar:
- ¿Hay código duplicado que puede reutilizarse?
- ¿La abstracción está al nivel correcto?
- ¿Hay complejidad innecesaria?

**Paso 6 — /security-scan skill**

Ejecutar el skill `/security-review` para revisar:
- ¿Hay inputs sin validar?
- ¿Hay endpoints sin autenticación?
- ¿Hay secrets hardcodeados?
- ¿Hay vulnerabilidades de inyección?

**Paso 7 — /code-review skill**

PR review checklist:
```
[ ] Tests pasan (CI verde)
[ ] Gherkin scenarios cubiertos por tests
[ ] No hay TODOs sin ticket asociado
[ ] Logging estructurado en paths importantes
[ ] Manejo de errores explícito (no catch vacíos)
[ ] PR <= 400 líneas (si es mayor, dividir)
[ ] Migraciones de base de datos son backward-compatible
```

**Paso 8 — Merge a develop (CI debe estar verde)**

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/TICKET-descripcion
git push origin develop
```

**Paso 9 — Auto-deploy a dev**

El merge a `develop` dispara automáticamente el deploy al ambiente de desarrollo.

**Paso 10 — QA en dev**

El QA verifica los Gherkin scenarios en el ambiente real. Si pasan → historia Done. Si no → vuelve al desarrollador con evidencia específica.

### Definition of Done por historia

```
[ ] Todos los Gherkin scenarios pasan en el ambiente de dev
[ ] CI verde: typecheck + lint + tests + build
[ ] Code review aprobado por al menos 1 persona
[ ] No hay regresiones en features existentes
[ ] Documentación actualizada si se cambió una API pública
[ ] Métricas de observabilidad funcionando (logs aparecen en el dashboard)
```

### Errores comunes

- **Escribir código antes del Gherkin.** El Gherkin obliga a pensar en el comportamiento esperado antes de la implementación. Sin él, el código define el comportamiento en lugar de ser guiado por él.
- **"Agrego los tests después."** Los tests escritos después tienden a ser tests de caja blanca que prueban la implementación, no el comportamiento. Los tests escritos antes prueban lo que importa.
- **PRs de más de 400 líneas.** Un PR grande es imposible de revisar bien. Si una historia requiere más de 400 líneas de cambios, dividir en sub-tareas.
- **Mezclar refactoring con features en el mismo PR.** Son contextos diferentes. El refactoring va en un PR separado.

---

## Fase 5 — Release

### Objetivo

Llevar código probado de `develop` a producción de forma controlada, con capacidad de rollback automático ante problemas.

### Proceso de release

```
develop -> release/vX.Y.Z -> main (tag) -> producción
```

#### Checklist pre-release (todos los checkboxes deben estar marcados)

**Calidad:**
```
[ ] pnpm typecheck pasa sin errores
[ ] pnpm lint pasa sin errores
[ ] Todos los tests pasan
[ ] pnpm build:all completa sin errores
[ ] No hay TODOs críticos en el código nuevo
```

**Seguridad:**
```
[ ] No hay secrets en el código (git-secrets scan limpio)
[ ] Dependencias sin vulnerabilidades críticas (pnpm audit)
[ ] /security-review completado para los cambios del release
```

**Documentación:**
```
[ ] CHANGELOG.md actualizado
[ ] APIs nuevas o modificadas documentadas
[ ] ADRs creados para decisiones arquitectónicas del release
[ ] Runbook actualizado si hay cambios en la operación
```

**Infraestructura:**
```
[ ] Migraciones de base de datos testeadas en staging
[ ] Variables de entorno de producción verificadas
[ ] Rollback plan documentado para este release
[ ] Alertas de monitoreo configuradas para los nuevos features
```

#### Canary deployment

```
Estrategia: canary antes de full rollout

Paso 1: Deploy al 10% del tráfico
  - Monitorear por 10 minutos
  - Métrica de éxito: error rate < 0.1%
  - Trigger de rollback: error rate > 1%

Paso 2: Si Paso 1 OK -> 100% del tráfico
  - Monitorear por 30 minutos post-rollout
  - Dashboard de métricas activo

Paso 3: Si Paso 2 OK -> cerrar release
  - Tag en git: vX.Y.Z
  - Cerrar branch release/vX.Y.Z
  - Merge back a develop si hubo hotfixes en el release branch
```

#### Triggers de rollback automático

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| Error rate HTTP 5xx | > 1% por 5 min | Rollback automático |
| P99 latency | > 3s por 5 min | Alerta + revisión manual |
| Error rate de AI endpoint | > 5% | Alerta + revisión manual |
| Costo de Cloud | > $3/día | Alerta + revisión manual |

#### Proceso de hotfix

```bash
# Para bugs críticos en producción
git checkout main
git checkout -b hotfix/descripcion-del-bug

# Fix mínimo, solo lo necesario para resolver el bug
# Tests para el caso específico que falló
# CI debe pasar

git checkout main
git merge --no-ff hotfix/descripcion-del-bug
git tag vX.Y.Z-hotfix-1

git checkout develop
git merge --no-ff hotfix/descripcion-del-bug
git branch -d hotfix/descripcion-del-bug
```

---

## Fase 6 — Operaciones y mejora continua

### Objetivo

Mantener el sistema saludable, el equipo aprendiendo, y la deuda técnica controlada. Las operaciones no son "cuando algo se rompe" — son una cadencia proactiva.

### Cadencia semanal

Cada semana:
```
[ ] Revisar dashboard de métricas: error rates, latencies, costos
[ ] Revisar alertas disparadas en la semana
[ ] Revisar logs de errores (top 10 errores por frecuencia)
[ ] Sprint review + sprint planning
[ ] Actualizar backlog de deuda técnica
```

### Cadencia mensual

Cada mes:
```
[ ] Revisión de costos de nube: ¿hay servicios inesperadamente caros?
[ ] Revisión de dependencias: ¿hay actualizaciones de seguridad pendientes?
[ ] Revisión de métricas de producto: ¿el producto está siendo usado como esperamos?
[ ] Architecture fitness functions: ¿las constraints arquitectónicas siguen cumpliéndose?
[ ] Revisión de deuda técnica: priorizar al menos 1 item para el próximo sprint
[ ] Actualizar STAR stories en Obsidian con aprendizajes del mes
```

### Cadencia trimestral

Cada trimestre:
```
[ ] Revisión de ADRs: ¿alguna decisión necesita revisarse con nueva información?
[ ] DR drill: simular la pérdida del servicio principal y practicar recovery
[ ] Revisión de postura de seguridad: penetration test básico
[ ] Revisión de costos vs crecimiento: ¿el modelo FinOps sigue siendo válido?
[ ] Tech debt sprint: un sprint dedicado exclusivamente a deuda técnica
[ ] Retrospectiva de arquitectura con el equipo
```

### Architecture Fitness Functions

Las fitness functions son pruebas automatizadas que verifican que las constraints arquitectónicas se mantienen:

```typescript
// Ejemplo: ningún paquete de apps/ puede importar desde otro paquete de apps/
// (la comunicación va a través de packages/core o APIs)
describe('Architecture constraints', () => {
  it('apps/admin-fe does not import from apps/template', () => {
    const imports = getImportsFrom('apps/admin-fe/')
    expect(imports).not.toContain('apps/template')
  })

  it('packages/core does not import from apps/', () => {
    const imports = getImportsFrom('packages/core/')
    const appImports = imports.filter(i => i.startsWith('apps/'))
    expect(appImports).toHaveLength(0)
  })
})
```

### DR Drills

Un drill de disaster recovery cada trimestre:

1. **Objetivo del drill:** "Restaurar el servicio después de [escenario específico]"
2. **Escenarios rotativos:**
   - Base de datos inaccesible por 30 minutos
   - Deploy fallido que no puede revertirse con rollback normal
   - Secrets comprometidos (rotación de emergencia)
   - Cloud provider outage en la región principal
3. **Documentar:** tiempo de detección, tiempo de recuperación, gaps encontrados
4. **Actualizar runbook** con lo aprendido en el drill

---

## El antídoto al desorden

### Antes de escribir una sola línea de código, verifica:

> Este checklist se ejecuta al inicio de CUALQUIER proyecto nuevo. No es opcional. Cada checkbox no marcado es un riesgo explícito que el equipo está aceptando conscientemente.

---

**Validación del problema (Fase 0):**
```
[ ] Tengo un problem brief escrito (no solo en mi cabeza)
[ ] El nivel de dolor del problema es >= 7/10 confirmado por personas reales
[ ] Entrevisté a al menos 3 personas que representan al cliente objetivo
[ ] Al menos 2 de 3 dijeron que pagarían por una solución
[ ] Identifiqué y validé el supuesto más arriesgado
[ ] Sé quién paga y cuánto pagaría (no solo quién usa el producto)
```

**Definición de producto (Fase 1):**
```
[ ] Tengo una persona primaria, secundaria, y anti-persona definidas
[ ] Tengo un happy path de <= 10 pasos que todos en el equipo pueden dibujar
[ ] Tengo un feature map con Must/Should/Could/Won't aprobado
[ ] Tengo un ER diagram (no tipos TypeScript — un ER diagram)
[ ] Tengo wireframes (ASCII está bien) para cada superficie del MVP
[ ] Los requisitos no funcionales están acordados
```

**Arquitectura (Fase 2):**
```
[ ] Tengo un ADR para cada decisión técnica mayor (stack, DB, auth, deploy)
[ ] Hice un spike para el riesgo técnico más alto (máximo 1 día de trabajo)
[ ] Tengo un modelo de costo: ¿cuánto cuesta con 100 / 1,000 / 10,000 usuarios?
[ ] Tengo un modelo de amenazas básico
[ ] La arquitectura que estoy eligiendo es la más simple que resuelve el problema
```

**Fundación (Fase 3):**
```
[ ] El monorepo está scaffoldeado según la estructura del ADR
[ ] CI/CD está configurado y falla en al menos un check (prueba que funciona)
[ ] Branch protection está activa en main y develop
[ ] Auth middleware skeleton está en su lugar (retorna 401)
[ ] Design tokens y component library base están en Storybook
[ ] pnpm typecheck y pnpm lint pasan desde el primer commit
```

**La pregunta final antes de empezar:**

> *¿Si este proyecto fracasa en 3 meses, cuál será la razón más probable?*
>
> Escribe la respuesta. Esa es tu próxima acción de mitigación.

---

*Documento creado a partir de la auditoría post-mortem del proyecto SaaS Factory, Mayo 2026. Vive en `docs/workflow/idea-to-dev.md` y en `~/obsidian/architect-brain/20-Patterns/workflow/`.*
