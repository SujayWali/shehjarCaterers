'use client';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <Stack gap={2} sx={{ p: 3 }}>
      <Typography variant="h5">Dashboard</Typography>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <Button component={Link} href="/menus/new" variant="contained">Create New Menu</Button>
        <Button component={Link} href="/menus" variant="outlined">My Menus</Button>
        <Button component={Link} href="/upload" variant="outlined">Upload Existing</Button>
      </Stack>
    </Stack>
  );
}
