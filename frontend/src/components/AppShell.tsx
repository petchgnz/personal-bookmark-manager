import { useAuth0 } from '@auth0/auth0-react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { NavLink, Outlet } from 'react-router';

export function AppShell() {
  const { logout } = useAuth0();
  return (
    <Box className='min-h-screen bg-slate-50'>
      <AppBar
        position='static'
        color='inherit'
        elevation={0}
        className='border-b border-slate-200'
      >
        <Toolbar>
          <Typography variant='h6' color='primary' className='grow font-bold'>
            Bookmark Manager
          </Typography>
          <Stack direction='row' spacing={1} className='items-center'>
            <Button component={NavLink} to='/collections'>
              Collections
            </Button>
            <Button component={NavLink} to='/bookmarks'>
              Bookmarks
            </Button>
            <Button component={NavLink} to='/all'>
              All
            </Button>
            <Button
              variant='outlined'
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Log out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth='lg' className='py-8'>
        <Outlet />
      </Container>
    </Box>
  );
}
