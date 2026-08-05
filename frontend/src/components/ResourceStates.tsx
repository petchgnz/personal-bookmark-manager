import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function ResourceLoading({ label }: { label: string }) {
  return (
    <Stack className='items-center py-12' spacing={2}>
      <CircularProgress />
      <Typography color='text.secondary'>{label}</Typography>
    </Stack>
  );
}

export function ResourceError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert
      severity='error'
      sx={{
        alignItems: 'center',
        '& .MuiAlert-action': {
          paddingTop: 0,
        },
      }}
      action={
        <Button color='inherit' onClick={onRetry}>
          Try again
        </Button>
      }
    >
      We could not load this content.
    </Alert>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Stack
      className='items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center'
      spacing={1}
    >
      <Typography variant='h6'>{title}</Typography>
      <Typography color='text.secondary'>{message}</Typography>
    </Stack>
  );
}
