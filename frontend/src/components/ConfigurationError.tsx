import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Container from '@mui/material/Container'

export function ConfigurationError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Invalid configuration'
  return (
    <Container maxWidth="sm" className="py-16">
      <Alert severity="error">
        <AlertTitle>Frontend configuration required</AlertTitle>
        {message}. Copy <code>frontend/.env.example</code> to <code>frontend/.env</code> and provide the company SPA Client ID.
      </Alert>
    </Container>
  )
}
