# Custom Skills y Sub-Agents — SaaS Factory

> Este documento define los custom Claude Code skills y los patrones de sub-agentes para el proyecto SaaS Factory. Cada skill automatiza una tarea repetible que actualmente requiere esfuerzo manual sostenido. Los sub-agent patterns definen cómo coordinar múltiples agentes en un sprint para maximizar el paralelismo sin producir conflictos de merge.

---

## Sección 1: Qué son los custom skills en Claude Code

Los Claude Code skills son archivos markdown que codifican expertise para tareas repetibles dentro de un proyecto. Se invocan con `/nombre-del-skill` directamente en la interfaz de Claude Code. Cuando ejecutas `/sprint-start 1`, el CLI busca el archivo de skill correspondiente en las rutas conocidas, lo carga como contexto del sistema, y ejecuta el agente con ese contexto enriquecido y las instrucciones precisas del skill.

### Dónde viven los skill files

**Project-local skills** — disponibles solo en este proyecto:
```
.claude/skills/{skill-name}.md
```

**Global skills** — disponibles en todos los proyectos de la máquina:
```
~/.claude/skills/{skill-name}.md
```

Los skills de SaaS Factory son project-local. Viven en `.claude/skills/` y se versionan con el repositorio en `develop`. Cualquier agente o engineer que clone el repo tiene acceso a los mismos skills sin configuración adicional. Esto es intencional: los skills no son configuración personal — son parte de la infraestructura del proyecto, tan importantes como el `nuxt.config.ts` o el `pnpm-workspace.yaml`.

### Qué puede hacer un skill

Un skill puede hacer cualquier cosa que Claude Code puede hacer directamente: leer archivos del repositorio, ejecutar comandos bash (typecheck, lint, test, git), escribir o modificar código, crear branches de git, buscar patrones en el codebase, y — crucialmente — spawnar sub-agentes con contexto específico para tareas paralelas.

La diferencia entre un skill y un prompt manual es la encapsulación. Un skill bien diseñado captura:
- El contexto del proyecto que el agente necesita (estructura de carpetas, convenciones, archivos de referencia)
- La secuencia exacta de pasos para completar la tarea
- Los criterios de validación para saber que terminó correctamente
- Los casos de error más comunes y cómo manejarlos

Un skill bien diseñado convierte una tarea de 15 prompts iterativos en una sola invocación con input mínimo. La diferencia en tiempo es de 45 minutos a 5 minutos para tareas como abrir un sprint o escribir un ADR.

### Taxonomía de skills en este proyecto

| Categoría | Skill | Invocación | Frecuencia de uso |
|-----------|-------|-----------|-------------------|
| Sprint lifecycle | sprint-start | `/sprint-start N` | Una vez al iniciar cada sprint |
| Sprint lifecycle | sprint-review | `/sprint-review N` | Una vez al cerrar cada sprint |
| Architecture | adr-write | `/adr-write "decisión"` | Cada decisión costosa de revertir |
| Architecture | fitness-check | `/fitness-check` | Antes de cada MR a develop |
| Development | gherkin-to-test | `/gherkin-to-test "feature"` | Al inicio de cada historia con Gherkin |
| FinOps | cost-check | `/cost-check "cambio propuesto"` | Antes de agregar cualquier servicio GCP |
| Career | star-story | `/star-story "tema"` | Preparación de entrevistas |

---

## Sección 2: Los 7 custom skills de este proyecto

---

### Skill 1: `/sprint-start N`

**Propósito:** Crea el branch del sprint desde develop, lee el sprint file completo, extrae los todo items, identifica los agentes de la sección "Agentes asignados", los spawnea con el contexto correcto, y reporta el estado inicial del sprint.

**Input:** Número de sprint.
```
/sprint-start 0
/sprint-start 1
/sprint-start 3
```

**Qué hace el skill, paso a paso:**

1. Lee `docs/planning/sprints/sprint-{N}-*.md` — el glob `*` captura el nombre descriptivo del sprint (ej: `sprint-0-cleanup-sdd.md`). Si existe más de un archivo que coincide, reporta el conflicto y pide al usuario seleccionar el correcto antes de continuar.

2. Extrae y verifica las pre-conditions del sprint. Si el sprint file incluye una sección `## Pre-conditions` (por ejemplo: "el MR del sprint anterior debe estar mergeado a develop"), ejecuta los checks correspondientes: `git log develop --oneline -5`, estado de PRs abiertos con `gh pr list`. Si una pre-condition falla, reporta qué falla y se detiene — no crea el branch.

3. Lee el campo `**Branch:**` del sprint file y ejecuta `git checkout -b sprint/{N}-{name} develop`. Si el branch ya existe, verifica si hay trabajo en progreso (`git log HEAD...develop --oneline`) y reporta el estado sin sobreescribir.

4. Crea items de TodoWrite a partir de la task list del sprint. Cada tarea del sprint file se convierte en un todo item. El prefijo del todo item es el agente asignado extraído de la sección `## Agentes asignados` del sprint file.

5. Lee la sección `## Agentes asignados` del sprint file para identificar: qué agentes existen, en qué orden deben iniciar (secuencial o paralelo), y qué contexto específico necesita cada uno. Esta sección define si el patrón es Paralelo Independiente, Secuencial-Luego-Paralelo, Solo en Worktree, o Shell + Remote.

6. Spawnea los agentes con el contexto correcto. A cada agente le pasa: el sprint file completo, los archivos específicos de su área de responsabilidad, las instrucciones de coordinación (por ejemplo: "no modifiques `packages/core/src/index.ts` hasta que cleanup-agent haya commiteado su rama de trabajo"), y el DoD del sprint.

7. Reporta: branch creado, agentes spawneados con sus áreas de responsabilidad, lista de tareas en TodoWrite, pre-conditions verificadas.

**Ejemplo de invocación:**
```
/sprint-start 0
```

Salida esperada:
```
Branch sprint/0-cleanup-sdd creado desde develop (HEAD: a4c7f21)

Pre-conditions verificadas:
  ✓ No hay sprint branches abiertos en el repositorio
  ✓ develop está en sync con origin/develop

Agentes spawneados (paralelo independiente):
  - cleanup-agent: elimina docs obsoletos y código de event-domain
    Archivos en scope: docs/architecture/*, docs/development/*, packages/core/src/types/app.ts
  - types-agent: reescribe tipos para el dominio catalog
    Archivos en scope: packages/core/src/types/* (solo creación, no eliminación)

Regla de coordinación: cleanup-agent modifica packages/core/src/index.ts primero.
types-agent solo actualiza el barrel con los nuevos exports después del commit de cleanup-agent.

Tareas creadas: 14 items en TodoWrite
```

**Archivo del skill:** `.claude/skills/sprint-start.md`

---

### Skill 2: `/sprint-review N`

**Propósito:** Lee el DoD checklist del sprint file, corre los comandos de verificación del sprint (`pnpm typecheck`, `pnpm lint`, `pnpm test`), compara el estado del repositorio contra cada item del DoD, genera la descripción del MR desde los objetivos del sprint, y reporta qué está completo y qué falta.

**Input:** Número de sprint.
```
/sprint-review 0
/sprint-review 1
```

**Qué hace el skill, paso a paso:**

1. Lee el sprint file completo (`docs/planning/sprints/sprint-{N}-*.md`) para obtener: la sección `## Definition of Done`, la sección `## Verification Commands`, y la sección `## MR Template`.

2. Corre los comandos de verificación del sprint en secuencia, capturando el exit code y el output de cada uno:
   - `pnpm typecheck` — debe salir con exit code 0. Si falla, reporta los errores de TypeScript específicos.
   - `pnpm lint` — debe salir con exit code 0. Si falla, lista los archivos con errores de linting.
   - `pnpm test` si el sprint incluye tests — debe salir con exit code 0. Lista los tests que fallan si hay alguno.
   - Cualquier comando de grep específico del sprint (por ejemplo: `grep -r "AppTopic" packages/ --include="*.ts"` para verificar que todos los usos del tipo eliminado fueron actualizados).

3. Itera sobre cada item del DoD checklist del sprint file y verifica su estado:
   - Para items que requieren verificar ausencia de un archivo: `ls {path}` y verifica que no existe.
   - Para items que requieren verificar presencia de un archivo: `ls {path}` y verifica que existe.
   - Para items que requieren verificar contenido (por ejemplo: "el barrel export de packages/core/src/index.ts no exporta BusinessStatus"): lee el archivo y verifica el contenido.
   - Para items que requieren verificar comportamiento lógico y no hay test automatizado: describe el paso de verificación manual con instrucciones exactas.

4. Genera el reporte del DoD: cada item con un checkmark verde (cumplido) o una X roja (faltante). Para los items faltantes, incluye la descripción exacta de qué falta y el comando o pasos para completarlo.

5. Si todos los items del DoD están cumplidos, genera la descripción del MR usando el template del sprint file como estructura base. Enriquece el template con datos reales: output del typecheck (número de archivos verificados), output del lint (número de warnings resueltos), lista de archivos modificados desde el branch base.

6. Si hay items faltantes, reporta el veredicto: "DoD incompleto — {N} items pendientes" y lista los pasos para completarlos antes de abrir el MR.

**Ejemplo de invocación:**
```
/sprint-review 0
```

Salida esperada:
```
## Sprint 0 Review — Definition of Done

Verification commands:
  ✓ pnpm typecheck: exit code 0 (47 archivos verificados, 0 errores)
  ✓ pnpm lint: exit code 0 (0 warnings en 23 archivos)

DoD checklist:
  ✓ docs/architecture/backend.md eliminado
  ✓ docs/architecture/microservices.md eliminado
  ✓ packages/core/src/types/app.ts eliminado
  ✓ packages/core/src/types/business.ts creado con BusinessStatus, BusinessTier
  ✓ packages/core/src/index.ts actualizado — no exporta tipos de event-domain
  ✓ AppTopic no existe en ningún archivo .ts del repositorio
  ✗ validateTransition('active', 'demo') debería retornar true — no verificado (sin test automatizado)

Veredicto: 1 item pendiente.
Acción requerida: verificar manualmente en la consola:
  cd packages/core && node -e "const {validateTransition} = require('./src'); console.log(validateTransition('active', 'demo'))"

Descripción del MR generada y lista para copiar (ver abajo).
```

**Archivo del skill:** `.claude/skills/sprint-review.md`

---

### Skill 3: `/adr-write "decision description"`

**Propósito:** Lista los ADRs existentes para obtener el siguiente número disponible, guía la captura del contexto completo de la decisión, crea el archivo `docs/architecture/decisions/ADR-N-slug.md` con el template completo (Context, Decision, Consequences, Alternatives, Spike required?), y agrega la entrada al `index.md`.

**Input:** Descripción breve de la decisión en lenguaje natural.
```
/adr-write "usar Firestore en lugar de PostgreSQL"
/adr-write "elegir Module Federation sobre monolito modular"
/adr-write "adoptar Gitflow en lugar de trunk-based development"
/adr-write "usar Cloud Run en lugar de GKE para el deployment"
```

**Qué hace el skill, paso a paso:**

1. Lista todos los archivos en `docs/architecture/decisions/ADR-*.md` para determinar el siguiente número disponible. Si la carpeta no existe, la crea junto con el `index.md` con la estructura base.

2. Parsea el input para extraer el núcleo de la decisión: qué se elige y, si está implícito en la redacción, qué se descarta. "usar Firestore en lugar de PostgreSQL" → elegido: Firestore, descartado: PostgreSQL.

3. Presenta un cuestionario interactivo (hace cada pregunta y espera la respuesta antes de continuar):
   - "¿Cuál es el problema concreto que esta decisión resuelve? (No el 'qué', sino el 'por qué ahora')"
   - "¿Qué restricciones existen que limitan las opciones? (costo, tiempo, expertise del equipo, compliance)"
   - "¿Cuáles son las consecuencias positivas esperadas de esta decisión?"
   - "¿Cuáles son las consecuencias negativas o trade-offs conocidos?"
   - "¿Qué alternativas se evaluaron seriamente? (Para cada una: nombre, pros, contras, razón de descarte)"
   - "¿Esta decisión requiere un spike de validación? Si sí, ¿cuál es la pregunta específica del spike?"
   - "¿Cuándo debería revisitarse esta decisión? (trigger específico, no fecha)"

4. Con las respuestas del cuestionario, escribe el ADR completo usando la plantilla estándar:
   ```markdown
   # ADR-N: Título Descriptivo

   **Fecha:** YYYY-MM-DD
   **Estado:** Propuesto

   ## Contexto
   [Problema concreto + restricciones]

   ## Decisión
   [Qué se decide hacer]

   ## Consecuencias positivas
   [Lista con viñetas]

   ## Consecuencias negativas y trade-offs
   [Lista con viñetas]

   ## Riesgos identificados
   [Lista con viñetas]

   ## Alternativas consideradas

   ### Alternativa: [nombre]
   **Pros:** ...
   **Contras:** ...
   **Por qué no se eligió:** ...

   ## Spike requerido
   [Sí/No. Si sí: pregunta específica del spike y resultado esperado]

   ## Cuándo revisitar esta decisión
   [Trigger específico]
   ```

5. Guarda el archivo como `docs/architecture/decisions/ADR-{N}-{slug}.md`. El slug se genera del título: lowercase, guiones, máximo 5 palabras significativas. Ejemplo: "usar Firestore en lugar de PostgreSQL" → `firestore-over-postgresql`.

6. Actualiza `docs/architecture/decisions/index.md` agregando una fila a la tabla con: número, título, fecha, estado ("Propuesto"), y link al archivo.

7. Confirma: "ADR-{N} creado en `docs/architecture/decisions/ADR-{N}-{slug}.md` y registrado en el index. Estado: Propuesto. Para aceptar la decisión, actualiza el campo Estado a 'Aceptado' después de completar el spike (si aplica) o de revisar el ADR con el equipo."

**Ejemplo de invocación:**
```
/adr-write "usar Firestore en lugar de PostgreSQL"
```

Crea: `docs/architecture/decisions/ADR-006-firestore-over-postgresql.md`
Actualiza: `docs/architecture/decisions/index.md`

**Archivo del skill:** `.claude/skills/adr-write.md`

---

### Skill 4: `/gherkin-to-test "feature name"`

**Propósito:** Encuentra los bloques Gherkin para el feature nombrado en los sprint files, genera tests de Vitest para escenarios de lógica (sin browser), genera specs de Playwright para escenarios E2E (con browser), los coloca en los directorios correctos, y los deja en estado failing — fase roja del ciclo TDD.

**Input:** Nombre del feature o path al archivo que contiene el Gherkin.
```
/gherkin-to-test "business status machine"
/gherkin-to-test "storefront whatsapp click tracking"
/gherkin-to-test "prospect capture form validation"
/gherkin-to-test docs/planning/sprints/sprint-2-auth-mfe.md
```

**Qué hace el skill, paso a paso:**

1. Localiza el Gherkin. Si el input es un nombre de feature, busca en todos los archivos de `docs/planning/sprints/` el bloque `Feature:` cuyo nombre coincide (búsqueda case-insensitive, acepta coincidencias parciales). Si el input es un path, lee el archivo directamente y extrae todos los bloques `Feature:/Scenario:` que contiene. Si no encuentra Gherkin, reporta los archivos donde buscó y el formato esperado.

2. Por cada escenario encontrado, clasifica si es test unitario (Vitest) o E2E (Playwright) aplicando estas reglas de clasificación:
   - **Vitest (lógica de negocio):** El escenario valida funciones, state machines, validaciones, transformaciones de datos, o comportamiento de una función específica sin requerir DOM. Señales en el texto del escenario: "I call", "the function", "it throws", "the value returns", "the state transitions", "the validation rejects".
   - **Playwright (interacción de usuario):** El escenario requiere renderizar UI, hacer clicks en elementos, navegar entre páginas, o verificar elementos visuales. Señales: "I visit", "I click", "the button", "the page shows", "I see", "I fill in", "the form submits".

3. Para los escenarios clasificados como Vitest, genera el archivo de tests con esta estructura exacta:
   ```typescript
   import { describe, it, expect } from 'vitest'
   // TODO: import the module under test once implemented
   // import { functionName } from '../path/to/module'

   describe('Feature: {feature name from Gherkin}', () => {
     describe('Scenario: {scenario name}', () => {
       it('{given context} when {action} then {expected outcome}', () => {
         // Given: {given steps summarized}
         // When: {when steps summarized}
         // Then: {then steps summarized}
         // TODO: implement this test
         expect(true).toBe(false) // Red phase — make this pass
       })
     })
   })
   ```

4. Para los escenarios clasificados como Playwright, genera el spec con esta estructura:
   ```typescript
   import { test, expect } from '@playwright/test'

   test.describe('Feature: {feature name}', () => {
     test('Scenario: {scenario name}', async ({ page }) => {
       // Given: {given steps}
       // When: {when steps}
       // Then: {then steps}
       // TODO: implement this E2E test
       expect(false).toBeTruthy() // Red phase — make this pass
     })
   })
   ```

5. Coloca los archivos generados en el directorio correcto según el tipo y el área del codebase que testea:
   - Tests unitarios de lógica de `packages/core` → `packages/core/src/__tests__/{feature-name}.test.ts`
   - Tests unitarios del servidor de admin → `apps/admin-fe/server/__tests__/{feature-name}.test.ts`
   - Tests unitarios del frontend de admin → `apps/admin-fe/app/__tests__/{feature-name}.test.ts`
   - Tests unitarios del template → `apps/template/app/__tests__/{feature-name}.test.ts`
   - Tests E2E → `apps/admin-fe/e2e/{feature-name}.spec.ts`

6. Reporta: archivos creados con sus paths absolutos, conteo de tests unitarios generados, conteo de specs E2E generados, y el comando para correr solo estos tests en modo watch.

**Ejemplo de invocación:**
```
/gherkin-to-test "business status machine"
```

Salida esperada:
```
Gherkin encontrado en: docs/planning/sprints/sprint-0-cleanup-sdd.md

Clasificación:
  - "Given a business in 'active' status when validateTransition('active', 'demo') is called then it returns true" → Vitest (lógica de state machine)
  - "Given a business in 'suspended' status when validateTransition('suspended', 'active') is called then it throws InvalidTransitionError" → Vitest
  - "Given a logged-in admin when they click 'Suspend' on a business card then the status badge changes to 'Suspendido'" → Playwright

Archivos generados:
  packages/core/src/__tests__/business-status-machine.test.ts (4 tests — todos en estado FAILING)
  apps/admin-fe/e2e/business-status-machine.spec.ts (2 specs — todos en estado FAILING)

Correr tests unitarios: pnpm vitest run packages/core/src/__tests__/business-status-machine.test.ts
Correr E2E: pnpm playwright test apps/admin-fe/e2e/business-status-machine.spec.ts
```

**Archivo del skill:** `.claude/skills/gherkin-to-test.md`

---

### Skill 5: `/cost-check "what you're adding"`

**Propósito:** Identifica los servicios GCP involucrados en el cambio propuesto, estima el delta de costo mensual, compara contra el baseline actual de $31/mes para 100 negocios, alerta si el total proyectado supera el budget de $40/mes, y sugiere alternativas más baratas si la estimación excede el budget.

**Input:** Descripción en lenguaje natural del cambio de arquitectura o feature que se va a agregar.
```
/cost-check "agregar notificaciones en tiempo real via WebSockets"
/cost-check "agregar Cloud SQL para analytics de clicks"
/cost-check "configurar un Cloud Run Job para procesar imágenes de forma asíncrona"
/cost-check "agregar un índice de vector search en Firestore para búsqueda semántica"
```

**Qué hace el skill, paso a paso:**

1. Parsea el input para identificar los servicios de GCP involucrados. Aplica esta tabla de mapping:
   - "WebSockets", "conexión persistente", "tiempo real bidireccional" → Cloud Run con `min-instances=1` (el costo más alto del stack)
   - "base de datos relacional", "SQL", "PostgreSQL", "Cloud SQL" → Cloud SQL (instancia más barata: `db-f1-micro` = $7.67/mes + storage)
   - "procesamiento de imágenes", "thumbnails", "resize", "transcoding" → Cloud Run Jobs + Cloud Storage egress
   - "vector search", "embeddings", "búsqueda semántica" → Firestore con índice vectorial + Vertex AI Embeddings API
   - "pub/sub", "eventos asíncronos", "queue" → Cloud Pub/Sub (prácticamente gratuito al volumen de este proyecto)
   - "CDN", "caché global", "Cloud CDN" → Cloud CDN + Cloud Load Balancing

2. Para cada servicio identificado, calcula las dimensiones de costo con estos supuestos de baseline: 100 negocios activos, 50 visitantes únicos por negocio por día, factor de pico 3x en hora pico, Cloud Run con min-instances=0 (serverless puro).

3. Lee `docs/infrastructure/cost-model.md` si existe para obtener el baseline actual documentado. Si no existe, usa el baseline declarado en la arquitectura: $31/mes para 100 negocios con el stack actual (Firestore + Cloud Run serverless + Cloud Storage).

4. Calcula el delta mensual: `costo_baseline + costo_nuevo_servicio = total_proyectado`. Expresa el resultado como: costo mensual adicional, costo anual adicional, costo por negocio adicional, y punto de quiebre del modelo de pricing (a cuántos negocios el costo supera el revenue proyectado).

5. Evalúa contra los umbrales definidos:
   - Verde: total proyectado <= $35/mes — dentro del budget con margen
   - Amarilla: $35 < total <= $40/mes — sobre el objetivo pero dentro del límite aceptable, requiere justificación
   - Roja: total > $40/mes — sobre el límite aceptable, requiere alternativa o rediseño

6. Si el resultado es amarillo o rojo, genera 2-3 alternativas ordenadas de menor a mayor costo, con sus propios estimados y trade-offs.

7. Presenta el resultado como tabla comparativa: opción propuesta vs. alternativas, con costo mensual, costo anual, trade-offs principales, y recomendación final.

**Ejemplo de invocación:**
```
/cost-check "agregar notificaciones en tiempo real via WebSockets"
```

Salida esperada:
```
## Cost Check — WebSockets para notificaciones en tiempo real

Servicios involucrados: Cloud Run (requiere min-instances=1 para mantener conexión WebSocket persistente)

| Componente | Costo mensual |
|------------|--------------|
| Cloud Run min-instances=1 (0.5 vCPU, 512MB) | +$18.24/mes |
| Baseline actual | $31.00/mes |
| Total proyectado | $49.24/mes |

🔴 ALERTA: Supera el budget objetivo ($35/mes) en $14.24 y el límite aceptable ($40/mes) en $9.24.

Alternativas:

| Alternativa | Costo adicional | Trade-off |
|-------------|----------------|-----------|
| SSE (Server-Sent Events) — ya implementado en el proyecto | $0/mes | Unidireccional (server → client). Suficiente para notificaciones. |
| Polling cada 30s desde el frontend | +$0.42/mes | Latencia de hasta 30s. Aumenta reads de Firestore. |
| Firebase Realtime Database solo para notificaciones | +$1.80/mes | Agrega un servicio Firebase adicional. Muy baja latencia. |

Recomendación: SSE ya está implementado en el proyecto para el flujo de provisioning (ver apps/admin-fe/server/api/dev/ports.get.ts). Es extensible a notificaciones de cualquier tipo sin costo adicional y sin requerir min-instances. Usar SSE en lugar de WebSockets.
```

**Archivo del skill:** `.claude/skills/cost-check.md`

---

### Skill 6: `/star-story "topic"`

**Propósito:** Lee el git log reciente y los sprint files para reunir contexto factual, estructura una historia STAR completa (Situation / Task / Action / Result) sobre el tema indicado, escribe la historia en `docs/interview/star-method.md`, y también la escribe en `~/obsidian/architect-brain/40-Career/STAR-Stories/` para captura en el vault de largo plazo.

**Input:** Tema, decisión, o evento sobre el que articular la historia.
```
/star-story "la decisión de arquitectura FinOps"
/star-story "el pivote de product domain de eventos a catálogos"
/star-story "diseñar el sistema de sub-agentes para automatizar sprints"
/star-story "manejar la documentación incorrecta del stack"
/star-story "elegir Module Federation para un MVP"
```

**Qué hace el skill, paso a paso:**

1. Lee `docs/interview/star-method.md` para ver las historias STAR existentes y evitar duplicación temática. Si el archivo no existe, lo crea con la estructura base: frontmatter, introducción, y las secciones vacías `## Historias` y `## Preguntas cubiertas`.

2. Lee el git log reciente para obtener contexto factual con fechas y commits reales:
   ```bash
   git log --oneline -50
   git log --stat --since="60 days ago" --oneline
   ```
   Lee los sprint files relevantes al tema (`docs/planning/sprints/sprint-*.md`) para obtener decisiones tomadas, resultados medibles, y el contexto real del proyecto.

3. Parsea el input para identificar el tipo de pregunta de entrevista que esta historia responde más directamente. Mapping estándar:
   - "decisión de arquitectura" → "Cuéntame sobre una vez que tomaste una decisión técnica difícil con información incompleta"
   - "pivote de producto" → "Cuéntame sobre una vez que tuviste que cambiar de dirección con trabajo ya hecho"
   - "sub-agentes / automatización" → "Cuéntame sobre una innovación o mejora de proceso que introdujiste"
   - "documentación incorrecta" → "Cuéntame sobre una vez que encontraste un problema sistémico y lo resolviste"
   - "FinOps / costos" → "Cuéntame sobre una vez que optimizaste costos de infraestructura sin sacrificar funcionalidad"

4. Construye la estructura STAR con estos criterios de calidad obligatorios:
   - **Situation (2-3 oraciones):** Incluye escala específica (número de usuarios, sistemas, negocios, tiempo), el contexto organizacional, y la dificultad implícita. Evita generalidades. Malo: "Estaba trabajando en un proyecto SaaS." Bueno: "Estaba diseñando la arquitectura de una plataforma SaaS multi-tenant para 100 negocios locales con un budget de infraestructura de $35/mes, dos semanas antes del primer demo con un cliente potencial."
   - **Task (1-2 oraciones):** Clarifica tu responsabilidad específica vs. la del equipo. Usa primera persona. "Mi responsabilidad era..." o "Como arquitecto líder, necesitaba..."
   - **Action (5 pasos numerados):** Cada paso es atribuible a ti específicamente. Usa verbos de acción fuertes: diseñé, implementé, identifiqué, evalué, propuse, documenté, negocié, mitigué. No "el equipo hizo" sino "yo diseñé / yo propuse / yo identifiqué."
   - **Result (2-3 oraciones con al menos un número):** Si hay métricas exactas, úsalas. Si no, usa rangos o comparaciones relativas. "El tiempo de setup del sprint bajó de 45 minutos a 5 minutos." "El costo proyectado bajó de $85/mes a $31/mes — dentro del budget con $4 de margen."

5. Revisa la historia contra estos 4 criterios antes de escribirla al archivo:
   - ¿El Situation tiene al menos un número concreto (presupuesto, número de usuarios, tiempo, escala)?
   - ¿El Task clarifica el rol específico del arquitecto vs. el del equipo?
   - ¿El Action tiene exactamente 5 pasos con verbos de acción fuertes (no verbos pasivos)?
   - ¿El Result incluye al menos un número o porcentaje medible?

6. Escribe la historia en dos lugares simultáneamente:
   - En `docs/interview/star-method.md` bajo la sección `## Historias`, con el formato estructurado y la pregunta de entrevista objetivo al final.
   - En `~/obsidian/architect-brain/40-Career/STAR-Stories/{slug-del-tema}.md` como archivo independiente para el vault de largo plazo.

**Ejemplo de invocación:**
```
/star-story "la decisión de arquitectura FinOps"
```

Escribe en ambas ubicaciones:
```markdown
### Historia: Arquitectura FinOps para SaaS multi-tenant con budget $35/mes

**Pregunta objetivo:** "Cuéntame sobre una vez que optimizaste costos de infraestructura sin sacrificar la funcionalidad requerida."

**Variaciones de la misma pregunta:**
- "Describe a time when you had significant infrastructure cost constraints and how you handled them."
- "¿Cómo manejas las decisiones de arquitectura cuando el costo es una restricción dura?"

**Situation:** Estaba diseñando la arquitectura de infraestructura para una plataforma SaaS multi-tenant que debía soportar 100 negocios activos. El presupuesto declarado era $35/mes. La arquitectura inicial con Cloud SQL y Cloud Run siempre-activo para WebSockets en tiempo real habría costado aproximadamente $85/mes — 2.4 veces el presupuesto disponible.

**Task:** Como arquitecto líder del proyecto, mi responsabilidad era diseñar una solución que cumpliera todos los requisitos funcionales (real-time updates, multi-tenancy, generación de AI por demanda) dentro del constraint de costo — sin comprometerlos ni diferirlos indefinidamente.

**Action:**
1. Modelé el volumen de operaciones para 100 negocios: DAU estimado de 50 visitantes únicos por negocio, factor de pico de 3x en hora pico, reads y writes de Firestore por page load.
2. Identifiqué que el principal driver de costo era Cloud Run con min-instances=1, requerido para mantener conexiones WebSocket persistentes para las notificaciones en tiempo real.
3. Evalué Server-Sent Events (SSE) como alternativa a WebSockets — misma funcionalidad de notificaciones unidireccionales del servidor, sin requerir conexión persistente ni min-instances.
4. Diseñé una arquitectura serverless-first con Firestore en free tier + Cloud Run con min-instances=0 + SSE para notificaciones, eliminando Cloud SQL y el Cloud Run siempre-activo.
5. Documenté el modelo de capacidad con proyecciones a 12 meses para validar que la arquitectura escala dentro del budget hasta 300 negocios sin cambios de diseño.

**Result:** La arquitectura final estimada cuesta $31/mes para 100 negocios activos — dentro del budget con $4 de margen de seguridad. El modelo proyecta escalar a 300 negocios antes de superar $35/mes, dando un runway de 3x sin cambios de arquitectura o pricing. La decisión de SSE sobre WebSockets fue documentada en ADR-007 con el modelo de capacidad completo.
```

**Archivo del skill:** `.claude/skills/star-story.md`

---

### Skill 7: `/fitness-check`

**Propósito:** Corre dependency-cruiser para verificar los límites de módulos definidos en la arquitectura, verifica que `packages/ui` no tiene imports de Firestore, verifica que ningún componente de Tier 3 está exportado del barrel de `packages/ui/src/index.ts`, verifica que todos los ADRs están indexados, y reporta pass/fail por constraint con el fix específico para cada violación encontrada.

**Input:** Sin argumentos (corre todas las constraints), o el nombre de un grupo específico.
```
/fitness-check
/fitness-check module-boundaries
/fitness-check barrel-exports
/fitness-check adr-completeness
/fitness-check docs-stack-accuracy
```

**Qué hace el skill, paso a paso:**

1. Si no se especifica grupo, corre todos los grupos en secuencia: `module-boundaries`, `barrel-exports`, `adr-completeness`, `docs-stack-accuracy`. Si se especifica un grupo, corre solo ese grupo.

2. **Grupo: module-boundaries** — Verifica que los límites de módulos definidos en la arquitectura no han sido violados:
   - Ejecuta: `grep -r "from.*apps/" packages/ui --include="*.ts" --include="*.vue" -l` → debe retornar vacío.
   - Ejecuta: `grep -r "firebase" packages/ui --include="*.ts" --include="*.vue" -l` → debe retornar vacío.
   - Ejecuta: `grep -r "from.*apps/template" apps/admin-fe --include="*.ts" --include="*.vue" -l` → debe retornar vacío.
   - Si Dependency Cruiser está configurado (`.dependency-cruiser.js` existe en la raíz), ejecuta: `npx dependency-cruiser --config .dependency-cruiser.js packages/ apps/ --output-type err` y parsea el output.
   - Para cada violación encontrada: reporta el archivo, la línea, y el import violatorio.

3. **Grupo: barrel-exports** — Verifica que el barrel de `packages/ui/src/index.ts` no exporta componentes de Tier 3:
   - Lee `packages/ui/src/index.ts` y extrae todas las líneas de export.
   - Lee `docs/strategy/component-library.md` para obtener la lista de componentes clasificados como Tier 3 (los que son demasiado específicos del dominio para ser exportados como componentes genéricos).
   - Verifica que ningún nombre de export del barrel coincide con un componente de Tier 3 de la lista.
   - Si hay coincidencias: reporta cuáles componentes de Tier 3 están siendo exportados y la línea exacta del barrel.

4. **Grupo: adr-completeness** — Verifica que todos los ADRs están indexados y actualizados:
   - Lista todos los archivos en `docs/architecture/decisions/ADR-*.md`.
   - Lee `docs/architecture/decisions/index.md`.
   - Verifica que cada archivo ADR tiene una entrada correspondiente en la tabla del index.
   - Verifica la fecha de cada ADR: los ADRs en estado "Propuesto" que llevan más de 14 días sin cambiar a "Aceptado" o "Deprecado" generan una advertencia (no un error, pero sí un item de atención).
   - Reporta: total de ADRs, ADRs no indexados (error), ADRs en Propuesto por más de 14 días (warning).

5. **Grupo: docs-stack-accuracy** — Verifica que la documentación describe el stack correcto:
   - Busca menciones de "Next.js", "React" (como framework principal, no como referencia histórica), "FastAPI", "Python", "Flask", "Django" en archivos bajo `docs/` excluyendo `docs/architecture/decisions/` (donde los ADRs históricos pueden mencionar tecnologías descartadas) y excluyendo `docs/lessons-learned/`.
   - Ejecuta: `grep -r "Next\.js\|FastAPI\|Python\|React Router" docs/ --include="*.md" --exclude-dir=decisions --exclude-dir=lessons-learned -l`
   - Para cada archivo encontrado: reporta la mención exacta y el contexto de la línea.

6. Genera el reporte completo por grupo: PASS (verde) si no hay violaciones, FAIL (rojo) si hay violaciones, WARN (amarillo) si hay situaciones que requieren atención pero no son violaciones bloqueantes.

7. Para cada FAIL: propone el fix específico con el archivo exacto, la línea o sección donde está la violación, y el comando o acción concreta para resolverlo.

**Ejemplo de invocación:**
```
/fitness-check
```

Salida esperada:
```
## Architecture Fitness Check — 2026-05-17

### module-boundaries
  ✓ packages/ui no importa de apps/
  ✓ packages/ui no importa Firebase ni firebase-admin
  ✓ apps/admin-fe no importa directamente de apps/template

### barrel-exports
  ✓ packages/ui/src/index.ts no exporta componentes de Tier 3
  (Componentes Tier 3 verificados: BusinessCard, ProspectForm, AppGeneratorStatus)

### adr-completeness
  ✓ 5 ADRs en docs/architecture/decisions/
  ✓ Todos registrados en index.md
  ⚠ ADR-003 lleva 18 días en estado "Propuesto" sin actualización
    → Acción: revisar el spike de MFE con Nuxt 4 y actualizar el ADR a "Aceptado" o "Deprecado"

### docs-stack-accuracy
  ✗ docs/planning/decisions.md (línea 14): menciona "Next.js 15 App Router"
  ✗ docs/planning/decisions.md (línea 23): menciona "Python FastAPI"
    → Acción: actualizar docs/planning/decisions.md para reflejar el stack actual:
      Reemplazar "Next.js 15" por "Nuxt 4 (Vue 3)"
      Reemplazar "Python FastAPI" por "Nitro (H3)"

RESULTADO FINAL: 1 FAIL, 1 WARNING
Constraints bloqueantes: docs-stack-accuracy (2 violaciones)
Items de atención: adr-completeness (1 ADR sin resolver hace 18 días)
```

**Archivo del skill:** `.claude/skills/fitness-check.md`

---

## Sección 3: Formato de skill file y template

Todo skill file tiene dos partes: frontmatter YAML (metadatos del skill) y el system prompt (las instrucciones del agente). El frontmatter es descriptivo — documenta el contrato del skill para engineers y sub-agentes que lean el archivo. El system prompt es ejecutable — define exactamente qué hace el agente cuando se invoca el skill.

### Template completo de skill file

```markdown
---
name: nombre-del-skill
description: Una oración que describe qué hace este skill. Esta descripción aparece en la ayuda contextual del CLI.
version: 1.0.0
author: Erick Bárcenas
created: YYYY-MM-DD
updated: YYYY-MM-DD
inputs:
  - name: arg1
    description: Qué representa este argumento. Qué formatos acepta.
    required: true
    example: "valor de ejemplo concreto"
  - name: arg2
    description: Segundo argumento, si aplica.
    required: false
    example: "otro valor de ejemplo"
---

# {Nombre del Skill}

## Propósito

{Una oración. Qué problema resuelve este skill. Por qué existe y cuándo usarlo.}

## Contexto del proyecto

{Describe el contexto del proyecto que el agente necesita saber para ejecutar correctamente este skill. Incluye:
- Estructura de carpetas relevante para este skill
- Convenciones de naming que aplican en los archivos que toca
- Archivos de referencia que el agente debe leer antes de ejecutar
- Reglas de negocio que afectan las decisiones del skill}

## Input

El usuario invoca este skill con:
```
/{nombre-del-skill} {descripcion-del-input}
```

{Describe exactamente qué puede pasarse como input. Incluye todas las variaciones válidas y qué hace el skill diferente con cada una.}

## Pasos de ejecución

Ejecuta los siguientes pasos en orden. No omitas pasos ni cambies la secuencia.

### Paso 1: {Nombre descriptivo del paso}

{Descripción detallada de qué hacer en este paso:
- Qué archivos leer y por qué
- Qué comandos bash ejecutar y cómo interpretar su output
- Qué validar antes de continuar al siguiente paso
- Qué hacer si el paso falla — no continuar en silencio, reportar el problema específico}

### Paso 2: {Nombre descriptivo del paso}

{...}

### Paso N: Reporte final

{El último paso siempre incluye:
- Un reporte de qué se completó
- Los paths absolutos de los archivos creados o modificados
- El comando para verificar el resultado
- Los pasos siguientes recomendados para el usuario}

## Criterios de éxito

Este skill se completó correctamente cuando:
- [ ] {Criterio verificable 1 — algo concreto y comprobable}
- [ ] {Criterio verificable 2}
- [ ] {Criterio verificable N}

Si algún criterio no se cumple, reporta el problema específico con el path del archivo y la acción requerida. No marques el skill como completado parcialmente en silencio — el usuario necesita saber qué falta.

## Ejemplos de invocación

```
/{nombre-del-skill} {ejemplo-1}
```
Descripción de qué hace este ejemplo específico y qué output produce.

```
/{nombre-del-skill} {ejemplo-2}
```
Descripción de qué hace este ejemplo específico y en qué se diferencia del primero.

## Errores comunes y cómo manejarlos

| Error | Causa probable | Solución |
|-------|---------------|----------|
| {descripción del error observado} | {por qué ocurre típicamente} | {acción concreta para resolverlo} |
| {descripción del error observado} | {por qué ocurre típicamente} | {acción concreta para resolverlo} |
```

### Ejemplo completo funcional: el skill `/sprint-review`

El siguiente es el archivo completo `.claude/skills/sprint-review.md` — no un template sino el skill real, listo para funcionar:

```markdown
---
name: sprint-review
description: Verifica el DoD del sprint actual, corre los comandos de verificación, y genera la descripción del MR lista para abrir.
version: 1.0.0
author: Erick Bárcenas
created: 2026-05-17
updated: 2026-05-17
inputs:
  - name: sprint-number
    description: Número del sprint a revisar (entero, sin ceros a la izquierda)
    required: true
    example: "0"
---

# Sprint Review

## Propósito

Verificar que el trabajo de un sprint cumple el Definition of Done antes de abrir el MR a develop. Corre los checks de verificación definidos en el sprint file, reporta el estado de cada item del DoD, y genera la descripción del MR si todo está completo.

## Contexto del proyecto

Los sprint files viven en `docs/planning/sprints/sprint-{N}-*.md`. Cada sprint file tiene tres secciones que este skill usa:
- `## Definition of Done` — el checklist de criterios que deben cumplirse
- `## Verification Commands` — los comandos específicos del sprint para verificar el trabajo
- `## MR Template` — la plantilla para la descripción del MR

El proyecto usa pnpm workspaces. Los comandos de verificación siempre se corren desde la raíz del monorepo.

La branch actual cuando se corre este skill debe ser `sprint/{N}-{name}`. Si no es así, reportar el mismatch antes de continuar.

## Input

El usuario invoca este skill con:
```
/sprint-review {N}
```

Donde `{N}` es el número del sprint sin ceros a la izquierda. Ejemplos válidos:
```
/sprint-review 0
/sprint-review 1
/sprint-review 3
```

## Pasos de ejecución

### Paso 1: Verificar el contexto del branch

Ejecuta `git branch --show-current` para confirmar que estamos en el branch correcto.
Si el branch actual no es `sprint/{N}-*`, reporta: "Este skill debe correrse desde el branch del sprint. Branch actual: {branch}. Esperado: sprint/{N}-{name}. ¿Deseas continuar de todas formas? (sí/no)"

### Paso 2: Leer el sprint file

Usa el glob `docs/planning/sprints/sprint-{N}-*.md` para encontrar el sprint file.
Si no existe ningún archivo que coincida, reporta: "No se encontró sprint file para sprint {N} en docs/planning/sprints/. Archivos disponibles: {lista}."
Lee el archivo completo. Extrae:
- El contenido de la sección `## Definition of Done`
- El contenido de la sección `## Verification Commands`
- El contenido de la sección `## MR Template`

### Paso 3: Correr los comandos de verificación

Corre cada comando de la sección `## Verification Commands` en secuencia. Para cada comando:
- Ejecuta el comando
- Captura el exit code y el output (stdout y stderr)
- Si el exit code es 0: registra PASS con el número de archivos o items verificados del output
- Si el exit code es distinto de 0: registra FAIL con el output completo del error

Los comandos estándar del proyecto son:
```bash
pnpm typecheck
pnpm lint
```
Si el sprint file incluye comandos adicionales (como greps de verificación), córrelos también.

### Paso 4: Evaluar el DoD checklist

Para cada item del `## Definition of Done`, determina su estado:

- Items con formato "archivo X fue eliminado": ejecuta `ls {path}` → debe fallar (archivo no existe) para que el item sea PASS.
- Items con formato "archivo X fue creado": ejecuta `ls {path}` → debe tener éxito para que el item sea PASS.
- Items con formato "archivo X no contiene Y": ejecuta `grep -l "Y" {path}` → debe retornar vacío para que sea PASS.
- Items que requieren verificación de comportamiento lógico sin test automatizado: marca como MANUAL — incluye el paso de verificación exacto.

### Paso 5: Generar el reporte del DoD

Presenta el reporte en este formato:

```
## Sprint {N} Review — Definition of Done

Verification commands:
  ✓ pnpm typecheck: {resumen del output}
  ✓ pnpm lint: {resumen del output}
  [otros comandos]

DoD checklist:
  ✓ {item 1}
  ✓ {item 2}
  ✗ {item 3} — {qué falta específicamente}
  📋 MANUAL: {item N} — {pasos de verificación manual}

Veredicto: {DoD cumplido / DoD incompleto — N items pendientes}
```

### Paso 6: Generar la descripción del MR (solo si el DoD está cumplido)

Si todos los items del DoD están marcados como PASS o MANUAL-completado, genera la descripción del MR usando el `## MR Template` del sprint file como base. Enriquece el template con:
- Los resultados reales de los comandos de verificación
- La lista de archivos modificados: `git diff --name-only develop..HEAD`
- El número de commits en el branch: `git log develop..HEAD --oneline | wc -l`

Presenta la descripción del MR completa lista para copiar al abrir el PR.

## Criterios de éxito

Este skill se completó correctamente cuando:
- [ ] El reporte del DoD incluye todos los items del checklist del sprint file (ninguno omitido)
- [ ] Los comandos de verificación fueron ejecutados y sus resultados son parte del reporte
- [ ] Los items FAIL tienen la descripción exacta de qué falta y cómo completarlo
- [ ] Si el DoD está cumplido, la descripción del MR fue generada y está lista para copiar

## Ejemplos de invocación

```
/sprint-review 0
```
Revisa el Definition of Done del Sprint 0, corre typecheck y lint, verifica cada item del DoD del archivo sprint-0-*.md, y reporta el estado completo.

```
/sprint-review 1
```
Lo mismo para Sprint 1. Si Sprint 1 tiene comandos de verificación adicionales (como tests unitarios), los incluye en la verificación.

## Errores comunes y cómo manejarlos

| Error | Causa probable | Solución |
|-------|---------------|----------|
| "No se encontró sprint file para sprint N" | El sprint file tiene un nombre diferente al esperado | Listar los archivos en docs/planning/sprints/ y preguntar al usuario cuál es el correcto |
| pnpm typecheck falla con "cannot find module" | Dependencias no instaladas o workspace no configurado | Ejecutar pnpm install desde la raíz antes de correr typecheck |
| Item del DoD con formato no reconocido | El checklist del sprint usa una sintaxis diferente | Reportar el item con formato no reconocido y pedir al usuario cómo verificarlo manualmente |
```

---

## Sección 4: Patrones de equipo de sub-agentes

Un sub-agente es una instancia de Claude Code que ejecuta una tarea específica con un contexto acotado, mientras el agente principal coordina. Los 4 patrones siguientes cubren todos los casos de uso que se presentan en los sprints de SaaS Factory.

---

### Patrón 1: Paralelo Independiente

**Usado en:** Sprint 0 (cleanup-agent + types-agent)

**Descripción:** Dos o más agentes trabajan simultáneamente en partes del codebase que no se superponen. No hay dependencia de output entre ellos — cada agente puede completar su trabajo independientemente.

**Estructura:**
```
Sprint start
│
├── cleanup-agent (paralelo, sin dependencias)
│     Scope: docs/architecture/*, docs/development/*, docs/planning/decisions.md
│     Task: eliminar archivos de documentación obsoletos (stack incorrecto)
│     Output: commit "chore(cleanup): remove stale event-domain docs and incorrect stack docs"
│
└── types-agent (paralelo, sin dependencias de output de cleanup-agent)
      Scope: packages/core/src/types/ (solo archivos nuevos)
      Task: crear business.ts, item.ts, prospect.ts para el dominio catalog
      Output: commit "feat(core): add catalog domain types — Business, Item, Prospect, Click"
```

**Regla de coordinación:** Los agentes tocan archivos completamente distintos. La única excepción es `packages/core/src/index.ts` (el barrel de exports), que ambos agentes necesitan modificar. Esta dependencia se resuelve dando a `cleanup-agent` una ventaja de tiempo: `cleanup-agent` actualiza el barrel eliminando los exports obsoletos primero, y `types-agent` agrega los nuevos exports después del commit de cleanup-agent. No se necesitan locks — basta con la secuenciación temporal.

**Cuándo usar este patrón:** Las tareas tocan partes completamente distintas del codebase y las dependencias de archivos compartidos son mínimas y predecibles. El mayor beneficio es cuando los agentes tienen la misma duración estimada — el sprint termina en el tiempo de uno, no en la suma de los dos.

**Cómo invocar:**
```
/sprint-start 0
```
El skill `/sprint-start` lee la sección `## Agentes asignados` del sprint file, detecta que el patrón es "paralelo independiente", y spawnea los dos agentes con sus respectivos scopes.

**Qué vigilar:** Que los agentes no creen un conflicto de merge en `packages/core/src/index.ts`. Si ambos lo modifican en el mismo momento, el merge automático puede producir un barrel incorrecto. La solución es siempre hacer que cleanup-agent commite su versión del barrel primero.

---

### Patrón 2: Secuencial luego paralelo

**Usado en:** Sprint 1 (test-setup-agent → mfe-setup-agent + auth-agent en paralelo)

**Descripción:** Un agente "fundacional" debe completar su trabajo antes de que dos o más agentes paralelos puedan iniciar. Los agentes paralelos dependen del output del agente fundacional, pero no dependen entre sí.

**Estructura:**
```
Week start
│
└── test-setup-agent (primero, días 1-2)
      Task: configurar Vitest, CI pipeline, escribir failing tests para auth y rate-limit
      Output: commit "test: configure vitest and CI — failing tests for sprint-1 features"
             Los tests failing son el "contrato" que los agentes siguientes deben hacer pasar
│
    Cuando test-setup-agent commitea:
    │
    ├── auth-agent (días 3-5, paralelo con mfe-setup-agent)
    │     Prerequisito: failing tests de test-setup-agent existen en el branch
    │     Task: implementar JWT middleware y rate limiting hasta que los tests pasen
    │     Output: commit "feat(auth): implement JWT middleware and rate limiting — tests green"
    │
    └── mfe-setup-agent (días 3-5, paralelo con auth-agent)
          Prerequisito: Ninguno de los outputs de test-setup-agent (trabajan en áreas distintas)
          Task: configurar Module Federation host en nuxt.config.ts y crear el remote skeleton
          Output: commit "feat(mfe): configure federation host and create demo remote skeleton"
```

**Regla de coordinación:** `auth-agent` tiene una dependencia dura en los failing tests de `test-setup-agent` — ese es el contrato que define qué debe implementar. `auth-agent` no puede inferir los tests correctos sin leerlos. `mfe-setup-agent` no tiene esa dependencia (trabaja en `apps/mfe/`, no en `apps/admin-fe/server/middleware/`), pero inicia en el mismo momento para maximizar el paralelismo.

**Cuándo usar este patrón:** Una tarea de setup o infraestructura define el contrato (tests, schemas, configuración) que las tareas de implementación deben satisfacer. El agente de setup es pequeño (1-2 días) y sus outputs son inputs directos para los agentes paralelos.

**Cómo invocar:** El skill `/sprint-start 1` lee la sección `## Agentes asignados` del sprint-1 file, detecta el patrón de dependencia, spawnea solo `test-setup-agent`, espera su commit, y luego spawnea `auth-agent` y `mfe-setup-agent` en paralelo.

**Qué vigilar:** Que `auth-agent` no inicie antes de que `test-setup-agent` haya commiteado. La señal de gate es el commit con el mensaje "test: configure vitest..." en el branch del sprint. Sin ese commit, `auth-agent` no tiene el contrato que necesita y escribirá la implementación incorrecta.

---

### Patrón 3: Solo en worktree

**Usado en:** Sprint 3 (storefront-agent solo en un worktree aislado)

**Descripción:** Un único agente trabaja en un directorio de trabajo completamente separado del working tree principal, usando `git worktree`. Esto permite que el arquitecto (Erick) continúe trabajando en `develop` mientras el agente construye un feature grande en paralelo, sin contaminación del estado de git.

**Estructura:**
```
Sprint 3 start
│
└── storefront-agent (solo, en worktree aislado)
      Working tree: /tmp/sass-factory-sprint3/
      Branch: sprint/3-storefront (creado en el worktree, no en el directorio principal)
      Context: sprint-3 file completo + apps/template/ + packages/core/src/types/
      Task: construir el storefront público completo — páginas, componentes, SSR, analytics
      Output: MR desde sprint/3-storefront → develop cuando el DoD está completo
```

**Cómo crear el worktree:**
```bash
# Desde el directorio principal del proyecto
git worktree add /tmp/sass-factory-sprint3 -b sprint/3-storefront develop

# El agente trabaja en /tmp/sass-factory-sprint3/
# Erick continúa en ~/Desktop/erickbarcenas/sass-factory/
```

**Por qué worktree:** Sprint 3 crea o modifica decenas de archivos en `apps/template/` — el storefront público. Si este trabajo ocurriera en el working tree principal mientras Erick sigue desarrollando features de admin en `develop`, los cambios de Sprint 3 contaminarían el directorio de trabajo de Erick, hacerían imposible el review incremental del storefront, y crearían confusión sobre qué cambios son del sprint y cuáles son de desarrollo concurrente.

**Cuándo usar este patrón:** Un feature grande y auto-contenido toca docenas de archivos en un área del codebase que puede aislarse (por ejemplo: `apps/template/`, `packages/ui/`, o `infrastructure/`). El riesgo de conflicto con trabajo concurrente en `develop` es alto y el feature puede desarrollarse de forma completamente independiente por al menos 1-2 semanas.

**Cómo invocar:** El skill `/sprint-start 3` detecta que el sprint file especifica un worktree para `storefront-agent` y ejecuta `git worktree add` antes de spawnar el agente.

**Qué vigilar:** Que el agente no necesite archivos de `develop` que aún no existen en `sprint/3-storefront`. Si hay una dependencia no anticipada (por ejemplo: un tipo nuevo en `packages/core` que fue agregado a develop después de crear el branch), se resuelve con `git cherry-pick {commit-hash}` en el worktree, no con un merge de `develop` completo (que podría traer trabajo inacabado).

---

### Patrón 4: Shell + Remote

**Usado en:** Sprint 4 (shell-agent primero, luego demo-mf-agent)

**Descripción:** Dos agentes trabajan en partes de un sistema que tienen una dependencia de configuración específica: el primero (shell) define la interface o contrato que el segundo (remote) debe implementar. El segundo no puede comenzar hasta que el primero haya escrito el contrato en un archivo concreto.

**Estructura:**
```
Sprint 4 start
│
└── shell-agent (primero, días 1-2)
      Scope: apps/admin-fe/nuxt.config.ts, federation.config.ts (nuevo archivo)
      Task: configurar el admin como host de Module Federation
            Declarar en federation.config.ts los módulos que el remote debe exponer
      Output: commit "feat(mfe): configure admin as federation host"
              + crea el archivo .mfe-shell-ready como señal de gate
│
    Cuando .mfe-shell-ready existe en el branch:
    │
    └── demo-mf-agent (días 3-5)
          Prerequisito: federation.config.ts existe con los módulos declarados
          Primer paso obligatorio: leer federation.config.ts antes de crear cualquier archivo
          Scope: apps/mfe/demo/ (nuevo directorio)
          Task: crear el remote de Nuxt 4 que expone exactamente los módulos declarados en federation.config.ts
          Output: commit "feat(mfe): create demo storefront as federation remote"
```

**Regla de coordinación:** `demo-mf-agent` tiene una dependencia de configuración específica: necesita saber exactamente qué módulos el host espera que el remote exponga, con qué nombres y desde qué paths. Esa información solo existe en `federation.config.ts`, que `shell-agent` escribe. Si `demo-mf-agent` asume los nombres de módulos sin leer ese archivo, creará un remote que el host no puede consumir.

El signal file `.mfe-shell-ready` es un mecanismo de gate explícito. `demo-mf-agent` revisa si ese archivo existe antes de ejecutar cualquier paso. Si no existe, espera y reporta que está esperando la señal del shell-agent.

**Cuándo usar este patrón:** Sistemas donde el consumer (host, shell, orchestrator) define el contrato y el provider (remote, plugin, worker) debe implementarlo. Patrón común en: Module Federation (host → remote), plugin systems (shell → plugin), event-driven systems (producer schema → consumer handler).

**Cómo invocar:** El skill `/sprint-start 4` spawnea solo `shell-agent`. Cuando `shell-agent` hace su commit y crea `.mfe-shell-ready`, el agente principal (o un monitor de estado) detecta la señal y spawnea `demo-mf-agent` con el contexto de `federation.config.ts`.

**Qué vigilar:** Que `demo-mf-agent` lea `federation.config.ts` como su primer paso y no asuma los nombres de módulos. La señal más común de que este patrón está fallando es cuando el remote expone módulos con nombres como `App`, `default`, o `RemoteComponent` — nombres genéricos que sugieren que el agente no leyó el contrato del host.

---

## Sección 5: Integración con Obsidian

Los skills `/star-story` y `/adr-write` escriben en dos lugares simultáneamente: el proyecto en `docs/` y el vault personal de Obsidian en `~/obsidian/architect-brain/`. Esta doble escritura es intencional y tiene un propósito específico para cada destino.

### Por qué doble escritura

**`docs/` — memoria del proyecto:** Las decisiones arquitectónicas y las historias STAR que viven en el repositorio están disponibles para cualquier engineer (o agente) que trabaje en el proyecto. Son parte de la documentación viva del sistema, versionadas con git, y accesibles en el mismo contexto que el código.

**`~/obsidian/architect-brain/` — memoria personal de largo plazo:** El vault de Obsidian es el sistema de aprendizaje que persiste a través de proyectos. Cuando SaaS Factory termine o pivot, las lecciones aprendidas, las decisiones tomadas, y las historias STAR siguen disponibles. El vault sobrevive al proyecto.

Sin la escritura al vault, cada nuevo proyecto parte de cero. Con el vault, cada nuevo proyecto puede empezar con la pregunta: "¿Qué patrones del proyecto anterior aplican aquí?"

### Estructura de los paths en el vault

```
~/obsidian/architect-brain/
├── 10-Projects/
│   └── saas-factory/           ← notas de proyecto, índice, contexto
├── 20-Patterns/
│   ├── anti-patterns/          ← patrones que se deben evitar (con evidencia)
│   └── patterns/               ← patrones que funcionan (con evidencia)
├── 40-Career/
│   ├── Gaps/                   ← gaps identificados y plan de cierre
│   └── STAR-Stories/           ← historias STAR por tema
└── 60-Templates/               ← templates de ADR, lesson learned, problem brief
```

### Qué escribe cada skill en el vault

**`/adr-write`:** Escribe el ADR en `docs/architecture/decisions/ADR-N-slug.md` (repositorio) Y crea un link en `~/obsidian/architect-brain/10-Projects/saas-factory/adr-index.md` que apunta al archivo del repo. Opcionalmente, si la decisión establece un patrón general (no específico del proyecto), también escribe una nota en `~/obsidian/architect-brain/20-Patterns/`.

**`/star-story`:** Escribe la historia en `docs/interview/star-method.md` (repositorio) Y crea el archivo independiente `~/obsidian/architect-brain/40-Career/STAR-Stories/{slug-del-tema}.md` con el contenido completo de la historia. Las historias en el vault son archivos independientes para facilitar la búsqueda por tema en el futuro.

### Verificación de que la integración funciona

Después de correr `/star-story` o `/adr-write`, verifica que el archivo existe en ambas ubicaciones:
```bash
ls docs/architecture/decisions/ADR-*.md
ls ~/obsidian/architect-brain/10-Projects/saas-factory/

ls docs/interview/star-method.md
ls ~/obsidian/architect-brain/40-Career/STAR-Stories/
```

Si el vault no existe o la carpeta destino no existe, el skill crea la estructura de carpetas antes de escribir. No falla silenciosamente — reporta si la escritura al vault fue exitosa o si encontró un problema (permisos, path incorrecto, vault no montado).

### Qué no sincroniza automáticamente

Los cambios manuales en el vault de Obsidian (notas escritas directamente en la app, sin pasar por un skill) no se reflejan automáticamente en el repositorio. La sincronización es unidireccional: el repositorio escribe al vault, no al revés. Si se edita una historia STAR directamente en Obsidian, esa edición no aparecerá en `docs/interview/star-method.md` a menos que se ejecute `/star-story` de nuevo con el tema actualizado.

Esta asimetría es intencional: el repositorio es la fuente de verdad para el proyecto activo. El vault es la acumulación de largo plazo. Los conflictos entre los dos se resuelven siempre a favor del repositorio para el contenido del proyecto activo.
