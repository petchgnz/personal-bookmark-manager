import { useAuth0 } from '@auth0/auth0-react';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import { Navigate } from 'react-router';
import { LoadingState } from '../components/LoadingState';

export function CallbackPage() {
  const { error, isAuthenticated, isLoading } = useAuth0();
  if (error)
    return (
      <Container maxWidth='sm' className='py-16'>
        <Alert severity='error'>Sign-in could not be completed.</Alert>
      </Container>
    );
  if (isLoading) return <LoadingState message='Completing secure sign-in…' />;
  return <Navigate to={isAuthenticated ? '/collections' : '/login'} replace />;
}
