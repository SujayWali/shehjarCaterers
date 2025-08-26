'use client';
import Link from 'next/link';
import { Button, Stack, Typography, Box } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function Dashboard() {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" mb={3} textAlign="center">Dashboard</Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={2}
        alignItems="stretch"
        justifyContent="center"
      >
        {[{
          label: 'Create New Menu',
          href: '/menus/new',
          icon: <AddCircleIcon />,
        }, {
          label: 'My Menus',
          href: '/menus',
          icon: <ListAltIcon />,
        }, {
          label: 'Upload Existing',
          href: '/upload',
          icon: <CloudUploadIcon />,
        }, {
          label: 'Quotations',
          href: '/quotations',
          icon: <ListAltIcon />, 
        }, {
          label: 'Invoices',
          href: '/invoices',
          icon: <ListAltIcon />, 
        }].map(btn => (
          <Button
            key={btn.label}
            component={Link}
            href={btn.href}
            variant="contained"
            startIcon={btn.icon}
            sx={{
              minWidth: 180,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              py: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              transition: 'background 0.2s',
              '&:hover': { backgroundColor: 'primary.dark' },
              '&:active': { backgroundColor: 'primary.light' },
            }}
          >
            {btn.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
