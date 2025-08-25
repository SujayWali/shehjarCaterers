'use client';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useState } from 'react';
import { Button, TextField, Stack, Typography, Paper } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) { setError(e.message); }
  };

  const onGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e: any) { setError(e.message); }
  };

  return (
    <Stack alignItems="center" justifyContent="center" sx={{minHeight:'100vh', p:2}}>
      <Paper sx={{p:4, width: 360}}>
        <Typography variant="h5" gutterBottom>Shehjar Caterers — Login</Typography>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={e=>setEmail(e.target.value)} fullWidth/>
          <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth/>
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button variant="contained" onClick={onEmailLogin}>Login</Button>
          <Button variant="outlined" onClick={onGoogle}>Continue with Google</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
