import { useAuth0 } from '@auth0/auth0-react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))
const mockedUseAuth0 = vi.mocked(useAuth0)

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/collections?page=2']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/collections" element={<div>Private content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => mockedUseAuth0.mockReset())

  it('renders protected content only for an authenticated user', () => {
    mockedUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginWithRedirect: vi.fn(),
    } as never)

    renderProtectedRoute()
    expect(screen.getByText('Private content')).toBeInTheDocument()
  })

  it('redirects unauthenticated users and preserves the requested route', async () => {
    const loginWithRedirect = vi.fn().mockResolvedValue(undefined)
    mockedUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect,
    } as never)

    renderProtectedRoute()
    expect(screen.queryByText('Private content')).not.toBeInTheDocument()
    await waitFor(() => expect(loginWithRedirect).toHaveBeenCalledWith({
      appState: { returnTo: '/collections?page=2' },
    }))
  })

  it('does not redirect while the SDK is loading', () => {
    const loginWithRedirect = vi.fn()
    mockedUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      loginWithRedirect,
    } as never)

    renderProtectedRoute()
    expect(screen.getByText('Preparing secure sign-in…')).toBeInTheDocument()
    expect(loginWithRedirect).not.toHaveBeenCalled()
  })
})
