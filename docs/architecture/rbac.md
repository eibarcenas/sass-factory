# RBAC — @sass-factory/rbac

Dedicated package `packages/rbac` exported as `@sass-factory/rbac`.
Both apps import exclusively from here. Permissions are never defined locally in apps.

Auth0 model: check **permissions**, not roles.
```
// Never:   if (user.role === 'admin')
// Always:  guard.require(P.businesses.create)
```

## Package Structure

```
packages/rbac/
├── src/
│   ├── permissions.ts     ← typed constants — single source of truth
│   ├── roles.ts           ← role → permissions[]
│   ├── guard.ts           ← Guard class + createGuard()
│   ├── middleware.ts      ← Next.js middleware adapter
│   ├── hooks.ts           ← usePermissions(), <Gate> React component
│   ├── claims.ts          ← assign/revoke via Firebase Admin SDK (server-only)
│   └── index.ts           ← public API
├── package.json
└── tsconfig.json
```

---

## permissions.ts — typed constants

No magic strings. Every permission is a leaf of the `P` tree.

```typescript
// packages/rbac/src/permissions.ts
export const P = {
  businesses: {
    read:    { own: 'businesses:read:own',    any: 'businesses:read:any'    },
    create:  'businesses:create',
    update:  { own: 'businesses:update:own',  any: 'businesses:update:any'  },
    publish: 'businesses:publish',
    suspend: 'businesses:suspend',
    delete:  'businesses:delete',
  },
  items: {
    read:  { public: 'items:read:public', own: 'items:read:own', any: 'items:read:any' },
    write: { own: 'items:write:own', any: 'items:write:any' },
  },
  clicks: {
    create: 'clicks:create',
    read:   { own: 'clicks:read:own', any: 'clicks:read:any' },
  },
  users: {
    read:  { own: 'users:read:own', any: 'users:read:any' },
    write: { any: 'users:write:any' },
  },
  invoices: {
    read:  'invoices:read',
    write: 'invoices:write',
  },
  reports: {
    create:  'reports:create',
    read:    'reports:read',
    resolve: 'reports:resolve',
  },
  platform: {
    config: { read: 'platform:config:read', write: 'platform:config:write' },
  },
  audit: {
    read: 'audit:read',
  },
} as const

type LeafValues<T> = T extends string
  ? T
  : { [K in keyof T]: LeafValues<T[K]> }[keyof T]

export type Permission = LeafValues<typeof P>
```

---

## roles.ts — role → permissions[]

```typescript
// packages/rbac/src/roles.ts
import { P, type Permission } from './permissions'

export type Role = 'super_admin' | 'admin' | 'business_owner' | 'anonymous'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    P.businesses.read.any,    P.businesses.create,
    P.businesses.update.any,  P.businesses.publish,
    P.businesses.suspend,     P.businesses.delete,
    P.items.read.any,         P.items.write.any,
    P.clicks.read.any,
    P.users.read.any,         P.users.write.any,
    P.invoices.read,          P.invoices.write,
    P.reports.read,           P.reports.resolve,
    P.platform.config.read,   P.platform.config.write,
    P.audit.read,
  ],
  admin: [
    P.businesses.read.any,    P.businesses.create,
    P.businesses.update.any,  P.businesses.publish,
    P.businesses.suspend,     P.businesses.delete,
    P.items.read.any,         P.items.write.any,
    P.clicks.read.any,
    P.users.read.any,         P.users.write.any,
    P.invoices.read,          P.invoices.write,
    P.reports.read,           P.reports.resolve,
    P.platform.config.read,
  ],
  business_owner: [
    P.businesses.read.own,    P.businesses.update.own,
    P.items.read.own,         P.items.write.own,
    P.clicks.read.own,
    P.users.read.own,
    P.reports.create,
    P.platform.config.read,
  ],
  anonymous: [
    P.items.read.public,
    P.clicks.create,
    P.reports.create,
    P.platform.config.read,
  ],
}
```

---

## guard.ts — composable Guard

```typescript
// packages/rbac/src/guard.ts
import type { Permission } from './permissions'

export interface AuthUser {
  uid:         string
  permissions: Permission[]
}

export class Guard {
  constructor(private user: AuthUser) {}

  can(permission: Permission): boolean {
    return this.user.permissions.includes(permission)
  }

  require(permission: Permission): this {
    if (!this.can(permission)) {
      throw new AuthError(403, `Missing permission: ${permission}`)
    }
    return this   // chainable: guard.require(P.businesses.create).require(P.items.write.any)
  }

  requireAny(...permissions: Permission[]): this {
    if (!permissions.some(p => this.can(p))) {
      throw new AuthError(403, `Missing any of: ${permissions.join(', ')}`)
    }
    return this
  }

  requireAll(...permissions: Permission[]): this {
    const missing = permissions.filter(p => !this.can(p))
    if (missing.length > 0) {
      throw new AuthError(403, `Missing permissions: ${missing.join(', ')}`)
    }
    return this
  }

  get uid(): string { return this.user.uid }
}

export class AuthError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function createGuard(user: AuthUser): Guard {
  return new Guard(user)
}
```

---

## middleware.ts — Next.js adapter

```typescript
// packages/rbac/src/middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from './claims'
import { createGuard } from './guard'
import type { Permission } from './permissions'

type RouteGuardMap = Record<string, Permission>

export function createRbacMiddleware(routes: RouteGuardMap) {
  return async function rbacMiddleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    const requiredPermission = Object.entries(routes)
      .find(([prefix]) => pathname.startsWith(prefix))?.[1]

    if (!requiredPermission) return NextResponse.next()

    try {
      const user = await verifyToken(req)
      createGuard(user).require(requiredPermission)
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
}

// Usage in apps/dashboard/middleware.ts:
// export default createRbacMiddleware({
//   '/admin':     P.businesses.read.any,
//   '/dashboard': P.businesses.read.own,
// })
```

---

## hooks.ts — React UI gating

```typescript
// packages/rbac/src/hooks.ts
'use client'
import { useContext, createContext, type ReactNode } from 'react'
import type { Permission } from './permissions'
import type { AuthUser } from './guard'

const PermissionsContext = createContext<AuthUser | null>(null)

export function PermissionsProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  return (
    <PermissionsContext.Provider value={user}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const user = useContext(PermissionsContext)
  return {
    can:    (permission: Permission) => user?.permissions.includes(permission) ?? false,
    cannot: (permission: Permission) => !(user?.permissions.includes(permission) ?? false),
    uid:    user?.uid ?? null,
  }
}

// Declarative component for showing/hiding UI based on permission
export function Gate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children:   ReactNode
  fallback?:  ReactNode
}) {
  const { can } = usePermissions()
  return can(permission) ? <>{children}</> : <>{fallback}</>
}

// Usage:
// <Gate permission={P.businesses.suspend} fallback={<span>Read only</span>}>
//   <SuspendButton />
// </Gate>
```

---

## FastAPI — Python RBAC enforcement

The FastAPI backend verifies the Firebase JWT and checks the `permissions[]` custom claim.

```python
# apps/api/src/api/dependencies.py
from fastapi import Depends, HTTPException, status
from firebase_admin import auth

async def get_current_user(authorization: str = Header(...)) -> dict:
    token = authorization.removeprefix("Bearer ")
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHENTICATED"},
        )

def require_permission(permission: str):
    def _check(user: dict = Depends(get_current_user)) -> dict:
        if permission not in user.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN"},
            )
        return user
    return _check

# Usage in routers:
# @router.post("/businesses", status_code=status.HTTP_201_CREATED)
# async def create_business(
#     user = Depends(require_permission("businesses:create"))
# ): ...
```

---

## Route Permission Map

| Method + Route | Required Permission |
|---------------|---------------------|
| GET /v1/businesses | `businesses:read:any` |
| POST /v1/businesses | `businesses:create` |
| PATCH /v1/businesses/:id | `businesses:update:any` or `businesses:update:own` |
| PATCH /v1/businesses/:id/publish | `businesses:publish` |
| PATCH /v1/businesses/:id/suspend | `businesses:suspend` |
| DELETE /v1/businesses/:id | `businesses:delete` |
| GET /v1/businesses/:id/items | `items:read:any` or `items:read:own` |
| POST /v1/businesses/:id/items | `items:write:any` or `items:write:own` |
| GET /v1/clicks (aggregate) | `clicks:read:any` |
| POST /v1/clicks | `clicks:create` (public, App Check) |
| GET /v1/invoices/:businessId | `invoices:read` |
| GET /v1/reports | `reports:read` |
| PATCH /v1/reports/:id/resolve | `reports:resolve` |
