# Programming Best Practices

## TypeScript Rules

```typescript
// RULE 1: strict: true — no exceptions
// tsconfig base → exactOptionalPropertyTypes, noUncheckedIndexedAccess

// RULE 2: no 'any' — use 'unknown' + type guard or Zod parse
function processInput(raw: unknown) {
  const validated = BusinessSchema.parse(raw)   // throws if invalid, infers type
}

// RULE 3: discriminated unions for state (no boolean soup)
type BusinessState =
  | { status: 'DRAFT' }
  | { status: 'ACTIVE';    publishedAt: Date }
  | { status: 'SUSPENDED'; suspendedAt: Date; reason: string }

// RULE 4: named exports only — enables refactoring and tree-shaking
// Bad:  export default function BusinessCard() {}
// Good: export function BusinessCard() {}

// RULE 5: no barrel files (index.ts re-exporting everything)
// Cause circular deps, slow TypeScript, break tree-shaking
// Direct imports:
import { BusinessCard } from '@/widgets/product-catalog/BusinessCard'
// Not: import { BusinessCard } from '@/widgets/product-catalog'
```

## Validation with Zod — at ALL boundaries

```typescript
// packages/core/src/schemas/business.schema.ts
import { z } from 'zod'

export const BusinessSchema = z.object({
  id:             z.string().uuid(),
  slug:           z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  name:           z.string().min(3).max(80),
  whatsappNumber: z.string().regex(/^\+[1-9]\d{7,14}$/),  // E.164
  businessType:   z.enum(['FOOD', 'BARBER', 'CLOTHING', 'SERVICES', 'CRAFTS']),
  status:         z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED']),
  plan:           z.enum(['STARTER', 'PRO', 'GROWTH']),
  createdAt:      z.coerce.date(),
})

export type Business = z.infer<typeof BusinessSchema>

// In API route — validate input before touching it
export async function POST(req: Request) {
  const body  = await req.json()
  const input = CreateBusinessSchema.safeParse(body)
  if (!input.success) {
    return Response.json({ error: input.error.flatten() }, { status: 400 })
  }
  // input.data is fully typed here
}

// Environment variables — validated at startup, not per-use
// shared/config/env.ts
const EnvSchema = z.object({
  FIREBASE_PROJECT_ID:  z.string().min(1),
  FIREBASE_WEB_API_KEY: z.string().min(1),
  GA4_MEASUREMENT_ID:   z.string().startsWith('G-'),
})
export const env = EnvSchema.parse(process.env)
// If a var is missing → fails at startup, not at runtime
```

## API Response Envelope

```typescript
// shared/lib/api-response.ts
type ApiOk<T>  = { data: T;    error: null; meta?: Record<string, unknown> }
type ApiErr    = { data: null;  error: { code: string; context: Record<string, unknown> } }
type ApiResponse<T> = ApiOk<T> | ApiErr

export function apiOk<T>(data: T, meta?: Record<string, unknown>): Response {
  return Response.json({ data, error: null, meta } satisfies ApiOk<T>)
}
export function apiErr(code: string, context = {}, status = 400): Response {
  return Response.json({ data: null, error: { code, context } } satisfies ApiErr, { status })
}
```

## ESLint Configuration

```javascript
// tooling/eslint/index.js
module.exports = {
  rules: {
    // FSD — layers only import downward
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['*/pages/*', '*/app/*'], message: 'FSD: import downward only' },
      ]
    }],

    // No any
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',

    // No console.log in production
    'no-console': ['error', { allow: [] }],

    // Named exports required
    'import/no-default-export': 'error',   // except Next.js pages (local override)

    // No barrel files — direct imports
    'import/no-cycle': 'error',
  }
}
```

## Turborepo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "remoteCache": { "enabled": true },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:rules": {},
    "test:rbac":  {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Commit and PR Conventions

```
Conventional Commits — enforced by commitlint:
  feat:     new functionality
  fix:      bug fix
  chore:    tooling, deps, config
  docs:     documentation only
  refactor: refactor without behavior change
  test:     tests only
  perf:     performance improvement

Examples:
  feat(dashboard): add invoice generation modal
  fix(storefront): handle 404 when business is suspended
  chore(deps): update Next.js to 15.2.1

PR checklist:
  [ ] pnpm typecheck passes
  [ ] pytest unit passes — coverage ≥ 80%
  [ ] pnpm test:rules passes
  [ ] No console.log (only structured logger)
  [ ] No magic strings — use P.* or ErrorCode.* constants
  [ ] New env vars documented in .env.example
  [ ] Screenshot/video if UI changes
```

## Key Conventions

### Slug Generation
```
"Gorras Bebe & Kids" → "gorras-bebe-kids"
                     → check Firestore uniqueness (slugs/ collection, atomic)
                     → if taken: "gorras-bebe-kids-2"
```

### WhatsApp URL
```
https://wa.me/{phone}?text={encodeURIComponent(message)}

Item-level: message = item.whatsappMessage ?? business.whatsappMessage
```

### Image Storage
```
Cloud Storage path: businesses/{businessId}/items/{itemId}/{filename}
Access: public URL via Cloud Storage (signed, resized to WebP by workers service)
```

### FSD Import Direction
```
storefront:  shared ← entities ← features ← widgets ← pages ← app
dashboard:   same hierarchy

Cross-app imports: NEVER.
Both apps import from packages/core and packages/ui only.
packages/ui imports from packages/core only.
packages/core has zero internal dependencies.
```

## Python Rules

```python
# Rule 1: mypy --strict — no Any, no ignored types
# Rule 2: ruff for linting + formatting (replaces flake8 + black + isort)
# Rule 3: Pydantic v2 for validation at HTTP boundaries
# Rule 4: dataclass(frozen=True) for domain entities — immutable by default
# Rule 5: Protocol for ports (interfaces) — not ABC

# Example: domain entity — immutable, no external deps
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum

class BusinessStatus(StrEnum):
    DRAFT     = 'draft'
    ACTIVE    = 'active'
    SUSPENDED = 'suspended'

@dataclass(frozen=True)
class Business:
    id:               str
    slug:             str
    name:             str
    whatsapp_number:  str
    status:           BusinessStatus
    owner_id:         str | None
    created_at:       datetime
    updated_at:       datetime

    def publish(self) -> 'Business':
        return Business(**{**self.__dict__, 'status': BusinessStatus.ACTIVE})

    def suspend(self) -> 'Business':
        return Business(**{**self.__dict__, 'status': BusinessStatus.SUSPENDED})
```
