import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMe } from '../api/useMe'

export function FoundationPage({ title, description }: { title: string; description: string }) {
  const me = useMe()
  return (
    <Stack spacing={3}>
      <div><Typography variant="h4" gutterBottom>{title}</Typography><Typography color="text.secondary">{description}</Typography></div>
      {me.isPending && <Skeleton variant="rounded" height={96} />}
      {me.isError && <Alert severity="error">We could not load your account. Please try again.</Alert>}
      {me.data && <Card><CardContent><Typography variant="overline" color="text.secondary">Signed in account</Typography><Typography variant="h6">{me.data.displayName ?? me.data.email ?? 'Authenticated user'}</Typography><Typography variant="body2" color="text.secondary">User ID: {me.data.id}</Typography></CardContent></Card>}
    </Stack>
  )
}
