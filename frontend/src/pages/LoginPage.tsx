import { useAuth0 } from '@auth0/auth0-react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Navigate } from 'react-router'
import { LoadingState } from '../components/LoadingState'

export function LoginPage() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  if (isLoading) return <LoadingState />
  if (isAuthenticated) return <Navigate to="/collections" replace />
  return (
    <Container maxWidth="sm" className="py-20">
      <Card><CardContent className="p-8 sm:p-10"><Stack spacing={3}>
        <div><Typography variant="h4" gutterBottom>Personal Bookmark Manager</Typography><Typography color="text.secondary">Sign in through the company identity provider to access your private bookmarks.</Typography></div>
        <Button size="large" variant="contained" onClick={() => loginWithRedirect({ appState: { returnTo: '/collections' } })}>Continue to sign in</Button>
      </Stack></CardContent></Card>
    </Container>
  )
}
