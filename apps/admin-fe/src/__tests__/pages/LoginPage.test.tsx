import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '@/pages/LoginPage'
import { useAuthStore } from '@/store/auth'

const signInWithGoogle = vi.fn()

vi.mock('@/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    signInWithGoogle,
    redirectChecked: true,
    pending: false,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithGoogle.mockReset()
    signInWithGoogle.mockResolvedValue(undefined)
    useAuthStore.setState({ user: null, mockMode: false })
  })

  it('waits for a user gesture before starting Google sign-in', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(signInWithGoogle).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })
})
