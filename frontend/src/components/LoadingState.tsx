import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <Stack spacing={2} className="min-h-64 items-center justify-center">
      <CircularProgress size={32} />
      <Typography color="text.secondary">{message}</Typography>
    </Stack>
  )
}
