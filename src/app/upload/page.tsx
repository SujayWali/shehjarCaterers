'use client';
import { useState } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';

export default function UploadPage() {
  const [clientName, setClientName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const onUpload = async () => {
    const user = auth.currentUser; if (!user || !file) return;
    const docRef = await addDoc(collection(db, 'menus'), {
      userId: user.uid,
      clientName,
      rows: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const objectRef = ref(storage, `menus/${user.uid}/${docRef.id}/${file.name}`);
    await uploadBytes(objectRef, file);
    const url = await getDownloadURL(objectRef);
    await (await import('firebase/firestore')).updateDoc(
      (await import('firebase/firestore')).doc(db, 'menus', docRef.id),
      { docxUrl: url, updatedAt: Date.now() }
    );
    alert('Uploaded!');
  };

  return (
    <Stack alignItems="center" sx={{ p:2 }}>
      <Paper sx={{ p:3, width: 480 }}>
        <Typography variant="h5" gutterBottom>Upload Existing Menu</Typography>
        <Stack gap={2}>
          <TextField label="Client Name" value={clientName} onChange={e=>setClientName(e.target.value)} />
          <input type="file" accept=".doc,.docx,.pdf" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          <Button variant="contained" onClick={onUpload}>Upload</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
