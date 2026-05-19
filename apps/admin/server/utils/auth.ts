import { defineEventHandler, createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { getAuth } from 'firebase-admin/auth'
import { initAdmin } from '../utils/firebase-admin'

export interface AuthUser {
  uid: string
  email: string | undefined
  role: 'owner' | 'admin' | 'superadmin'
}

declare module 'h3' {
  interface H3EventContext {
    user?: AuthUser
  }
}

export async function requireAuth(
  event: H3Event,
  options: { requiredRole?: AuthUser['role'] } = {},
): Promise<AuthUser> {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    initAdmin()
    const decoded = await getAuth().verifyIdToken(token)

    const role = (decoded.role as AuthUser['role']) ?? 'owner'

    if (options.requiredRole) {
      const hierarchy: AuthUser['role'][] = ['owner', 'admin', 'superadmin']
      const userLevel = hierarchy.indexOf(role)
      const requiredLevel = hierarchy.indexOf(options.requiredRole)
      if (userLevel < requiredLevel) {
        throw createError({
          statusCode: 403,
          message: `Role '${role}' is not authorized. Required: '${options.requiredRole}'`,
        })
      }
    }

    const user: AuthUser = {
      uid: decoded.uid,
      email: decoded.email,
      role,
    }

    event.context.user = user
    return user
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }
}
