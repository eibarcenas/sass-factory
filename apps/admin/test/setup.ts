// Global test setup for apps/admin
import { vi } from 'vitest'

// Mock Firebase Admin (not available in test environment)
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}))

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn(),
}))
