'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TextField, Button, Box, Typography, CircularProgress, Snackbar, Grid, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Link from 'next/link';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // For line items
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getDoc(doc(db, 'invoices', params.id)).then(snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setInvoice(data);
  setItems('items' in data && Array.isArray((data as any).items) ? (data as any).items : []);
      } else {
        setInvoice(null);
      }
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [params.id]);

  if (loading) return <Box textAlign="center" mt={6}><CircularProgress /></Box>;
  if (!invoice) return <Typography color="error" textAlign="center">Invoice not found.</Typography>;

  return (
  <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Typography variant="h5" mb={2}>Edit Invoice</Typography>
  <Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
          <TextField label="Bill No" value={invoice.billNo} onChange={e => setInvoice({ ...invoice, billNo: e.target.value })} fullWidth sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12} sm={6}>
          <TextField label="Bill Date" value={invoice.billDate} onChange={e => setInvoice({ ...invoice, billDate: e.target.value })} fullWidth sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12} sm={6}>
          <TextField label="Supplier Name" value={invoice.supplier?.name || ''} onChange={e => setInvoice({ ...invoice, supplier: { ...invoice.supplier, name: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Supplier Address" value={invoice.supplier?.address || ''} onChange={e => setInvoice({ ...invoice, supplier: { ...invoice.supplier, address: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Supplier Mobile" value={invoice.supplier?.mobile || ''} onChange={e => setInvoice({ ...invoice, supplier: { ...invoice.supplier, mobile: e.target.value } })} fullWidth sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12} sm={6}>
          <TextField label="Receiver Name" value={invoice.receiver?.name || ''} onChange={e => setInvoice({ ...invoice, receiver: { ...invoice.receiver, name: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver Address" value={invoice.receiver?.address || ''} onChange={e => setInvoice({ ...invoice, receiver: { ...invoice.receiver, address: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver State" value={invoice.receiver?.state || ''} onChange={e => setInvoice({ ...invoice, receiver: { ...invoice.receiver, state: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver Mobile" value={invoice.receiver?.mobile || ''} onChange={e => setInvoice({ ...invoice, receiver: { ...invoice.receiver, mobile: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver GSTIN" value={invoice.receiver?.gstin || ''} onChange={e => setInvoice({ ...invoice, receiver: { ...invoice.receiver, gstin: e.target.value } })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver PAN" value={invoice.receiver?.pan || ''} onChange={e => setInvoice({ ...invoice, receiver: { ...invoice.receiver, pan: e.target.value } })} fullWidth sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12}>
          <Typography variant="h6" mt={2} mb={1}>Line Items</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            {items.map((item, idx) => (
              <Box key={idx} display="flex" gap={1} mb={1} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="S.No." type="number" value={item.sno} onChange={e => {
                const newItems = items.map((it, i) => i === idx ? { ...it, sno: Number(e.target.value) } : it);
                setItems(newItems);
              }} sx={{ width: 80 }} />
              <TextField label="Particulars" value={item.particulars} onChange={e => {
                const newItems = items.map((it, i) => i === idx ? { ...it, particulars: e.target.value } : it);
                setItems(newItems);
              }} sx={{ flex: 2 }} />
              <TextField label="Period" value={item.period || ''} onChange={e => {
                const newItems = items.map((it, i) => i === idx ? { ...it, period: e.target.value } : it);
                setItems(newItems);
              }} sx={{ width: 100 }} />
              <TextField label="Rate" value={item.rate || ''} onChange={e => {
                const newItems = items.map((it, i) => i === idx ? { ...it, rate: e.target.value } : it);
                setItems(newItems);
              }} sx={{ width: 100 }} />
                  <TextField label="Amount Rs." type="text" value={item.amountRs === 0 ? '' : (item.amountRs || '')} onChange={e => {
                    const newItems = items.map((it, i) => i === idx ? { ...it, amountRs: e.target.value } : it);
                    setItems(newItems);
                  }} sx={{ width: 120 }} />
              <TextField label="Ps." type="text" value={item.ps === 0 ? '' : (item.ps || '')} onChange={e => {
                const newItems = items.map((it, i) => i === idx ? { ...it, ps: e.target.value } : it);
                setItems(newItems);
              }} sx={{ width: 80 }} />
              <IconButton color="error" onClick={() => {
                setItems(items.filter((_, i) => i !== idx));
              }}><DeleteIcon /></IconButton>
            </Box>
            ))}
          </Box>
          <Button variant="outlined" onClick={() => setItems([...items, { sno: items.length + 1, particulars: '', period: '', rate: '', amountRs: 0, ps: 0 }])} sx={{ mt: 1 }}>Add Item</Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Amount in Words" value={invoice.amountInWords || ''} onChange={e => setInvoice({ ...invoice, amountInWords: e.target.value })} fullWidth sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField label="Total Rs." type="text" value={invoice.totalRs === 0 ? '' : (invoice.totalRs || '')} onChange={e => setInvoice({ ...invoice, totalRs: e.target.value })} fullWidth sx={{ mb: 2 }} />
        </Grid>
      </Grid>
  <Box display="flex" gap={2} mt={3} flexDirection={{ xs: 'column', sm: 'row' }}>
        <Button variant="contained" color="primary" disabled={saving} onClick={async () => {
          setSaving(true);
          try {
            await updateDoc(doc(db, 'invoices', invoice.id), {
              billNo: invoice.billNo,
              billDate: invoice.billDate,
              supplier: invoice.supplier,
              receiver: invoice.receiver,
              items,
              amountInWords: invoice.amountInWords,
              totalRs: invoice.totalRs,
              updatedAt: Date.now(),
            });
            router.push('/invoices');
          } catch (e: any) {
            setError(e.message);
          } finally {
            setSaving(false);
          }
        }}>
          Save
        </Button>
        <Button variant="outlined" component={Link} href="/invoices">Cancel</Button>
        {/* WhatsApp action only */}
        <Tooltip title="Send via WhatsApp">
          <span>
            <IconButton color="success" onClick={() => {
              const phone = '919810421233';
              const summary = `Invoice: Rs.${invoice.totalRs || ''}\nReceiver: ${invoice.receiver?.name || ''}\nBill No: ${invoice.billNo}\nDate: ${invoice.billDate}`;
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(summary)}`, '_blank');
            }}>
              <img src="/logo.png" alt="WA" style={{ width: 24, height: 24 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} message={error} />
    </Box>
  );
}
