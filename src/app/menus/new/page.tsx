'use client';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Stack, TextField, Button, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { MenuRowFields } from '@/components/MenuRowFields';
import { MenuDoc } from '@/types/menu';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { generateDocx } from '@/utils/generateDocx';
import { saveMenuToStorage } from '@/utils/saveMenuToStorage';

const schema = yup.object({
  clientName: yup.string().required(),
  rows: yup.array().of(yup.object({
    date: yup.string().required(),
    particulars: yup.string().required(),
    menu: yup.string().required(),
    time: yup.string().optional(),
    numPersons: yup.number().min(0).required(),
  })).min(1).required(),
}).required();

export default function NewMenuPage() {

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { clientName: '', rows: [] }
  });
  const [error, setError] = React.useState<string | null>(null);
  const [lastMenu, setLastMenu] = React.useState<{ url: string; filename: string; clientName: string } | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMsg, setDialogMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setDialogMsg('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to generate and save a menu.');
        setDialogMsg('You must be logged in to generate and save a menu.');
        setDialogOpen(true);
        setLoading(false);
        return;
      }
      const base: Omit<MenuDoc, 'id'> = {
        userId: user.uid,
        clientName: data.clientName,
        rows: data.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, 'menus'), base as any);
      const { blob, filename } = await generateDocx(base);
      const { url } = await saveMenuToStorage({
        userId: user.uid,
        menuId: docRef.id,
        blob,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      await (await import('firebase/firestore')).updateDoc(
        (await import('firebase/firestore')).doc(db, 'menus', docRef.id),
        { docxUrl: url, updatedAt: Date.now() }
      );
      setLastMenu({ url, filename, clientName: data.clientName });
      setDialogMsg('Menu DOCX created and uploaded!');
      setDialogOpen(true);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setDialogMsg('Error: ' + (err?.message || 'An unexpected error occurred.'));
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack alignItems="center" sx={{ p: { xs: 1, sm: 2 } }}>
  <Paper sx={{ p: { xs: 2, sm: 3 }, width: { xs: '100%', sm: 800, md: 1200 }, maxWidth: '98vw' }}>
        <Typography variant="h5" gutterBottom textAlign="center">Create New Menu</Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Stack gap={2}>
              <TextField label="Client Name (Cover Page)" {...methods.register('clientName')} fullWidth />
              <MenuRowFields />
              <Button type="submit" variant="contained" disabled={loading} fullWidth>
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Generate & Save'}
              </Button>
              {lastMenu && (
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  fullWidth
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const resp = await fetch('/api/send-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ link: lastMenu.url, filename: lastMenu.filename, caption: `Menu for ${lastMenu.clientName}` }),
                      });
                      if (!resp.ok) throw new Error('Failed to send WhatsApp message');
                      setDialogMsg('Sent on WhatsApp!');
                      setDialogOpen(true);
                    } catch (err: any) {
                      setError(err?.message || 'An unexpected error occurred.');
                      setDialogMsg('Error: ' + (err?.message || 'An unexpected error occurred.'));
                      setDialogOpen(true);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >Send on WhatsApp</Button>
              )}
            </Stack>
          </form>
        </FormProvider>
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Status</DialogTitle>
        <DialogContent>
          <Typography>{dialogMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
