# Obsidian — Setup y Estructura del Vault Personal

> **Contexto:** Obsidian es la herramienta de gestión de conocimiento personal del arquitecto. Captura aprendizajes de cada proyecto, anti-patrones encontrados, historias STAR para entrevistas, y ADRs de decisiones arquitectónicas. El vault vive localmente en `~/obsidian/architect-brain/` y se sincroniza via Git a un repositorio privado.

---

## Por qué Obsidian (y no Notion, Confluence, o Google Docs)

La decisión no es arbitraria. Hay trade-offs reales.

### Lo que importa para un sistema de conocimiento personal de arquitecto

Un arquitecto acumula conocimiento que necesita ser:
- **Accesible offline** — en aviones, en lugares sin conexión, durante outages
- **Portable para siempre** — no atado a que una empresa siga existiendo o cambie su pricing
- **Linkeable** — una decisión arquitectónica conecta con un patrón, que conecta con una historia STAR, que conecta con un anti-patrón visto en otro proyecto
- **Buscable en texto plano** — `grep` y `rg` funcionan sobre markdown, no sobre bases de datos propietarias

### Notion

- Pros: colaborativo, bases de datos relacionales, buena UX
- Contras: vendor lock-in completo (los datos viven en sus servidores), requiere conexión para funcionar, exportación es imperfecta, empresa puede cambiar pricing o desaparecer
- **Veredicto:** Bueno para trabajo en equipo. Malo para conocimiento personal a largo plazo.

### Confluence

- Pros: integración con Jira, empresa lo paga
- Contras: diseñado para documentación de empresa, no para conocimiento personal, lento, costoso, búsqueda deficiente
- **Veredicto:** Úsalo para documentar el trabajo de empresa. No para tu vault personal.

### Google Docs

- Pros: colaborativo, gratuito, accesible desde cualquier lugar
- Contras: sin links entre documentos, sin sistema de tags, sin graph view, no es markdown, búsqueda limitada entre documentos
- **Veredicto:** Bueno para documentos individuales. Pésimo para un sistema de conocimiento con relaciones entre conceptos.

### Obsidian

- Pros: archivos markdown locales (tú eres dueño de los datos), links bidireccionales entre notas, graph view para visualizar relaciones, funciona completamente offline, extensible con plugins, búsqueda full-text rápida, exportable a cualquier cosa que lea markdown
- Contras: no es colaborativo por defecto (necesita plugin Git o Obsidian Sync), la curva de aprendizaje del sistema de organización es real
- **Veredicto:** El único sistema que escala con una carrera de 10+ años sin depender de terceros.

---

## Instalación

### Paso 1: Descargar Obsidian

```
https://obsidian.md/download
```

Disponible para macOS, Windows, Linux, iOS, Android. Instalar la versión para el sistema operativo actual.

### Paso 2: Abrir el vault existente

El directorio ya existe: `~/obsidian/architect-brain/`

Al abrir Obsidian por primera vez:
1. Seleccionar "Open folder as vault"
2. Navegar a `~/obsidian/architect-brain/`
3. Confirmar

Obsidian no modifica los archivos existentes — simplemente los lee como markdown.

### Paso 3: Instalar plugins recomendados

Ir a: Settings (Ctrl+,) → Community Plugins → Turn off Safe Mode → Browse

Instalar los siguientes plugins:

#### Dataview
**Propósito:** Consultar notas como si fueran una base de datos. Permite queries como "mostrar todas las notas con tag #ADR creadas en los últimos 30 días."

```
Búsqueda en el browser de plugins: "Dataview"
Autor: Michael Brenan
```

Ejemplo de uso:
````markdown
```dataview
TABLE status, date, project
FROM #ADR
SORT date DESC
```
````

#### Templater
**Propósito:** Templates avanzados con lógica, fechas dinámicas, y prompts interactivos. Reemplaza el sistema de templates básico de Obsidian.

```
Búsqueda: "Templater"
Autor: SilentVoid13
```

Configuración post-instalación:
- Settings → Templater → Template folder location: `60-Templates`
- Enable "Trigger Templater on new file creation": ON

#### Calendar
**Propósito:** Vista de calendario para notas diarias. Permite navegar al daily note de cualquier fecha directamente.

```
Búsqueda: "Calendar"
Autor: Liam Cain
```

#### Obsidian Git
**Propósito:** Auto-commit del vault a un repositorio Git privado cada N minutos. Elimina la necesidad de hacer git push manualmente.

```
Búsqueda: "Obsidian Git"
Autor: Vinzent03
```

Configuración post-instalación (Settings → Obsidian Git):
```
Vault backup interval (minutes): 10
Auto pull interval (minutes): 10
Commit message: "vault: auto-backup {{date}}"
Pull updates on startup: ON
Push on backup: ON
```

Repositorio Git del vault (configurar una sola vez):
```bash
cd ~/obsidian/architect-brain
git init
git remote add origin git@github.com:tu-usuario/architect-brain-private.git
git add .
git commit -m "vault: initial commit"
git push -u origin main
```

#### Kanban
**Propósito:** Tableros Kanban dentro del vault. Útil para tracking personal de proyectos sin depender de Jira/Linear.

```
Búsqueda: "Kanban"
Autor: mgmeyers
```

---

## Estructura del vault

```
~/obsidian/architect-brain/
├── 00-MOC/                        # Maps of Content — índices del vault
│   ├── MOC-Architecture.md        # Índice de todos los ADRs y patrones
│   ├── MOC-Career.md              # Índice de historias STAR, gaps, objetivos
│   ├── MOC-Projects.md            # Índice de todos los proyectos activos/pasados
│   └── MOC-Patterns.md            # Índice de patrones y anti-patrones
│
├── 10-Projects/                   # Un directorio por proyecto activo o pasado
│   ├── saas-factory/
│   │   ├── index.md               # Overview del proyecto: stack, estado, links
│   │   ├── sprint-retros/         # Retros por sprint
│   │   ├── decisions/             # ADRs del proyecto (mirror de docs/architecture/decisions/)
│   │   └── learnings.md           # Aprendizajes acumulados del proyecto
│   └── [proyecto-siguiente]/
│
├── 20-Patterns/                   # Patrones y anti-patrones de arquitectura
│   ├── anti-patterns/
│   │   ├── premature-mfe.md       # MFE para 0 usuarios
│   │   ├── types-before-er.md     # TypeScript antes del ER diagram
│   │   ├── build-before-validate.md  # Construir antes de validar el problema
│   │   └── unauthenticated-ai-endpoint.md
│   ├── patterns/
│   │   ├── single-instance-multitenancy.md
│   │   ├── demo-first-sales-flow.md
│   │   ├── defense-in-depth-ai.md
│   │   └── three-tier-component-classification.md
│   └── workflow/
│       └── idea-to-dev.md         # Mirror de docs/workflow/idea-to-dev.md
│
├── 30-Architecture/               # Conocimiento de arquitectura reutilizable
│   ├── ADRs/                      # ADRs generales (no de un proyecto específico)
│   ├── C4-examples/               # Ejemplos de diagramas C4 reutilizables
│   ├── finops/                    # Modelos de costo, benchmarks, estrategias
│   └── security/                  # Threat models, checklists de seguridad
│
├── 40-Career/                     # Desarrollo de carrera
│   ├── Gaps/                      # Brechas de skill identificadas
│   │   └── gap-analysis.md        # Análisis de brechas vs rol objetivo
│   ├── STAR-Stories/              # Historias STAR para entrevistas
│   │   ├── catching-architectural-drift.md
│   │   ├── finops-multitenancy.md
│   │   ├── ai-sales-flow.md
│   │   ├── module-federation-tradeoffs.md
│   │   ├── ai-endpoint-security.md
│   │   └── component-library-strategy.md
│   ├── interviews/                # Notas post-entrevista
│   └── objectives.md              # OKRs personales de carrera
│
├── 50-Daily/                      # Notas diarias (generadas por el plugin Calendar)
│   ├── 2026/
│   │   ├── 2026-05-17.md
│   │   └── ...
│   └── templates/
│       └── daily-template.md
│
└── 60-Templates/                  # Templates de Templater
    ├── ADR-template.md
    ├── sprint-retro-template.md
    ├── STAR-story-template.md
    ├── idea-brief-template.md
    └── project-index-template.md
```

### Descripción de cada directorio

| Directorio | Propósito | Frecuencia de actualización |
|------------|-----------|----------------------------|
| `00-MOC/` | Índices que aglutinan notas relacionadas. El punto de entrada cuando buscas algo sin saber exactamente dónde está. | Semanal |
| `10-Projects/` | Un directorio por proyecto. Captura el contexto específico del proyecto: decisiones, retros, aprendizajes. | Por sprint |
| `20-Patterns/` | Patrones y anti-patrones reutilizables extraídos de proyectos. El conocimiento destilado que vale en cualquier contexto. | Por incidente / aprendizaje |
| `30-Architecture/` | Conocimiento arquitectónico general: ADRs no vinculados a un proyecto específico, modelos FinOps, checklists de seguridad. | Mensual |
| `40-Career/` | Historias STAR, análisis de gaps, notas post-entrevista, objetivos de carrera. | Mensual + post-entrevista |
| `50-Daily/` | Notas diarias. Reflexiones cortas, ideas, blockers, preguntas. No necesitan ser perfectas — son el scratchpad. | Diario si el hábito está activo |
| `60-Templates/` | Templates de Templater. No se editan directamente — se usan para crear nuevas notas. | Cuando se crea un nuevo template |

---

## Flujo de trabajo diario

### Después de cada sprint: Sprint Retro

Crear una nueva nota en `10-Projects/[proyecto]/sprint-retros/` usando el template:

```
Ctrl+P -> "Templater: Create note from template" -> sprint-retro-template
```

El template `sprint-retro-template.md` contiene:

```markdown
---
tags: [retro, sprint, {{project}}]
date: <% tp.date.now("YYYY-MM-DD") %>
sprint: {{sprint-number}}
---

# Sprint {{sprint-number}} Retro — {{project}}

## ¿Qué salió bien?

- 

## ¿Qué salió mal?

- 

## ¿Qué haríamos diferente?

- 

## Decision técnica más importante del sprint

<!-- Si tomaste una decisión técnica significativa, documéntala aquí y crea el ADR correspondiente -->

## ¿Hay un anti-patrón que encontraste?

<!-- Si sí, crea la nota en 20-Patterns/anti-patterns/ -->

## ¿Hay una historia STAR nueva?

<!-- Si sí, crea la nota en 40-Career/STAR-Stories/ -->
```

### Después de cada decisión arquitectónica: ADR

Crear una nueva nota en `10-Projects/[proyecto]/decisions/` (y mirror en `30-Architecture/ADRs/` si es genérica):

```
Ctrl+P -> "Templater: Create note from template" -> ADR-template
```

El template `ADR-template.md` contiene:

```markdown
---
tags: [ADR, {{project}}, {{status}}]
date: <% tp.date.now("YYYY-MM-DD") %>
status: Proposed
---

# ADR-{{number}}: {{title}}

**Estado:** Proposed | Accepted | Deprecated | Superseded
**Fecha:** <% tp.date.now("YYYY-MM-DD") %>
**Proyecto:** {{project}}

## Contexto

<!-- ¿Qué situación requiere esta decisión? -->

## Opciones consideradas

### Opción A: {{opcion-a}}

**Pros:**
- 

**Cons:**
- 

### Opción B: {{opcion-b}}

**Pros:**
- 

**Cons:**
- 

## Decisión

**Elegimos:** Opción X

## Justificación

<!-- ¿Por qué esta opción sobre las demás? -->

## Consecuencias

**Se vuelve más fácil:**
- 

**Se vuelve más difícil:**
- 

**Condiciones para revisitar esta decisión:**
- 
```

### Después de cada entrevista: STAR Story

Crear o actualizar una nota en `40-Career/STAR-Stories/`:

```
Ctrl+P -> "Templater: Create note from template" -> STAR-story-template
```

El template `STAR-story-template.md` contiene:

```markdown
---
tags: [STAR, entrevista, {{competencia}}]
date: <% tp.date.now("YYYY-MM-DD") %>
competencia: {{competencia}}
nivel: Staff | Principal | Architect
---

# STAR: {{titulo}}

**Pregunta objetivo:** "{{pregunta}}"
**Tiempo estimado:** X minutos
**Competencia principal:** {{competencia}}

## Situation

<!-- Contexto. ¿Qué estaba pasando? ¿Cuál era el estado antes de tu intervención? -->

## Task

<!-- ¿Cuál era tu responsabilidad específica? ¿Qué se esperaba de ti? -->

## Actions

<!-- Lista numerada de acciones. Usa "I" no "we". Sé específico — números, tecnologías, decisiones. -->

1. 
2. 
3. 

## Result

<!-- Impacto cuantificado cuando sea posible. ¿Qué mejoró, cuánto, para quién? -->

## Follow-up questions y respuestas

**Q: **
A: 

**Q: **
A: 

## Notas post-entrevista

<!-- Después de usar esta historia en una entrevista, ¿qué funcionó? ¿qué no? -->
```

### Revisión semanal

Cada semana (ej. viernes, 20 minutos):
```
[ ] Abrir MOC-Projects.md — ¿hay proyectos con estado desactualizado?
[ ] Abrir MOC-Career.md — ¿hay STAR stories nuevas por documentar?
[ ] Revisar notas diarias de la semana — ¿hay algo que merece una nota permanente?
[ ] Actualizar el gap-analysis.md si hubo aprendizajes relevantes
```

### Revisión mensual

Cada mes (30 minutos):
```
[ ] Revisar gap-analysis.md — ¿las brechas de skill han cambiado?
[ ] Revisar STAR-Stories/ — ¿hay historias que mejorar o agregar?
[ ] Revisar anti-patterns/ — ¿hay nuevos patrones que documentar?
[ ] Revisar objectives.md — ¿los OKRs de carrera siguen siendo los correctos?
```

---

## Integración con Claude Code

El vault no es solo para notas manuales. Claude Code escribe directamente en el vault cuando se ejecutan ciertos skills.

### El skill `/adr-write`

Cuando se ejecuta `/adr-write` en un proyecto, Claude Code escribe el ADR en **dos lugares simultáneamente:**

1. `docs/architecture/decisions/ADR-NNN-titulo.md` — en el repositorio del proyecto (versionado en Git con el código)
2. `~/obsidian/architect-brain/10-Projects/[proyecto]/decisions/ADR-NNN-titulo.md` — en el vault personal (sincronizado al vault privado)

Esto significa que el vault se auto-puebla con las decisiones arquitectónicas del proyecto sin trabajo adicional.

### El skill `/star-story`

Cuando se ejecuta `/star-story` después de un proyecto o evento significativo, Claude Code escribe la historia STAR en **dos lugares:**

1. `docs/interview/star-method.md` — en el repositorio del proyecto (contextualizado al proyecto)
2. `~/obsidian/architect-brain/40-Career/STAR-Stories/[historia].md` — en el vault personal

### Flujo resultante

```
Trabajo en proyecto
       |
       v
Toma decisión arquitectónica
       |
       v
Claude Code escribe ADR (via /adr-write)
       |
       +---> docs/architecture/decisions/  (repo del proyecto)
       |
       +---> ~/obsidian/architect-brain/10-Projects/  (vault personal)
                              |
                              v
                   Obsidian Git auto-commit en 10 min
                              |
                              v
                   Repositorio privado GitHub
```

El arquitecto nunca tiene que "recordar actualizar el vault" — las decisiones importantes se capturan automáticamente como efecto secundario del trabajo normal.

---

## Sincronización

### Opción A (recomendada): Obsidian Git Plugin

El plugin Obsidian Git hace auto-commit y auto-push cada 10 minutos a un repositorio privado en GitHub.

Configuración completa:

```bash
# 1. Crear repositorio privado en GitHub (hacer esto desde la UI de GitHub)
# Nombre sugerido: architect-brain-private
# Visibilidad: Private (NUNCA public — contiene notas personales de carrera)

# 2. Configurar el vault como repositorio Git
cd ~/obsidian/architect-brain
git init
git branch -M main

# 3. Configurar remote (usar SSH, no HTTPS, para evitar autenticación repetida)
git remote add origin git@github.com:tu-usuario/architect-brain-private.git

# 4. Commit inicial
git add .
git commit -m "vault: initial setup"
git push -u origin main
```

`.gitignore` del vault (para no versionar archivos de configuración de Obsidian):

```gitignore
# Obsidian workspace state (no necesita versionarse)
.obsidian/workspace
.obsidian/workspace.json
.obsidian/cache

# Archivos temporales del sistema
.DS_Store
Thumbs.db

# El vault ES el repositorio — no hay nada más que excluir
```

**Importante:** El directorio `~/obsidian/architect-brain/` es un repositorio Git separado del proyecto `sass-factory`. Nunca se mezclan. El `.gitignore` del proyecto sass-factory debe incluir cualquier path que apunte al vault:

```gitignore
# En .gitignore del proyecto sass-factory (si existiera un symlink)
/obsidian/
```

### Opción B: iCloud Sync (solo macOS/iOS)

Si se trabaja exclusivamente en el ecosistema Apple:

1. Mover el vault a `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/architect-brain/`
2. Abrir Obsidian y apuntar al nuevo path
3. Activar Obsidian Sync en iPhone/iPad si se quiere acceso móvil

**Nota:** iCloud Sync no da control de versiones — no hay historial de cambios, no hay diff, no hay rollback. Para un vault de conocimiento profesional, Git es superior.

### Por qué el vault NUNCA va en el repositorio del proyecto

El vault personal contiene:
- Reflexiones sobre el trabajo de otros (notas de entrevistas con candidatos, observaciones sobre clientes)
- Notas de carrera personales (salario objetivo, empresas de interés, debilidades propias)
- Historias STAR con contexto que podría ser sensible si se publica
- ADRs de proyectos anteriores que pueden ser confidenciales

El repositorio del proyecto es público o potencialmente accesible a clientes y colegas. El vault es privado. Estos dos mundos no se mezclan.

---

## El anti-patrón a evitar

> "Tengo Obsidian instalado, el vault configurado, los plugins activos, y el template perfecto. Y no lo he usado en 3 semanas."

Este es el anti-patrón más común en herramientas de gestión de conocimiento. La infraestructura perfecta no reemplaza el hábito.

### La regla mínima

Si el vault tiene 0 entradas después de 2 semanas desde la instalación, la herramienta no está funcionando. Revisar si el problema es:

- **El flujo es demasiado complejo** — simplificar a: una nota en texto plano, sin template, sin tags, sin links. El sistema se puede mejorar después.
- **El momento de captura está mal** — si el flujo requiere abrir Obsidian manualmente, no va a pasar. Integrar la captura al final de cada sesión de trabajo como el último paso del checklist de sprint.
- **Las notas no se usan después** — si escribes en el vault pero nunca lo relees, el sistema no tiene valor percibido. Programar 20 minutos semanales de revisión como evento recurrente en el calendario.

### Los tres compromisos mínimos

```
[ ] Mínimo 1 nota por sprint (puede ser un retro, puede ser un aprendizaje de una sola línea)
[ ] Mínimo 1 nota por cada ADR que se escriba en un proyecto
[ ] Mínimo 1 STAR story nueva o actualizada por mes
```

Si se cumplen estos tres, el vault acumula valor compuesto con el tiempo. Después de 12 meses, tiene:
- 24+ retrospectivas de sprint
- Un ADR por cada decisión técnica importante
- 12+ historias STAR actualizadas

Eso es suficiente para entrar a cualquier entrevista Staff/Principal sin preparación adicional — el vault ya tiene las historias listas.

### La señal de que el sistema está funcionando

Cuando alguien te pregunta en una entrevista "tell me about a time you [X]" y tu primera instinto es abrir el vault en lugar de intentar recordar algo — el sistema está funcionando.

---

*Documento creado: Mayo 2026. Vault path: `~/obsidian/architect-brain/`. Este documento vive en `docs/setup/obsidian-setup.md` del proyecto sass-factory y en `~/obsidian/architect-brain/10-Projects/saas-factory/index.md`.*
