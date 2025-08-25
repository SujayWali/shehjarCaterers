'use client';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Button, Link as MuiLink, Stack, Typography, Modal, Box, Paper } from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MenuRowFields } from '@/components/MenuRowFields';
// MenuRowFields already updated to handle dd-mm-yyyy format for date field
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { generateDocx } from '@/utils/generateDocx';
import { saveMenuToStorage } from '@/utils/saveMenuToStorage';
import { MenuDoc } from '@/types/menu';

export default function MenusPage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState<(MenuDoc & { id: string }) | null>(null);
  const [items, setItems] = useState<(MenuDoc & { id: string })[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editMenu, setEditMenu] = useState<(MenuDoc & { id: string }) | null>(null);

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

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { clientName: '', rows: [] },
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let unsub: (() => void) | undefined;

    const startIndexed = () => {
      const q = query(
        collection(db, 'menus'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any;
          setItems(rows);
        },
        // If the index is missing/building, fall back
        () => startFallback()
      );
    };

    const startFallback = () => {
      const q2 = query(collection(db, 'menus'), where('userId', '==', user.uid));
      unsub = onSnapshot(q2, (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) })) as any;
        rows.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setItems(rows);
      });
    };

    startIndexed();

    return () => unsub?.();
  }, []);

  const sendWhatsApp = async (docxUrl?: string, clientName?: string) => {
    if (!docxUrl) return;
    await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: docxUrl,
        filename: `menu_${clientName || 'client'}.docx`,
        caption: `Menu for ${clientName}`,
      }),
    });
    alert('Sent on WhatsApp!');
  };

  return (
    <Stack sx={{ p: 3 }} gap={2}>
      <Typography variant="h5">My Menus</Typography>
      {items.map((it) => (
        <Stack key={it.id} direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center" sx={{ border: '1px solid #eee', p: 2, borderRadius: 2 }}>
          <Typography flex={1}><strong>{it.clientName}</strong></Typography>
          {it.docxUrl ? (
            <>
              <MuiLink href={it.docxUrl} target="_blank" rel="noreferrer"><Button>Download DOCX</Button></MuiLink>
               {/* <Button variant="contained" onClick={() => sendWhatsApp(it.docxUrl, it.clientName)}>Send on WhatsApp</Button> */}
              <Button
                variant="contained"
                onClick={() => {
                  const phone = '919810421233';
                  const message = encodeURIComponent(`Menu for ${it.clientName}: ${it.docxUrl}`);
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                }}
              >
                Send via WhatsApp
              </Button>
              <Button variant="outlined" onClick={async () => {
                // Dynamically import and convert to PDF
                const { generatePdf } = await import('@/utils/generatePdf');
                const base = {
                  userId: it.userId,
                  clientName: it.clientName,
                  rows: it.rows,
                  createdAt: it.createdAt,
                  updatedAt: it.updatedAt,
                };
                const { blob, filename } = await generatePdf(base);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
              }}>Convert to PDF</Button>
              <Button variant="outlined" color="primary" onClick={() => {
                setEditMenu(it);
                methods.reset({ clientName: it.clientName, rows: it.rows });
                setEditOpen(true);
              }}>Edit</Button>
              <Button variant="outlined" color="error" onClick={() => {
                setDeleteMenu(it);
                setDeleteOpen(true);
              }}>Delete</Button>
            </>
          ) : (
            <Typography color="text.secondary">File not generated</Typography>
          )}
        </Stack>
      ))}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <Box sx={{ maxWidth: 350, mx: 'auto', mt: 12, bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" mb={2} color="error">Delete Menu</Typography>
          <Typography mb={2}>Are you sure you want to delete <strong>{deleteMenu?.clientName}</strong>?</Typography>
          <Stack direction="row" gap={2}>
            <Button variant="contained" color="error" onClick={async () => {
              if (!deleteMenu) return;
              await deleteDoc(doc(db, 'menus', deleteMenu.id));
              // Remove file from storage if exists
              if (deleteMenu.docxUrl) {
                try {
                  // Get storage path from URL
                  const url = new URL(deleteMenu.docxUrl);
                  const path = decodeURIComponent(url.pathname.replace(/^\//, ''));
                  await deleteObject(storageRef(storage, path));
                } catch {}
              }
              setDeleteOpen(false);
              setDeleteMenu(null);
            }}>Delete</Button>
            <Button variant="outlined" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95vw', sm: 500, md: 700 },
            maxHeight: { xs: '90vh', md: '80vh' },
            bgcolor: 'background.paper',
            p: { xs: 1.5, sm: 3 },
            borderRadius: 2,
            boxShadow: 3,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" mb={2}>Edit Menu</Typography>
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(async (data) => {
                if (!editMenu) return;
                // Regenerate DOCX
                const base = {
                  userId: editMenu.userId,
                  clientName: data.clientName,
                  rows: data.rows.map(r => ({ ...r, time: r.time ?? '' })),
                  createdAt: editMenu.createdAt,
                  updatedAt: Date.now(),
                };
                const { blob, filename } = await generateDocx(base);
                const { url } = await saveMenuToStorage({
                  userId: editMenu.userId,
                  menuId: editMenu.id,
                  blob,
                  filename,
                  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });
                await updateDoc(doc(db, 'menus', editMenu.id), {
                  clientName: data.clientName,
                  rows: data.rows,
                  updatedAt: Date.now(),
                  docxUrl: url,
                });
                setEditOpen(false);
              })}
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  mb: 2,
                  overflowY: 'auto',
                  maxHeight: { xs: '50vh', md: '55vh' },
                }}
              >
                <MenuRowFields />
              </Paper>
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>Save Changes</Button>
            </form>
          </FormProvider>
        </Box>
      </Modal>
    </Stack>
  );
}
