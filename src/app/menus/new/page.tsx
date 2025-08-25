'use client';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Stack, TextField, Button, Typography, Paper } from '@mui/material';
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

  const onSubmit = async (data: any) => {
    console.log('currentUser uid =', auth.currentUser?.uid);

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to generate and save a menu.');
      return;
    }

    setError(null);
    try {
      const base: Omit<MenuDoc, 'id'> = {
        userId: user.uid,
        clientName: data.clientName,
        rows: data.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      console.log('Menu base:', base);

      const docRef = await addDoc(collection(db, 'menus'), base as any);
      console.log('Firestore docRef:', docRef.id);

      const { blob, filename } = await generateDocx(base);
      console.log('DOCX generated:', filename, blob);

      const { url } = await saveMenuToStorage({
        userId: user.uid,
        menuId: docRef.id,
        blob,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      console.log('DOCX uploaded to Storage:', url);

      await (await import('firebase/firestore')).updateDoc(
        (await import('firebase/firestore')).doc(db, 'menus', docRef.id),
        { docxUrl: url, updatedAt: Date.now() }
      );
      console.log('Firestore doc updated with docxUrl');

      setLastMenu({ url, filename, clientName: data.clientName });
      alert('Menu DOCX created and uploaded!');
    } catch (err: any) {
      console.error('Error in menu creation:', err);
      setError(err?.message || 'An unexpected error occurred.');
      alert('Error: ' + (err?.message || 'An unexpected error occurred.'));
    }
  };

  return (
    <Stack alignItems="center" sx={{ p: 2 }}>
      <Paper sx={{ p: 3, width: 'min(1100px, 100%)' }}>
        <Typography variant="h5" gutterBottom>Create New Menu</Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Stack gap={2}>
              <TextField label="Client Name (Cover Page)" {...methods.register('clientName')} />
              <MenuRowFields />
              <Button type="submit" variant="contained">Generate & Save</Button>
              {lastMenu && (
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={async () => {
                    try {
                      const resp = await fetch('/api/send-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ link: lastMenu.url, filename: lastMenu.filename, caption: `Menu for ${lastMenu.clientName}` }),
                      });
                      if (!resp.ok) throw new Error('Failed to send WhatsApp message');
                      alert('Sent on WhatsApp!');
                    } catch (err: any) {
                      setError(err?.message || 'An unexpected error occurred.');
                    }
                  }}
                >Send on WhatsApp</Button>
              )}
            </Stack>
          </form>
        </FormProvider>
      </Paper>
    </Stack>
  );
}
