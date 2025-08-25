'use client';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import { MenuDoc } from '@/types/menu';

export default function MenusPage() {
  const [items, setItems] = useState<(MenuDoc & { id: string })[]>([]);

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
              <Button variant="contained" onClick={() => sendWhatsApp(it.docxUrl, it.clientName)}>Send on WhatsApp</Button>
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
            </>
          ) : (
            <Typography color="text.secondary">File not generated</Typography>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
