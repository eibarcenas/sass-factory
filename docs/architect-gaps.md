# 10 Gaps de Arquitectura — Erick Bárcenas

> Revisión honesta y sin complacencia de los gaps en el estilo de trabajo arquitectónico de Erick Bárcenas, identificados durante una sesión de planificación del proyecto SaaS Factory en la que Claude actuó como CTO. El objetivo es cerrar la brecha hacia Staff/Principal Engineer. Estos no son errores de habilidad técnica — son patrones de comportamiento que limitan el impacto a escala de equipo y organización.

---

## Gap 1: Validación antes que arquitectura

### Observado en este proyecto

Se diseñaron 8 sprints completos — con agentes asignados, tareas detalladas, y tipos de TypeScript — antes de confirmar cuál de los dos productos dentro del repositorio era el correcto. El monorepo contenía simultáneamente landing pages de eventos (bodas, cumpleaños, día de madres) y catálogos de negocios locales (restaurantes, tiendas, ferreterías). Los tipos de `@sass-factory/core` se diseñaron con `AppTopic`, `TOPIC_PRESETS`, y `AppFeature` antes de haber hablado con un solo prospecto real sobre cuál problema resolvía el producto.

Cuando se decidió pivotar al catálogo, Sprint 0 tuvo que dedicarse enteramente a eliminar la arquitectura de eventos — trabajo que no generó valor para el usuario sino que pagó la deuda de haber construido sin validar. La arquitectura de deployment (Cloud Run por slug, Firestore por colección de negocios, MFE por remote) fue completamente especificada y documentada antes de que existiera evidencia de que alguien quisiera pagar por el producto.

### Por qué importa a nivel Staff/Principal

Un Staff Engineer que diseña un sistema para el producto equivocado desperdicia el tiempo de todo el equipo. El daño no es solo técnico — es organizacional. Los sprints gastados en eliminar trabajo de eventos no construyeron confianza ni capacidad. El presupuesto de sprint se consumió pagando deuda arquitectónica en lugar de crear valor entregable.

A nivel Principal, se espera que seas el freno de mano antes de que el equipo salga a la carretera sin mapa. Eso significa decirle al producto: "No construimos hasta que tengamos validación mínima de que este problema existe y que esta solución tiene demanda." Las empresas que tienen principios de este tipo no pivotean después de Sprint 0.

### Cómo cerrar el gap

1. Antes de cualquier trabajo técnico — incluyendo el diagrama de arquitectura, los tipos de TypeScript, o el scaffold del monorepo — escribe un "problem brief" de una página con esta estructura:
   - Problema: ¿Qué dolor específico tiene el usuario?
   - Usuario: ¿Quién exactamente lo sufre? (nombre, rol, industria)
   - Frecuencia: ¿Con qué frecuencia lo enfrenta?
   - Intensidad: ¿Cuánto le duele en dinero, tiempo, o frustración?
   - Solución actual: ¿Cómo lo resuelve hoy?
   - Modelo de monetización: ¿Cómo exactamente hacemos dinero con esto?

2. Realiza 3 entrevistas con clientes potenciales reales (no familiares, no conocidos que quieren apoyar) antes de Sprint 0. Las entrevistas deben seguir el formato Jobs to Be Done: "Cuéntame la última vez que intentaste resolver este problema." Si las respuestas no confirman el dolor, la arquitectura espera.

3. Establece una regla personal: no se abre ningún archivo de tipos ni se crea ningún sprint file hasta que el problem brief esté escrito y al menos una entrevista esté completada.

4. En el ADR de cualquier decisión de stack o arquitectura, agrega una sección "Evidencia de validación" que referencia la entrevista o datos que justifican construir este sistema.

5. En la retrospectiva de cada sprint, incluye la pregunta: "¿Construimos lo correcto esta semana? ¿Qué evidencia tenemos?"

### Métrica de mejora

Cero pivots de producto después de Sprint 1. El problem brief existe y tiene al menos una entrevista de usuario referenciada antes del primer commit de código de negocio.

### Tiempo estimado

4 semanas para desarrollar el hábito de escribir el problem brief. 3 meses para que sea instintivo — que no puedas imaginar empezar sin él.

---

## Gap 2: Builder's Trap

### Observado en este proyecto

Durante la sesión de revisión de arquitectura, el arquitecto admitió directamente: "hago muchas ideas, hago demos pero no las vendo, nadie las usa." Este patrón fue visible en el proyecto: se construyó un demo completo de landing pages de eventos con tipos completos, configuración de Firestore, y planificación de sprints antes de intentar venderlo a alguien. El producto de catálogos también fue arquitectado antes de ser validado. La energía del proyecto se gastó en construir sistemas técnicamente interesantes en lugar de en encontrar el primer cliente pagador.

El Builder's Trap es la tendencia del engineer talentoso a resolver el problema técnico — que es estimulante, medible, y dentro de control — en lugar de resolver el problema de mercado, que es ambiguo, social, y depende de otras personas. El resultado es un portfolio de demos bien construidos que nadie usa.

### Por qué importa a nivel Staff/Principal

Un Staff Engineer que construye demos que nadie usa no está generando valor de negocio — está generando experiencia técnica personal a costo del negocio. A nivel de carrera, los demos no vendidos no son historias STAR de impacto. Son experimentos que nunca llegaron a producción.

A nivel de liderazgo, el Builder's Trap es contagioso. Un tech lead que celebra la construcción técnica por encima del impacto al usuario entrena a su equipo para hacer lo mismo. Los equipos de alta performance miden el éxito por el uso real del producto, no por la elegancia de la implementación.

Los Principal Engineers son reconocidos por su impacto en el negocio, no por la cantidad de código que producen. Si no puedes articular cómo tu trabajo llegó a usuarios reales, la carrera se estanca en Senior.

### Cómo cerrar el gap

1. Antes de construir cualquier demo, escribe el "pitch de 5 minutos" por escrito: qué problema resuelve, para quién, qué hace diferente a lo que ya existe, y cuánto costaría. Si no puedes escribir este pitch antes de construir, el demo no debería existir.

2. Define "done" para cada demo como: alguien que no eres tú ni alguien que quiere apoyarte ha visto el demo y expresó interés genuino (no cortesía). Hasta ese punto, el demo no está terminado — solo está construido.

3. Establece una regla de tiempo: por cada hora de construcción técnica en un proyecto personal, dedica al menos 30 minutos a actividades de distribución — mostrar el demo, escribir sobre él, pedir feedback, intentar una venta.

4. Lleva un registro de los demos que construiste en los últimos 12 meses y para cada uno, documenta: ¿cuántas personas lo usaron?, ¿cuántos pagaron?, ¿por qué murió? Este registro es el espejo más claro del patrón.

5. Para el SaaS Factory específicamente: antes de construir el admin panel completo, consigue un compromiso verbal de al menos un dueño de negocio local de que pagaría $35/mes por la solución. La arquitectura sigue al compromiso, no al revés.

### Métrica de mejora

Al menos un usuario real usando el producto antes de completar Sprint 3. El ratio de "proyectos construidos" a "proyectos con usuarios reales" mejora de su nivel actual a al menos 1:2 en el siguiente año.

### Tiempo estimado

El cambio de mentalidad es inmediato — es una decisión. El hábito de buscar validación antes de construir toma 3-6 meses de práctica consciente, especialmente cuando la tendencia natural es hacia la construcción.

---

## Gap 3: ADRs informales

### Observado en este proyecto

El proyecto tiene un archivo `docs/planning/decisions.md` que es una tabla de dos columnas: decisión y justificación breve. Ejemplos: "Firestore Native mode — Real-time, vector search, Firebase Auth integration." Esta tabla no es un ADR. La diferencia es fundamental.

Un ADR contiene: el contexto en el momento de la decisión, el problema específico que se estaba resolviendo, las alternativas que se evaluaron seriamente (no solo la elegida), las consecuencias positivas y negativas conocidas, los riesgos identificados, y un trigger para revisitar la decisión. La tabla de `decisions.md` no contiene nada de eso.

Las decisiones de alto impacto tomadas en este proyecto sin ADR formal incluyen: ¿por qué Nuxt 4 sobre Next.js 15?, ¿por qué Firestore sobre PostgreSQL + Supabase?, ¿por qué Module Federation para un MVP con 0 usuarios?, ¿por qué pnpm workspaces sin Turborepo si el lock file ya es un pain point?, ¿por qué Gitflow y no trunk-based development? En 6 meses, cuando alguien pregunte la razón de cualquiera de estas decisiones, la respuesta de la tabla es insuficiente.

### Por qué importa a nivel Staff/Principal

Los ADRs son el mecanismo por el cual los Staff Engineers preservan el conocimiento institucional. Sin ADRs, cada vez que un engineer nuevo pregunta "¿por qué hacemos esto así?", alguien con contexto original tiene que responder — o nadie puede responder y se toma la misma decisión de nuevo sin el beneficio de la experiencia previa.

Los ADRs también previenen la re-litigación de decisiones. Cuando una decisión está documentada con su contexto y consecuencias, es mucho más difícil para un engineer nuevo argumentar en contra sin haber leído el ADR completo. El ADR es la defensa institucional contra debates que ya fueron resueltos.

A nivel Principal, los ADRs son la evidencia de que tienes el hábito de razonar sobre arquitectura de manera estructurada, no intuitiva. En una entrevista de Staff o Principal, la pregunta "¿cómo documentas las decisiones de arquitectura?" tiene una respuesta muy diferente si tienes 10 ADRs o si tienes una tabla de dos columnas.

### Cómo cerrar el gap

1. Retroactivamente, escribe ADRs para las 5 decisiones de mayor impacto y más costosas de revertir en este proyecto: stack frontend (Nuxt 4), base de datos (Firestore), arquitectura MFE, sistema de auth (Firebase Auth), y estrategia de branching (Gitflow). Esto toma 4 horas y debe hacerse esta semana.

2. Crea la carpeta `docs/architecture/decisions/` y el archivo `index.md` que lista todos los ADRs con número, título, fecha, y estado. Cada nuevo ADR se registra en el index el mismo día que se escribe.

3. Usa esta plantilla mínima para todos los ADRs nuevos:
   ```
   # ADR-N: Título

   Fecha: YYYY-MM-DD
   Estado: Propuesto | Aceptado | Deprecado | Reemplazado por ADR-M

   ## Contexto
   Qué problema estamos resolviendo. Qué restricciones existen.

   ## Decisión
   Qué decidimos hacer.

   ## Consecuencias positivas
   ## Consecuencias negativas
   ## Riesgos

   ## Alternativas consideradas
   Para cada alternativa: qué es, pros, contras, por qué no se eligió.

   ## Cuándo revisitar esta decisión
   ```

4. Establece una regla de sprint: ninguna decisión técnica que sea difícil o costosa de revertir se implementa sin un ADR en estado "Aceptado" primero. Si la decisión es urgente, el ADR se escribe en el mismo día antes de tocar código.

5. Usa el skill `/adr-write` para reducir la fricción de escritura. La fricción es el principal enemy del hábito — si escribir un ADR toma 2 horas, no se hace. Si toma 20 minutos con el skill, sí se hace.

### Métrica de mejora

Cada decisión arquitectónica mayor tomada en este proyecto tiene un ADR en `docs/architecture/decisions/` dentro de la semana en que fue tomada. Al terminar los primeros 90 días del proyecto, existen al menos 8 ADRs con estado "Aceptado."

### Tiempo estimado

1 semana para escribir los ADRs retroactivos de las 5 decisiones clave. 2 sprints para hacer del ADR writing un hábito natural antes de implementar. 3 meses hasta que sea instintivo y la resistencia desaparezca.

---

## Gap 4: Complejidad prematura

### Observado en este proyecto

Module Federation fue elegido como arquitectura del frontend para un MVP con 0 usuarios, 0 equipos paralelos, y 0 remotes en producción al momento de la decisión. Los beneficios reales de MFE — equipos independientes deployando independientemente, remotes reemplazables sin rebuilds del host — solo existen cuando hay múltiples equipos trabajando en paralelo. Con un equipo de uno, los beneficios son cero y los costos son concretos y medibles.

Costos reales de esta decisión en el proyecto: `@module-federation/vite` con Nuxt 4 es una combinación relativamente nueva con integraciones de SSR documentadas como problemáticas en los GitHub issues del repositorio. La configuración del host y el remote requiere pipelines de deployment separados. El debugging de dependencias compartidas entre host y remote es significativamente más complejo que el debugging en un monolito modular bien estructurado. El setup inicial suma al menos 2 semanas de trabajo antes de que se pueda escribir una sola línea de feature code.

### Por qué importa a nivel Staff/Principal

Los Principal Engineers saben cuándo NO usar un patrón. Eso es más valioso que saber cómo implementarlo correctamente. La tentación del over-engineering es especialmente fuerte para engineers talentosos: tienes la capacidad técnica de construirlo, conoces el patrón en teoría, así que lo construyes — sin preguntarte si el proyecto en su estado actual lo necesita.

La mejor arquitectura es la más simple que cumple los requisitos actuales, no los hipotéticos de dentro de 18 meses. YAGNI no es una concesión a la mediocridad — es disciplina de ingeniería madura que preserva el tiempo del equipo para trabajo que genera valor ahora.

Un Staff Engineer que propone MFE para un MVP sin usuarios va a ganar reconocimiento técnico en la reunión de arquitectura y va a ralentizar el time-to-market en 2 semanas. Los CPOs y founders miden el impacto en tiempo a producción, no en elegancia de la solución.

### Cómo cerrar el gap

1. Antes de elegir cualquier patrón de arquitectura complejo (MFE, event sourcing, CQRS, hexagonal architecture), escribe en una oración la necesidad concreta que justifica esa complejidad hoy, no en el futuro. "Tenemos múltiples equipos que necesitan deployar independientemente" es concreto. "Eventualmente tendremos múltiples equipos" no lo es.

2. Aplica la regla de las 3 strikes: el primer strike es identificar el problema. El segundo strike es cuando el problema se repite con impacto medible. El tercer strike es cuando el costo del problema supera el costo de la solución compleja. Solo en el tercer strike se introduce la complejidad.

3. Para este proyecto específicamente: empieza con un monolito Nuxt 4 bien estructurado con límites de módulos claros usando carpetas y reglas de ESLint para enforcar boundaries. Extrae a MFE cuando existan 2 equipos con pipelines independientes o cuando el tiempo de build supere los 10 minutos.

4. En el ADR de cada decisión de arquitectura, agrega la sección "¿Cuándo revisitar esta decisión?" Para la decisión de MFE, la respuesta sería: "Cuando haya 2+ equipos con pipelines de deployment independientes." Esto hace explícito que la decisión actual es temporal y tiene un trigger de revisión definido.

5. Celebra la simplicidad internamente: cuando eliges la opción más simple sobre la más técnicamente interesante, documenta por qué. Ese registro de decisiones de simplicidad consciente es evidencia de madurez de ingeniería.

### Métrica de mejora

Time-to-first-deploy del MVP es menor a 4 semanas desde el inicio del proyecto. Las decisiones de arquitectura tienen una sección "¿Por qué no una solución más simple?" que demuestra que la opción simple fue considerada antes de elegir la compleja.

### Tiempo estimado

Inmediato en términos de decisión — es un cambio de postura, no de habilidad. El hábito de preguntar "¿debería construir esto ahora?" antes de "¿puedo construir esto?" toma 3-6 meses de práctica consciente en cada decisión.

---

## Gap 5: Sin spike discipline

### Observado en este proyecto

Module Federation con Nuxt 4 es una combinación que tiene friction documentada en los GitHub issues de `@module-federation/vite`. La integración con SSR de Nuxt tiene casos edge conocidos con composables de Pinia compartidos entre host y remote. Este riesgo fue identificado durante la planificación — y luego ignorado. No se realizó ningún spike de validación antes de comprometer la arquitectura completa y diseñar 8 sprints sobre ella.

Un spike es un experimento throwaway: código que se escribe para responder una pregunta técnica específica y que se elimina después, sin PR ni review ni persistencia. Su costo es 1 día. Su beneficio es certeza o redirección temprana antes de invertir semanas. En este proyecto, se comprometió Nuxt 4 + MFE a la arquitectura sin el spike de 1 día que habría confirmado o refutado que la integración funciona con las necesidades específicas del proyecto.

### Por qué importa a nivel Staff/Principal

Los Staff Engineers tienen un radar calibrado para el riesgo técnico. Cuando identifican una "known-unknown" — algo que saben que no saben — actúan inmediatamente con un spike, no con esperanza ni con extrapolación de documentación de terceros. Comprometerse a una tecnología con riesgo conocido sin validación primero es como aceptar una dependencia en producción sin leer su código.

El costo de un spike fallido es 1 día y un ADR que dice "evaluamos X y no funciona con nuestra configuración, elegimos Y en cambio." El costo de descubrir que X no funciona en el día 10 de Sprint 1 es 2 semanas de reescritura, morale dañada, y un sprint que no cumplió sus objetivos.

El spike discipline es también la base del credibility técnico: cuando dices "esto va a funcionar", tienes evidencia. Cuando dices "esto es riesgoso", tienes un spike fallido documentado que lo respalda.

### Cómo cerrar el gap

1. En cada ADR que marca una tecnología como "riesgosa" o "nueva combinación no probada", el ADR no puede pasar a estado "Aceptado" hasta que exista un spike companion con resultado documentado.

2. Escribe la pregunta del spike con precisión quirúrgica antes de ejecutarlo. "¿Funciona MFE con Nuxt 4?" es demasiado amplia. La pregunta correcta es: "¿Puede un composable Pinia definido en el host de MFE ser consumido por un remote sin duplicar el store en memoria, cuando SSR está habilitado en ambos?"

3. El spike sigue estas 4 reglas sin excepción:
   - Es throwaway: no hace PR, no va a develop, se elimina al terminar.
   - Tiene una pregunta binaria: funciona o no funciona (con estos workarounds).
   - Tiene un time box de 1 día máximo: si en 1 día no hay respuesta, la respuesta es "demasiado riesgoso para el tiempo disponible."
   - El resultado se documenta en el ADR antes de que la decisión se implemente.

4. Para Nuxt 4 + MFE específicamente: ejecuta el spike antes de Sprint 1. Si pasa, Sprint 1 procede con MFE. Si falla, Sprint 1 usa el monolito modular y el ADR de MFE documenta la decisión de diferir.

5. Agrega "spike requerido" como un campo booleano al template de ADR. Si es true, el ADR no puede ser aceptado sin el resultado del spike.

### Métrica de mejora

Cero tecnologías marcadas como "riesgosas" en un ADR sin un spike companion completado y documentado antes de que comience la implementación. El sprint que sigue a un spike fallido cambia de dirección — no sigue adelante con esperanza.

### Tiempo estimado

2 semanas para ejecutar el primer spike y desarrollar el instinto de "esto es riesgoso, necesito un spike." 3 meses para que sea parte automática de la planificación de sprint y no requiera recordatorios externos.

---

## Gap 6: Sin capacity planning

### Observado en este proyecto

El objetivo de costos fue declarado como "500 negocios, $35/mes" — una cifra específica y ambiciosa — sin ningún modelo de carga que la sustente. No existe ningún documento en el repositorio que responda:

- ¿Cuántos requests por segundo genera un catálogo de 500 negocios durante hora pico (mediodía un sábado)?
- ¿Cuántas lecturas de Firestore se generan por page load en el storefront de un negocio con 20 ítems y sus imágenes?
- ¿Cuánto crecen las colecciones de `clicks` y `prospects` por mes con 500 negocios activos y un 2% de conversion rate?
- ¿Cuánto storage consume un logo + 20 fotos de productos por negocio, multiplicado por 500?
- ¿Cuánto bandwidth genera Cloud Run sirviendo el storefront con SSR a 1,000 visitantes únicos por día?

Sin este modelo, la cifra de $35/mes es una aspiración, no una estimación. La arquitectura se diseñó sobre esa aspiración. Si el modelo real de costos resulta ser $85/mes a 100 negocios, toda la arquitectura de pricing está equivocada.

### Por qué importa a nivel Staff/Principal

A nivel Staff, se espera que dimensiones los sistemas correctamente. Subdimensionar causa outages en producción. Sobredimensionar desperdicia el capital del negocio en infraestructura innecesaria. Ambos son fallos de liderazgo técnico, no accidentes de implementación.

Los Principal Engineers no aceptan cifras de costo sin el modelo que las respalda. "Será barato" no es arquitectura — es esperanza. La planificación de capacidad es el puente entre un requisito de negocio ("debe costar menos de $35/mes") y una decisión de arquitectura ("por eso elegimos Firestore free tier en lugar de Cloud SQL, y por eso ponemos límites de rate en el generador de AI, y por eso usamos Cloud Run con min-instances=0").

Sin ese puente, las decisiones de arquitectura parecen arbitrarias. Con ese puente, cada decisión de arquitectura tiene una justificación cuantitativa.

### Cómo cerrar el gap

1. Escribe un modelo de capacidad antes de que comience cualquier sprint de infraestructura. El modelo mínimo incluye:
   - Supuestos de baseline: negocios activos, DAU estimado por negocio, factor de pico
   - Volumen de operaciones: reads y writes de Firestore por page load, totales por día
   - Storage: tamaño promedio por negocio, crecimiento mensual, proyección a 12 meses
   - Compute: requests/segundo en pico, tiempo de respuesta de Cloud Run, instancias en pico
   - Estimación total: Firestore + Cloud Run + Cloud Storage + otros servicios

2. Expresa el modelo en términos del negocio, no solo en términos técnicos: "a 100 negocios activos con 50 visitantes únicos por día cada uno, el costo estimado es $X/mes. El modelo no supera $35/mes hasta Y negocios."

3. Valida el modelo con una cuenta de GCP real: crea el proyecto, habilita los servicios, genera tráfico sintético equivalente a 10% del baseline, y extrapola el costo real a 100%.

4. Agrega el modelo de capacidad al template del ADR de infraestructura como sección obligatoria. Si el ADR no tiene modelo de capacidad, no puede ser aceptado.

5. Revisa el modelo de capacidad al final de cada sprint de infraestructura: ¿los costos reales están dentro del 20% de la estimación? Si no, actualiza el modelo y el ADR con los números reales.

### Métrica de mejora

El modelo de capacidad existe en `docs/infrastructure/cost-model.md` antes de que comience Sprint 4 (infraestructura). El costo real del primer mes en producción está dentro del 20% de la estimación del modelo.

### Tiempo estimado

1 semana para escribir el primer modelo de capacidad para SaaS Factory. 3 meses para que la estimación de costos sea parte natural del diseño de arquitectura, no un paso separado que se agrega después.

---

## Gap 7: Sin Definition of Ready

### Observado en este proyecto

El proyecto tiene un Definition of Done (DoD) bien definido en la documentación: typecheck, lint, tests, criterios específicos por sprint. No existe un Definition of Ready (DoR). Las historias en los sprint files se asignan a agentes sin verificar que:

- El Gherkin está escrito con al menos un escenario Happy Path y un escenario de error
- El contrato de API está definido: método HTTP, path, request schema, response schema, error codes
- El diseño o wireframe existe como referencia visual
- Las dependencias bloqueantes están resueltas antes de que el agente comience
- No hay preguntas sin responder en la descripción de la historia

El riesgo concreto: un sub-agente comienza a implementar un endpoint de API sin que el contrato esté definido, y el endpoint que produce no coincide con lo que el frontend espera. El trabajo tiene que rehacerse. En el contexto de sprints con múltiples agentes paralelos, ese re-trabajo no es visible inmediatamente — el conflicto emerge en el momento de integración, cuando es más caro de resolver.

### Por qué importa a nivel Staff/Principal

Las historias iniciadas sin DoR crean churn: el agente implementa la API incorrecta, el diseño cambia durante el sprint, el Gherkin se escribe después del código en lugar de antes. El DoR es el seguro contra ese churn. En un equipo de múltiples personas — o múltiples agentes — el churn se multiplica porque cada agente que depende del trabajo del primero hereda el error.

Un Staff Engineer que lidera trabajo en paralelo necesita que las historias lleguen al queue en un estado que permita la ejecución sin fricción. Si los agentes constantemente necesitan parar y preguntar "¿cómo debería verse este endpoint?" o "¿existe un wireframe?", el paralelismo que justifica el modelo de sub-agentes desaparece completamente.

El DoR también protege al architect: cuando una historia regresa con un resultado inesperado, el DoR es la evidencia de que la historia no estaba lista — no de que el agente falló.

### Cómo cerrar el gap

1. Escribe el DoR explícito para este proyecto y agrégalo al CLAUDE.md y al template de sprint file. El DoR mínimo para SaaS Factory:
   - Gherkin escrito con al menos un escenario Happy Path y uno de error
   - Contrato de API definido (si la historia toca un endpoint): método, path, request schema, response schema, códigos de error
   - Referencia de diseño existe: wireframe, screenshot, o descripción exacta del comportamiento visual
   - Dependencias bloqueantes resueltas: si depende de un endpoint que no existe, ese endpoint está completado o hay un mock definido
   - Sin ambigüedades abiertas: no hay preguntas sin responder en la descripción

2. Antes de cada sprint, audita todas las historias del sprint contra el DoR. Las que no lo cumplen regresan a backlog refinement, no al sprint activo. Un sprint que comienza con historias que no cumplen el DoR está garantizando churn.

3. Para los sub-agentes: el primer paso de cada agente es verificar que la historia que va a ejecutar cumple el DoR. Si no lo cumple, el agente reporta el gap y espera antes de comenzar.

4. Usa el skill `/gherkin-to-test` como gate de DoR para las historias con lógica de negocio: si no hay Gherkin suficiente para generar tests, la historia no está lista.

5. Retroactivamente, revisa las historias de los sprints anteriores y documenta cuáles llegaron sin DoR. El patrón de qué partes del DoR se omiten más frecuentemente revela dónde está la mayor fricción en el proceso.

### Métrica de mejora

Cero historias enviadas de vuelta a "not ready" después de haber sido iniciadas por un agente. El tiempo promedio de implementación de historias baja cuando los agentes no tienen que parar a pedir clarificación.

### Tiempo estimado

1 sprint para implementar el DoR como checklist en el sprint file. 2 sprints para que la verificación del DoR sea parte automática de la planificación de sprint y no requiera recordatorios externos.

---

## Gap 8: Data model after code

### Observado en este proyecto

Los tipos de TypeScript en `packages/core/src/types/` — `business.ts`, `item.ts`, `prospect.ts` — fueron escritos directamente como interfaces de TypeScript. No existe ningún diagrama entidad-relación que preceda a esos tipos. Las relaciones entre entidades están implícitas en los campos (`businessId: string` en `Item` apunta a `Business`, `prospectId?: string` en `Business` apunta a `Prospect`) pero nunca se modelaron explícitamente como relaciones con cardinalidad y reglas de negocio antes de escribir el código.

Las preguntas que un ER diagram habría respondido antes de escribir una sola línea de TypeScript:
- ¿`Click` es una entidad independiente o una subcollection de `Business`?
- ¿`Category` puede existir sin `Business`? (No, pero eso no está expresado en el tipo — solo en la convención de la subcollection)
- ¿`Prospect` tiene una relación 1:1 o 1:N con `Business`?
- ¿Qué pasa con los `Item` cuando un `Business` es suspendido?
- ¿`ownerId` en `Business` apunta a `FirebaseAuth.uid`? ¿Está eso documentado en algún lugar que no sea el código?

### Por qué importa a nivel Staff/Principal

Los tipos de TypeScript son detalles de implementación. El modelo de datos es una herramienta conceptual que debe preceder a todo. Los ER diagrams — incluso en ASCII art en un sprint file — fuerzan a hacer explícitas las relaciones, la cardinalidad, y las reglas de negocio que de otra manera quedan enterradas en el código y son solo visibles para quien lo leyó todo.

Los ER diagrams también son el lenguaje común entre engineers y stakeholders no técnicos. Un founder puede revisar un ER diagram y confirmar "sí, un negocio puede tener muchos ítems pero cada ítem pertenece a exactamente un negocio." Ese mismo founder no puede revisar una interface de TypeScript con ese nivel de confianza.

A nivel Principal, eres responsable de que el modelo de datos sea correcto antes de que los engineers construyan encima de él. Un modelo incorrecto descubierto en producción en Firestore — donde no hay foreign key constraints — puede dejar datos huérfanos que son imposibles de detectar automáticamente y requieren migraciones manuales de datos.

### Cómo cerrar el gap

1. Antes de escribir cualquier tipo de TypeScript que represente una entidad de negocio, dibuja el ER diagram en ASCII en el sprint file. El formato mínimo muestra entidades, campos con tipo y constraint (PK, FK, UK), y relaciones con cardinalidad.

2. Los tipos de TypeScript se derivan del ER diagram, no al revés. El ER diagram es la fuente de verdad. Los tipos son la implementación de esa fuente de verdad.

3. Retroactivamente, escribe el ER diagram completo del SaaS Factory en `docs/architecture/data-model.md`. Verifica que los tipos de TypeScript existentes son consistentes con ese diagrama. Documenta cualquier discrepancia.

4. En el template del sprint file, agrega una sección "Modelo de datos" que requiere el ER diagram antes de que se asigne el trabajo al types-agent.

5. Cuando el ER diagram y los tipos de TypeScript diverjan — y eventualmente lo harán — el ER diagram es el que se actualiza primero, y el cambio de tipos es consecuencia de esa actualización, no al revés.

### Métrica de mejora

Cada sprint que toca modelos de datos tiene un ER diagram (incluso en ASCII) en el sprint file, escrito antes de que el types-agent comience. El ER diagram existe en `docs/architecture/data-model.md` y está actualizado al final de cada sprint.

### Tiempo estimado

1 semana para escribir retroactivamente el ER diagram completo del SaaS Factory. 2 sprints para que sea un hábito natural antes de tocar tipos. El diagrama ASCII toma 30 minutos — la fricción es baja una vez que el hábito está establecido.

---

## Gap 9: Sin fitness functions

### Observado en este proyecto

El proyecto tiene reglas arquitectónicas explícitas y bien pensadas:

- `packages/ui` no puede importar de `apps/`
- `packages/ui` no puede importar Firestore o Firebase Admin
- Los componentes de Tier 3 no se publican en el barrel export de `packages/ui/src/index.ts`
- `@sass-factory/core` es la única fuente de verdad para tipos compartidos
- Las apps no pueden importar directamente entre sí

Estas reglas existen en la documentación — en `CLAUDE.md` y en el spec de arquitectura. No existe ningún mecanismo automatizado que las enforce. La enforcement depende de code review humano, que es imperfecto especialmente cuando múltiples agentes trabajan en paralelo y los reviews de MR son rápidos.

La erosión arquitectónica no ocurre con un gran cambio violatorio que es fácil de detectar. Ocurre con 50 pequeñas excepciones que tienen sentido individualmente en contexto. Cada excepción tiene una justificación razonable en el momento. El resultado agregado a los 12 meses es un sistema donde las fronteras que existían en el papel no existen en el código.

### Por qué importa a nivel Staff/Principal

Los arquitectos de software saben que las reglas de arquitectura sin enforcement automatizado son sugerencias. La diferencia entre una arquitectura que se mantiene y una que se erosiona no es la calidad de las reglas — es si las reglas están en CI o solo en un documento.

Las architecture fitness functions son tests automatizados para propiedades arquitectónicas. Corren en CI y fallan el build si una constraint es violada. El engineer que viola la constraint recibe feedback inmediato — antes de que el código llegue a develop, no en la retrospectiva del trimestre siguiente.

A nivel Staff/Principal, implementar fitness functions es lo que separa "hablé sobre boundaries en el RFC" de "los boundaries son enforced y nadie puede violarlos accidentalmente." Uno es arquitectura de PowerPoint. El otro es arquitectura de producción.

### Cómo cerrar el gap

1. Configura Dependency Cruiser en la raíz del monorepo con estas reglas como primer conjunto de fitness functions:

```json
{
  "forbidden": [
    {
      "name": "ui-no-apps-import",
      "severity": "error",
      "from": { "path": "^packages/ui" },
      "to": { "path": "^apps/" }
    },
    {
      "name": "ui-no-firestore",
      "severity": "error",
      "from": { "path": "^packages/ui" },
      "to": { "path": "firebase" }
    },
    {
      "name": "no-cross-app-imports",
      "severity": "error",
      "from": { "path": "^apps/admin" },
      "to": { "path": "^apps/template" }
    }
  ]
}
```

2. Agrega un script de CI en GitHub Actions que corre `npx dependency-cruiser` en cada PR contra `develop`. Si hay violaciones, el PR falla y no puede mergearse.

3. Agrega un test de Vitest que parsea `packages/ui/src/index.ts` y verifica que ningún export es un componente de Tier 3 (la lista de Tier 3 se lee de `docs/strategy/component-library.md`).

4. Agrega un script de CI que verifica que todos los archivos en `docs/architecture/decisions/ADR-*.md` están listados en `docs/architecture/decisions/index.md`. Un ADR no registrado en el index no existe para el equipo.

5. Usa el skill `/fitness-check` localmente antes de cada MR para verificar las constraints antes de abrir el PR. Las fitness functions en CI son la red de seguridad; `/fitness-check` local es el hábito preventivo.

### Métrica de mejora

Cero violaciones de constraints arquitectónicas encontradas en la auditoría trimestral, porque CI las captura antes de que lleguen a develop. El número de violaciones en CI disminuye sprint sobre sprint a medida que el equipo aprende los boundaries.

### Tiempo estimado

1 semana para configurar Dependency Cruiser y el pipeline de CI. Permanente — las fitness functions son mantenimiento continuo que se actualiza cuando la arquitectura evoluciona. Son código, no documentación.

---

## Gap 10: Sin sistema de aprendizaje

### Observado en este proyecto

No existe ninguna evidencia de un sistema estructurado para capturar y aplicar lecciones aprendidas de proyectos anteriores. El proyecto SaaS Factory comenzó cometiendo errores que son comunes, conocidos, y documentados en la literatura de ingeniería de software:

- Documentar el stack incorrecto (un problema clásico de proyectos que pivotan sin actualizar los docs)
- Construir infraestructura antes de validar el producto (un anti-pattern documentado en "The Lean Startup" y en docenas de post-mortems públicos de startups)
- Over-engineering para un MVP (descrito en "You Aren't Gonna Need It", originado en 1998 por Ron Jeffries)

Estos no son errores de falta de habilidad técnica — son errores de falta de un sistema que diga: "La última vez que alguien hizo esto, aprendió que..." El vault de Obsidian en `~/obsidian/architect-brain/` existe como primer intento de un sistema de este tipo, pero fue creado durante este proyecto, no antes de él. Es la primera vez que el aprendizaje se captura de manera estructurada.

### Por qué importa a nivel Staff/Principal

Los Staff Engineers tienen un punto de vista que viene de experiencia acumulada, no solo de conocimiento técnico. Ese punto de vista es lo que permite decir con evidencia: "esto no va a funcionar porque la última vez que lo intentamos en el contexto Y, descubrimos Z." Sin un sistema de aprendizaje, la experiencia no se compone — se repite. Cada nuevo proyecto parte de cero en lugar de construir sobre lo anterior.

Los Principal Engineers son reconocidos como fuentes de patrones, anti-patterns, y lessons learned en toda la organización. Esa reputación no viene de memoria fotográfica — viene de un sistema deliberado de captura y revisión que convierte experiencias en principios aplicables.

A nivel de carrera: las historias STAR más poderosas en entrevistas de Staff y Principal son las que demuestran un ciclo completo de experiencia → reflexión → principio → aplicación. Ese ciclo solo es posible con un sistema de aprendizaje.

### Cómo cerrar el gap

1. Después de cada retrospectiva de sprint, escribe una "lesson learned card" con este formato:
   ```
   Lesson Learned — Sprint N — fecha

   Qué ocurrió: descripción factual sin juicio
   Por qué importó: consecuencia concreta, no abstracta
   Qué hacer diferente: acción específica, no principio genérico
   Framework que actualiza: ¿qué regla de decisión modifica esto?
   Categoría: Product Validation / Architecture / Process / Infrastructure / Cost
   ```

2. Guarda las cards en `docs/lessons-learned/sprint-N.md`. Revisa el folder completo cada 3 meses. El objetivo de la revisión trimestral es identificar patrones: ¿qué tipo de error se repite?, ¿qué tipo de decisión siempre resulta bien?

3. Mantén `docs/patterns.md` donde capturas los patrones validados como efectivos y los anti-patterns confirmados como costosos. Este documento crece con cada retrospectiva.

4. Integra el vault de Obsidian: cada lesson learned se escribe también en `~/obsidian/architect-brain/20-Patterns/anti-patterns/` o en `~/obsidian/architect-brain/40-Career/Gaps/`. El vault es el sistema de largo plazo; el repo es el sistema del proyecto activo.

5. Al inicio de cada nuevo proyecto, lee `docs/patterns.md` del proyecto anterior y el vault de Obsidian. Escribe explícitamente: "¿Qué errores pasados estoy en riesgo de repetir en este proyecto?" Esta pregunta es el seguro contra los ciclos de repetición.

### Métrica de mejora

1 lesson learned document por sprint, revisado trimestralmente. Los errores documentados en projects anteriores no se repiten en el proyecto siguiente porque están en el sistema y se consultaron al inicio.

### Tiempo estimado

Inmediato — la primera lesson learned card puede escribirse ahora mismo para este proyecto, cubriendo el pivote de domain, la documentación incorrecta, y la MFE sin spike. 3 meses para que sea hábito. 12 meses para tener suficiente volumen que los patrones sean estadísticamente visibles.

---

## Plan de 90 días

Los 4 gaps de mayor prioridad son **Gap 1 (Validación antes que arquitectura)**, **Gap 2 (Builder's Trap)**, **Gap 3 (ADRs informales)**, y **Gap 5 (Sin spike discipline)**. Estos son la base: los demás gaps se cierran más fácilmente una vez que estos cuatro están activos.

Gap 2 (Builder's Trap) y Gap 1 (Validación) están relacionados — ambos atacan el mismo problema raíz desde ángulos diferentes. Gap 3 (ADRs) y Gap 5 (Spike discipline) son la infraestructura de decisiones que previene los errores técnicos más costosos.

### Semanas 1–2: Foundations

**Gap 10 — Inicia el sistema de aprendizaje ahora, antes de cualquier otra cosa:**
- Escribe la primera lesson learned card para SaaS Factory: el pivote de event-pages a catalog, la documentación incorrecta del stack, la decisión de MFE sin spike.
- Crea `docs/lessons-learned/` y `docs/patterns.md` con las primeras entradas.
- Compromiso no negociable: una card por sprint, sin excepciones.
- Fecha objetivo: día 3 desde el inicio del plan.

**Gap 3 — Escribe los ADRs retroactivos esta semana:**
- Crea `docs/architecture/decisions/` con el `index.md`.
- Escribe los primeros 5 ADRs retroactivos: stack frontend (Nuxt 4 vs Next.js 15), base de datos (Firestore vs PostgreSQL + Supabase), arquitectura MFE (MFE vs monolito modular), sistema de auth (Firebase Auth vs Auth propio), branching strategy (Gitflow vs trunk-based).
- Para cada ADR: contexto real de la decisión en ese momento, las alternativas que realmente se consideraron, las consecuencias conocidas ahora que no eran obvias entonces.
- Tiempo estimado: 4 horas total.
- Fecha objetivo: día 7 desde el inicio del plan.

### Semanas 3–4: Aplicación en Sprint 1

**Gap 5 — Spike antes de comenzar Sprint 1:**
- Antes de abrir el branch de Sprint 1, ejecuta el spike de MFE con Nuxt 4.
- Pregunta específica: "¿Puede un composable Pinia definido en el host de MFE ser consumido por un remote sin duplicar el store en memoria, con SSR habilitado en ambos?"
- Documentar el resultado en el ADR de MFE (ADR-003 o el número correspondiente).
- Si el spike pasa: Sprint 1 procede con MFE como estaba planificado.
- Si el spike falla: Sprint 1 cambia a monolito modular y el ADR documenta por qué. No hay vergüenza en esto — es exactamente para lo que sirve el spike.
- Fecha objetivo: día 14 desde el inicio del plan, antes de abrir sprint/1.

**Gap 1 — Problem brief para el primer feature visible:**
- Para el storefront público (el primer feature que un usuario real va a ver), escribe el problem brief de una página antes de escribir una sola línea de Vue.
- No requiere investigación formal: una conversación de 30 minutos con un dueño de negocio local real (restaurante, tienda, ferretería) es suficiente para el primer brief.
- Documenta en el brief: qué problema tienen con su presencia digital actual, cómo lo resuelven hoy, cuánto les costaría en tiempo tener lo que el storefront ofrece.
- Fecha objetivo: día 18 desde el inicio del plan.

### Semanas 5–8: Solidificación del proceso

**Gap 3 — ADR como reflejo en cada sprint:**
- En cada sprint planning, antes de confirmar las historias técnicas, pregunta: "¿Hay alguna decisión en este sprint que sea difícil de revertir?" Si sí, el ADR se escribe antes de que el sprint comience.
- Objetivo: ninguna decisión técnica costosa en Sprints 2-3 sin ADR previo.
- Métrica de seguimiento: llevar la cuenta de decisiones tomadas por sprint y cuántas tienen ADR.

**Gap 10 — Revisión intermedia:**
- Al final de la semana 8 (mitad del plan), revisa las lesson learned cards de los primeros sprints.
- Identifica el patrón más repetido: ¿qué tipo de error sigue apareciendo?
- Agrega ese patrón a `docs/patterns.md` como anti-pattern confirmado con evidencia del proyecto.

**Gap 2 — Primeras conversaciones de venta:**
- Antes del final de la semana 8, muestra el admin panel a al menos 2 dueños de negocio reales y pregunta directamente: "¿Pagarías $35 por mes por esto?"
- Documenta las respuestas en el problem brief. Incluso un "no" con razones es más valioso que el silencio.

**Gap 5 — Spike para Sprint 3 si aplica:**
- Si Sprint 3 (storefront) introduce tecnología nueva o comportamiento no documentado, identificar el riesgo e ejecutar el spike durante Sprint 2.
- Regla: el spike para Sprint N ocurre durante Sprint N-1, no al inicio de Sprint N.

### Semanas 9–12: Medición y cierre

**Gap 1 — Retrospectiva de validación:**
- Al terminar Sprint 3 (el primer feature con UI completa), hacer una retrospectiva específica de product validation:
  - ¿Construimos lo correcto?
  - ¿Teníamos evidencia antes de construirlo?
  - ¿Qué habríamos hecho diferente si el problem brief hubiera existido desde el inicio?
- Documentar en lessons-learned.

**Gap 3 — ADR audit:**
- Auditar todos los ADRs escritos en los primeros 90 días.
- ¿Están completos? ¿Las consecuencias que predijeron se materializaron?
- Actualizar cualquier ADR donde la realidad difirió de la predicción. Esto es datos para el sistema de aprendizaje.

**Gap 10 — Revisión trimestral:**
- Revisar todas las lesson learned cards de los primeros 90 días.
- Identificar los 3 patrones más repetidos.
- Escribir un documento de síntesis que convierte esos patrones en reglas de decisión para el siguiente proyecto.
- Sincronizar a Obsidian: los patrones identificados van a `~/obsidian/architect-brain/20-Patterns/`.

**Resultado esperado al día 90:**
- 5+ ADRs escritos y actualizados con estado real vs. predicho
- 2 spikes completados con resultados documentados en ADRs
- 1 problem brief con al menos una conversación de usuario real
- 8+ lesson learned cards con patrones visibles
- Al menos 2 conversaciones de venta con dueños de negocio reales con respuestas documentadas
- Un sistema que se auto-sostiene porque todas las herramientas están en su lugar y el hábito está establecido

---

## Benchmark

Comparación del nivel actual del arquitecto contra las expectativas de un Staff Engineer en 9 dimensiones clave.

| Dimensión | Nivel Actual | Expectativa Staff | Score | Notas |
|-----------|-------------|-------------------|-------|-------|
| Diseño de sistemas | Sólido — diseña sistemas correctamente a nivel técnico | Diseña sistemas con trade-offs explícitos documentados | 3/5 | Falta el rigor de documentar trade-offs antes de decidir |
| Validación de producto | Débil — arquitectura antes que validación | Bloquea el trabajo técnico hasta tener señales de validación | 1/5 | El gap más crítico. 8 sprints diseñados sin un solo usuario |
| ADR discipline | Ausente formalmente | Escribe ADRs para toda decisión costosa de revertir | 1/5 | Existe una tabla de decisiones pero no ADRs con alternativas y consecuencias |
| Capacity planning | Ausente | Modelo de carga antes del sprint de infra | 1/5 | Cifra de $35/mes sin modelo que la sustente |
| Fitness functions | Ausente | Constraints arquitectónicas en CI, no en docs | 1/5 | Las reglas existen en documentación pero no en código ejecutable |
| Spike discipline | Ausente | Spike obligatorio para toda "known-unknown" | 1/5 | MFE con Nuxt 4 comprometido sin spike de validación |
| Comunicación técnica | Bueno — documentación detallada y organizada | Documentación que no requiere corrección por stack incorrecto | 3/5 | La documentación existente es extensa pero tuvo stack incorrecto |
| Sistema de aprendizaje | Iniciando | Sistema activo con al menos 2 proyectos de historia | 2/5 | El vault de Obsidian es el primer intento estructurado |
| Distribución del trabajo | Bueno — modelo de sub-agentes bien diseñado | Distribución con DoR que previene churn en paralelo | 3/5 | El modelo de agentes es sólido; falta el DoR como gate |

**Promedio actual: 1.8 / 5**

**Promedio objetivo (Staff Engineer): 4 / 5**

El gap más urgente de cerrar no es técnico — es de proceso y validación. Los 3 scores de 1/5 (validación, ADRs, capacity planning) son gaps de hábito y disciplina, no de habilidad técnica. La habilidad técnica para resolverlos ya existe. Lo que falta es convertirlos en comportamiento habitual.

El score de 2/5 en sistema de aprendizaje es esperanzador: el vault de Obsidian y este documento son la primera iteración. En 6 meses con el sistema activo, ese score puede ser 4/5.

Los scores de 3/5 (diseño de sistemas, comunicación técnica, distribución de trabajo) indican que la base es sólida. Con las correcciones de proceso de este plan de 90 días, esos scores pueden subir a 4/5 sin trabajo adicional significativo — solo con consistencia en los hábitos ya iniciados.
