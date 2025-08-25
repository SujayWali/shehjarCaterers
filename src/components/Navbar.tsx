'use client';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/login');
  };

  return (
    <AppBar position="static" color="default" sx={{ mb: 2 }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Button component={Link} href="/dashboard" color="inherit">
            Home
          </Button>
        </Box>
        <Button onClick={handleLogout} color="inherit">
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
