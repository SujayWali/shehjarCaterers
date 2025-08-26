
"use client";
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Button, Stack, Typography, Modal, Box, Paper, TextField } from '@mui/material';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import RichTextEditor from '@/components/RichTextEditor';

const schema = yup.object({
  date: yup.string().required(),
  description: yup.string().required(),
  totalCost: yup.string().required(),
}).required();

export default function QuotationsPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [editQuotation, setEditQuotation] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { date: '', description: '', totalCost: '' },
  });



  useEffect(() => {
    const q = query(
      collection(db, 'quotations'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Stack sx={{ p: 3 }} gap={2}>
      <Typography variant="h5">Quotations</Typography>
      {/* List quotations */}
      {items.map((it) => (
        <Stack key={it.id} direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center" sx={{ border: '1px solid #eee', p: 2, borderRadius: 2, mb: 2 }}>
          <Box flex={1} sx={{ minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Box>
                <img src="/logo.png" alt="Logo" style={{ height: 32, marginBottom: 4 }} />
                <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                  MOBILE: 9810421233, 7018227126, EMAIL: shehjarcaterers@gmail.com
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ minWidth: 120, textAlign: 'right' }}>
                DATE: {it.date}
              </Typography>
            </Stack>
            <Typography variant="h6" align="center" fontWeight={700} mb={1} color="primary">QUOTATION</Typography>
            <Box sx={{ mb: 1 }}>
              <div dangerouslySetInnerHTML={{ __html: it.description }} />
            </Box>
            <Typography variant="body1" align="center" fontWeight={600} color="success.main" mb={1}>
              Total Estimated Cost = {it.totalCost}
            </Typography>
          </Box>
          <Stack direction="column" gap={1}>
            <Button variant="contained" onClick={async () => {
              const { generateQuotationDocx } = await import('@/utils/generateQuotationDocx');
              const base = {
                date: it.date,
                description: it.description,
                totalCost: it.totalCost,
              };
              const { blob, filename } = await generateQuotationDocx(base);
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            }}>Download DOCX</Button>
            <Button variant="outlined" onClick={async () => {
              const { generateQuotationPdf } = await import('@/utils/generateQuotationPdf');
              const base = {
                date: it.date,
                description: it.description,
                totalCost: it.totalCost,
              };
              const { blob, filename } = await generateQuotationPdf(base);
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            }}>Convert to PDF</Button>
            <Button variant="contained" color="success" onClick={() => {
              const phone = '919810421233';
              const message = encodeURIComponent(`Quotation: ${it.totalCost}\n${it.description}`);
              window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            }}>Send via WhatsApp</Button>
            <Button variant="outlined" color="primary" onClick={() => {
              setEditQuotation(it);
              methods.reset({ date: it.date, description: it.description, totalCost: it.totalCost });
              setEditOpen(true);
            }}>Edit</Button>
            <Button variant="outlined" color="error" onClick={async () => {
              if (!it.id) return;
              await deleteDoc(doc(db, 'quotations', it.id));
            }}>Delete</Button>
          </Stack>
        </Stack>
      ))}
      <Button variant="contained" onClick={() => {
        setEditQuotation(null);
        methods.reset({ date: '', description: '', totalCost: '' });
        setEditOpen(true);
      }}>Add Quotation</Button>
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
          <Typography variant="h6" mb={2}>{editQuotation ? 'Edit Quotation' : 'Add Quotation'}</Typography>
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(async (data) => {
                const user = auth.currentUser;
                if (!user) return;
                if (editQuotation) {
                  // Update existing quotation
                  await updateDoc(doc(db, 'quotations', editQuotation.id), {
                    ...data,
                    userId: user.uid,
                    updatedAt: Date.now(),
                  });
                } else {
                  // Add new quotation
                  await addDoc(collection(db, 'quotations'), {
                    ...data,
                    userId: user.uid,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                }
                setEditOpen(false);
              })}
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              <Paper elevation={0} sx={{ p: 1, mb: 2, overflowY: 'auto', maxHeight: { xs: '50vh', md: '55vh' } }}>
                <Controller
                  name="date"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2 }}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={methods.control}
                  render={({ field }) => (
                    <RichTextEditor {...field} label="Quotation Description" />
                  )}
                />
                <Controller
                  name="totalCost"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Total Cost"
                      sx={{ mt: 2 }}
                      fullWidth
                    />
                  )}
                />
              </Paper>
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>Save</Button>
              {editQuotation && (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={methods.handleSubmit(async (data) => {
                    const user = auth.currentUser;
                    if (!user) return;
                    // Save as new quotation
                    await addDoc(collection(db, 'quotations'), {
                      ...data,
                      userId: user.uid,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    });
                    setEditOpen(false);
                  })}
                >Save As New Quotation</Button>
              )}
            </form>
          </FormProvider>
        </Box>
      </Modal>
    </Stack>
  );
}
