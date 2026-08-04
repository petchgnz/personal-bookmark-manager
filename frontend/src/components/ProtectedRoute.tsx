import { useAuth0 } from '@auth0/auth0-react'
import Alert from '@mui/material/Alert'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { LoadingState } from './LoadingState'

export function ProtectedRoute() {
  const { error, isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const location = useLocation()
  const redirectStarted = useRef(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error && !redirectStarted.current) {
      redirectStarted.current = true
      void loginWithRedirect({ appState: { returnTo: `${location.pathname}${location.search}` } })
    }
  }, [error, isAuthenticated, isLoading, location.pathname, location.search, loginWithRedirect])

  if (error) return <Alert severity="error">Authentication failed. Please try again.</Alert>
  if (isLoading || !isAuthenticated) return <LoadingState message="Preparing secure sign-in…" />
  return <Outlet />
}
