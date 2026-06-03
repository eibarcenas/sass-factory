# Plataforma SaaS Multi-Tenant de Catálogos + WhatsApp

# 1. Visión General

Plataforma SaaS multi-tenant enfocada en pequeños negocios.

Cada negocio obtiene:

* Página pública tipo catálogo
* Panel administrativo propio
* Integración directa con WhatsApp
* Link compartible

La plataforma busca:

* Ayudar a negocios pequeños a vender más
* Reducir fricción tecnológica
* Facilitar contacto inmediato por WhatsApp
* Escalar viralmente

El objetivo real del producto es:

> Crear una plataforma de adquisición de clientes vía WhatsApp para pequeños negocios.

---

# 2. Tipos de negocios soportados

La plataforma será horizontal.

Ejemplos:

* Heladerías
* Barberías
* Herreros
* Estéticas
* Ropa
* Comida
* Servicios locales
* Emprendedores

Cada giro tendrá:

* Plantillas visuales
* Mensajes WhatsApp personalizados
* Layouts optimizados

---

# 3. Arquitectura de Producto

Existen 3 superficies principales.

## 3.1 Página Pública

Visible para clientes finales.

Responsabilidades:

* Mostrar catálogo
* Mostrar productos/servicios
* Mostrar imágenes
* Redireccionar a WhatsApp
* Compartirse fácilmente

Ejemplo:

```text
https://tudominio.com/helados-erick
```

---

## 3.2 Panel del Negocio

Cada negocio tiene su propio panel.

Responsabilidades:

* Administrar productos
* Configurar WhatsApp
* Configurar diseño
* Ver métricas
* Compartir página

Estructura sugerida:

```text
Dashboard
Productos
WhatsApp
Diseño
Configuración
```

---

## 3.3 Panel Global (Super Admin)

Panel interno de la plataforma.

Responsabilidades:

* Moderar negocios
* Ver métricas globales
* Suspender negocios
* Ver reportes
* Administrar usuarios

---

# 4. Arquitectura Técnica (GCP)

## Frontend Público

* Next.js
* Cloud Run

## Dashboard

* Next.js
* Cloud Run

## Backend API

* FastAPI
* Cloud Run

## Base de Datos

* Firestore Native Mode

## Imágenes

* Cloud Storage

## Autenticación

* Firebase Authentication
* OTP vía teléfono

## CDN

* Cloud CDN

## Observabilidad

* Cloud Logging
* Cloud Monitoring

---

# 5. Arquitectura General

```text
                    Internet
                         │
               Cloud Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                                 │
        ▼                                 ▼
 Frontend Público                 Frontend Dashboard
      Cloud Run                        Cloud Run
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
                   Backend API
                      FastAPI
                     Cloud Run
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
      ▼                  ▼                  ▼
 Firestore         Cloud Storage      Firebase Auth
```

---

# 6. Estrategia Multi-Tenant

Cada negocio es un tenant.

Toda entidad importante debe incluir:

```text
business_id
```

Ejemplos:

* productos
* clicks
* reportes
* analytics

---

# 7. Modelo de Datos (Firestore)

## users

```json
{
  "id": "user_1",
  "phone": "+5255...",
  "role": "BUSINESS_OWNER"
}
```

---

## businesses

```json
{
  "id": "biz_1",
  "name": "Helados Erick",
  "slug": "helados-erick",
  "type": "food",
  "owner_id": "user_1",
  "status": "ACTIVE",
  "whatsapp_number": "5255XXXX",
  "template": "food_v1"
}
```

---

## items

```json
{
  "id": "item_1",
  "business_id": "biz_1",
  "type": "product",
  "name": "Helado Chocolate",
  "price": 25,
  "image_url": "..."
}
```

---

## reports

```json
{
  "id": "rep_1",
  "business_id": "biz_1",
  "reason": "contenido inapropiado"
}
```

---

## clicks

```json
{
  "id": "click_1",
  "business_id": "biz_1",
  "type": "whatsapp_click"
}
```

---

## referrals

```json
{
  "id": "ref_1",
  "referrer_user_id": "user_1",
  "referred_business_id": "biz_99"
}
```

---

# 8. Estados del Negocio

```text
DRAFT
ACTIVE
PENDING_REVIEW
SUSPENDED
DELETED
```

---

# 9. Flujo General del Sistema

```text
Landing
   ↓
Registro rápido
   ↓
Creación automática:
- user
- business
- slug
   ↓
Dashboard negocio
   ↓
Carga productos
   ↓
Página pública
   ↓
Clientes → WhatsApp
```

---

# 10. Estrategia de Moderación

Modelo recomendado:

> Auto-aprobación + moderación reactiva

Flujo:

```text
Negocio ACTIVE
       ↓
Usuarios reportan
       ↓
Admin revisa
       ↓
SUSPENDED
```

---

# 11. Estrategia de Dominio

## Fase 1

Usar slugs:

```text
https://tudominio.com/helados-erick
```

Ventajas:

* simple
* barato
* rápido

---

## Fase 2

Subdominios:

```text
https://helados-erick.tudominio.com
```

---

# 12. Estrategia de Naming

El naming debe:

* ser corto
* memorable
* emocional
* fácil de escribir
* amigable

Ideas exploradas:

* SeAntoja
* Mi Tiendita
* Deseo
* Dezeo
* Lokali
* Pídemelo

Objetivo:

> Que el usuario sienta que descubre negocios y productos fácilmente.

---

# 13. Estrategia Viral

La plataforma debe incentivar compartir.

Cada negocio tendrá:

* link compartible
* botones sociales
* CTA WhatsApp

Posible sistema de referidos:

```text
Usuario invita negocio
      ↓
Negocio se registra
      ↓
Comisión o recompensa
```

---

# 14. WhatsApp como Núcleo

El producto está centrado en WhatsApp.

Ejemplos:

```text
Hola, quiero pedir este producto
Hola, quiero cotizar
Hola, quiero agendar una cita
```

Objetivo:

* aumentar conversión
* reducir fricción
* facilitar ventas

---

# 15. Seguridad

## IAM

Separar ambientes:

* dev
* stg
* prod

## Secret Manager

Guardar:

* claves Firebase
* secretos JWT
* APIs

---

# 16. Escalabilidad

La arquitectura soporta:

* miles de negocios
* tráfico viral
* uploads concurrentes
* analytics
* expansión futura

---

# 17. Roadmap

## Fase 1 – MVP

* registro
* dashboard
* catálogo
* WhatsApp

## Fase 2

* analytics
* plantillas
* referidos

## Fase 3

* subdominios
* IA
* campañas
* pagos

---

# 18. Historias de Usuario (Gherkin)

## Registro

```gherkin
Feature: Registro de negocio

Scenario: Crear negocio rápidamente
  Given un usuario nuevo en la landing
  When ingresa nombre, WhatsApp y tipo de negocio
  Then se crea un usuario
  And se crea un negocio con estado ACTIVE
  And se genera un slug único
  And se redirige al dashboard
```

---

## Gestión de Productos

```gherkin
Feature: Gestión de catálogo

Scenario: Agregar producto
  Given un negocio activo
  When el usuario agrega un producto
  Then el producto se guarda asociado al negocio
  And aparece en la página pública
```

---

## WhatsApp

```gherkin
Feature: Contacto por WhatsApp

Scenario: Cliente contacta negocio
  Given un visitante en la página pública
  When hace clic en "Cotizar por WhatsApp"
  Then se abre WhatsApp con mensaje predefinido
```

---

## Moderación

```gherkin
Feature: Reporte de negocio

Scenario: Reportar negocio
  Given un visitante en una página pública
  When hace clic en "Reportar"
  Then se crea un reporte asociado al negocio
```

---

## Administración Global

```gherkin
Feature: Administración global

Scenario: Suspender negocio
  Given un admin en el panel
  When suspende un negocio
  Then el negocio cambia a SUSPENDED
  And deja de ser visible públicamente
```

---

# 19. Conclusión

La plataforma es:

* SaaS multi-tenant
* enfocada en adquisición de clientes
* optimizada para WhatsApp
* escalable en GCP
* diseñada para crecimiento viral

La visión final es:

> Convertirse en la forma más sencilla para que pequeños negocios tengan presencia digital y generen clientes mediante WhatsApp.
