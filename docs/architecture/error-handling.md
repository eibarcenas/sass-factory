# Error Handling — Backend Returns Codes, Frontend Translates

## Principle

```
NEVER:  backend returns "The business already exists"
ALWAYS: backend returns { "code": "SLUG_TAKEN", "context": { "slug": "gorras-bebe" } }

Why:
  - Backend does not know the user's language
  - Frontend controls tone and UX of the error
  - Easy to add languages without touching backend
  - Codes are stable contracts — messages can change
```

## Response Envelope

All API responses follow this structure:

```json
// Success
{ "data": { ... }, "error": null }

// Error
{ "data": null, "error": { "code": "SLUG_TAKEN", "context": { "slug": "gorras-bebe" } } }
```

---

## Error Code Catalog — packages/core

```typescript
// packages/core/src/errors/codes.ts
export const ErrorCode = {
  // Auth
  UNAUTHENTICATED:     'UNAUTHENTICATED',
  FORBIDDEN:           'FORBIDDEN',
  TOKEN_EXPIRED:       'TOKEN_EXPIRED',

  // Business
  SLUG_TAKEN:          'SLUG_TAKEN',
  BUSINESS_NOT_FOUND:  'BUSINESS_NOT_FOUND',
  BUSINESS_SUSPENDED:  'BUSINESS_SUSPENDED',
  INVALID_WHATSAPP:    'INVALID_WHATSAPP',
  INVALID_SLUG:        'INVALID_SLUG',

  // Items
  ITEM_NOT_FOUND:      'ITEM_NOT_FOUND',
  MAX_ITEMS_REACHED:   'MAX_ITEMS_REACHED',

  // Upload
  INVALID_FILE_TYPE:   'INVALID_FILE_TYPE',
  FILE_TOO_LARGE:      'FILE_TOO_LARGE',

  // Generic
  VALIDATION_ERROR:    'VALIDATION_ERROR',
  INTERNAL_ERROR:      'INTERNAL_ERROR',
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]
```

---

## Python — DomainError hierarchy

```python
# apps/catalog-api/src/domain/shared/errors.py
from dataclasses import dataclass, field
from typing import Any

@dataclass(frozen=True)
class DomainError(Exception):
    code:    str
    context: dict[str, Any] = field(default_factory=dict)
    # Never a human-readable 'message' — that belongs to the frontend

class SlugTakenError(DomainError):
    def __init__(self, slug: str):
        super().__init__(code='SLUG_TAKEN', context={'slug': slug})

class BusinessNotFoundError(DomainError):
    def __init__(self):
        super().__init__(code='BUSINESS_NOT_FOUND')

class MaxItemsReachedError(DomainError):
    def __init__(self, max: int):
        super().__init__(code='MAX_ITEMS_REACHED', context={'max': max})

class InvalidWhatsAppError(DomainError):
    def __init__(self):
        super().__init__(code='INVALID_WHATSAPP')

class ForbiddenError(DomainError):
    def __init__(self):
        super().__init__(code='FORBIDDEN')
```

---

## FastAPI — DomainError → HTTP Response

Uses `fastapi.status` constants — no magic numbers anywhere.

```python
# apps/catalog-api/src/api/errors.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from src.domain.shared.errors import DomainError

# fastapi.status enums — self-documenting, no magic numbers
HTTP_STATUS_MAP: dict[str, int] = {
    'UNAUTHENTICATED':    status.HTTP_401_UNAUTHORIZED,
    'FORBIDDEN':          status.HTTP_403_FORBIDDEN,
    'BUSINESS_NOT_FOUND': status.HTTP_404_NOT_FOUND,
    'ITEM_NOT_FOUND':     status.HTTP_404_NOT_FOUND,
    'SLUG_TAKEN':         status.HTTP_409_CONFLICT,
    'MAX_ITEMS_REACHED':  status.HTTP_422_UNPROCESSABLE_ENTITY,
    'INVALID_WHATSAPP':   status.HTTP_422_UNPROCESSABLE_ENTITY,
    'INVALID_FILE_TYPE':  status.HTTP_422_UNPROCESSABLE_ENTITY,
    'FILE_TOO_LARGE':     status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    'VALIDATION_ERROR':   status.HTTP_400_BAD_REQUEST,
}

async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    http_status = HTTP_STATUS_MAP.get(exc.code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    return JSONResponse(
        status_code=http_status,
        content={
            'data':  None,
            'error': {
                'code':    exc.code,
                'context': exc.context,  # interpolation variables for frontend i18n
            },
        },
    )

# Register in main.py:
# app.add_exception_handler(DomainError, domain_error_handler)
```

Use `fastapi.status` in route definitions too:

```python
# apps/catalog-api/src/api/v1/businesses/router.py
from fastapi import APIRouter, status

router = APIRouter(prefix="/businesses", tags=["businesses"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_business(...): ...

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(...): ...

@router.patch("/{id}/publish", status_code=status.HTTP_200_OK)
async def publish_business(...): ...
```

---

## Frontend — useApiError hook

```typescript
// shared/lib/use-api-error.ts  (both apps)
'use client'
import { useTranslations } from 'next-intl'

export interface ApiError {
  code:    string
  context: Record<string, string>
}

export function useApiError() {
  const t = useTranslations('errors')

  function translate(error: unknown): string {
    if (!error || typeof error !== 'object') return t('INTERNAL_ERROR')
    const e = error as ApiError
    try {
      return t(e.code, e.context)   // next-intl interpolation: t('SLUG_TAKEN', { slug })
    } catch {
      return t('INTERNAL_ERROR')
    }
  }

  return { translate }
}
```

---

## Error Message Translations

### messages/en.json

```json
{
  "errors": {
    "SLUG_TAKEN":         "The name '{slug}' is already taken. Try a different one.",
    "BUSINESS_NOT_FOUND": "Business not found.",
    "INVALID_WHATSAPP":   "Invalid WhatsApp number. Use international format: +521...",
    "MAX_ITEMS_REACHED":  "You have reached the maximum of {max} products on your plan.",
    "INVALID_FILE_TYPE":  "Only JPG, PNG and WebP images are accepted.",
    "FILE_TOO_LARGE":     "The image must be smaller than 5 MB.",
    "FORBIDDEN":          "You do not have permission to perform this action.",
    "UNAUTHENTICATED":    "Your session has expired. Please sign in again.",
    "VALIDATION_ERROR":   "Please review the form fields.",
    "INTERNAL_ERROR":     "An unexpected error occurred. Please try again."
  }
}
```

### messages/es.json

```json
{
  "errors": {
    "SLUG_TAKEN":          "El nombre '{slug}' ya esta en uso, prueba con otro",
    "BUSINESS_NOT_FOUND":  "El negocio no existe",
    "BUSINESS_SUSPENDED":  "Este negocio esta suspendido",
    "UNAUTHENTICATED":     "Tu sesion expiro, vuelve a iniciar sesion",
    "FORBIDDEN":           "No tienes permisos para realizar esta accion",
    "INVALID_WHATSAPP":    "Numero invalido — usa el formato +521XXXXXXXXXX",
    "ITEM_NOT_FOUND":      "El producto no existe",
    "MAX_ITEMS_REACHED":   "Alcanzaste el limite de {max} productos en tu plan",
    "INVALID_FILE_TYPE":   "Solo se permiten imagenes JPG, PNG o WebP",
    "FILE_TOO_LARGE":      "El archivo no puede superar los {maxMb}MB",
    "VALIDATION_ERROR":    "Revisa los campos marcados en rojo",
    "INTERNAL_ERROR":      "Error inesperado, intenta de nuevo"
  }
}
```

---

## TypeScript Result Pattern

Used in business logic — no exceptions thrown inside domain/application layers.

```typescript
// packages/core/src/utils/result.ts
type Ok<T>  = { ok: true;  data: T }
type Err<E> = { ok: false; error: E }
type Result<T, E = string> = Ok<T> | Err<E>

export const ok  = <T>(data: T): Ok<T>   => ({ ok: true,  data })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

// Usage in entities/business/api/businessRepository.ts
async function findBySlug(slug: string): Promise<Result<Business, 'NOT_FOUND' | 'DB_ERROR'>> {
  try {
    const snap = await db.collection('businesses').where('slug', '==', slug).limit(1).get()
    if (snap.empty) return err('NOT_FOUND')
    return ok(BusinessSchema.parse(snap.docs[0].data()))
  } catch (e) {
    return err('DB_ERROR')
  }
}

// Exhaustive handling — TypeScript enforces all cases
const result = await businessRepository.findBySlug(params.slug)
if (!result.ok) {
  if (result.error === 'NOT_FOUND') return notFound()
  return Response.json({ error: 'Internal error' }, { status: 500 })
}
// result.data: Business — TypeScript knows this here
```
