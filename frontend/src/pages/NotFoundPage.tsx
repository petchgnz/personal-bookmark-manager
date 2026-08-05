import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <Container maxWidth='sm' className='py-20'>
      <Stack spacing={2} className='items-start'>
        <Typography variant='h4'>Page not found</Typography>
        <Typography color='text.secondary'>
          The requested page does not exist.
        </Typography>
        <Button component={Link} to='/collections' variant='contained'>
          Back to collections
        </Button>
      </Stack>
    </Container>
  );
}
