// Composite Index (Invoices): userId ASC, createdAt DESC (scope: Collection)
// Firestore rules:
// match /invoices/{invoiceId} {
//   allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
//   allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
// }
'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { safeDelete } from '@/utils/storage';
import { Button, Box, Typography, TextField, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Link from 'next/link';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function InvoicesListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      let snap;
      try {
        const q = query(collection(db, 'invoices'), where('userId', '==', auth.currentUser?.uid), orderBy('createdAt', 'desc'));
        snap = await getDocs(q);
      } catch (e: any) {
        if (e.code === 'failed-precondition' || e.message.includes('index')) {
          // fallback: no orderBy
          const q = query(collection(db, 'invoices'), where('userId', '==', auth.currentUser?.uid));
          snap = await getDocs(q);
        } else {
          setError(e.message);
          setLoading(false);
          return;
        }
      }
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setRows(data.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
      setLoading(false);
    }
    fetchInvoices();
  }, []);

  const filteredRows = rows.filter(row => {
    const billNoMatch = row.billNo?.toLowerCase().includes(search.toLowerCase());
    const receiverName = row.receiver && typeof row.receiver === 'object' ? row.receiver.name : '';
    const receiverMatch = receiverName && receiverName.toLowerCase().includes(search.toLowerCase());
    return billNoMatch || receiverMatch;
  });

  const handleDelete = async (id: string) => {
    const invoice = rows.find(r => r.id === id);
    if (!invoice) return;
    try {
      await safeDelete(invoice.docxPath);
      await safeDelete(invoice.pdfPath);
      await deleteDoc(doc(db, 'invoices', id));
      setRows(rows.filter(r => r.id !== id));
      setSnackbar('Invoice deleted');
    } catch (e: any) {
      setSnackbar(e.message);
    }
    setDeleteId(null);
  };

  return (
  <Box sx={{ p: { xs: 1, sm: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" mb={2} textAlign="center">My Invoices</Typography>
      <Box display="flex" gap={2} mb={2} alignItems="center" justifyContent="space-between">
        <TextField label="Search" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1 }} />
        <Button component={Link} href="/invoices/new" variant="contained" color="primary">Create Invoice</Button>
      </Box>
      {loading ? (
        <Box textAlign="center" mt={6}><CircularProgress /></Box>
      ) : filteredRows.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" mt={4}>No invoices found.</Typography>
      ) : (
        <Box sx={{ width: '100%', overflowX: 'auto', minWidth: { xs: 400, sm: 'auto' } }}>
          <DataGrid
            autoHeight
            rows={filteredRows}
            columns={[
              { field: 'billNo', headerName: 'Bill No', flex: 1, minWidth: 120, renderCell: params => <Link href={`/invoices/${params.row.id}/edit`} style={{ textDecoration: 'underline', fontSize: '1rem' }}>{params.value}</Link> },
              { field: 'billDate', headerName: 'Date', flex: 1, minWidth: 100, width: 120 },
              { field: 'receiver', headerName: 'Receiver', flex: 1, minWidth: 120, valueGetter: params => {
                const r = params.row?.receiver;
                return r && typeof r === 'object' && r.name ? r.name : '';
              } },
              { field: 'totalRs', headerName: 'Total', flex: 1, minWidth: 100, align: 'right', headerAlign: 'right', valueFormatter: params => Intl.NumberFormat('en-IN').format(params.row?.totalRs ?? 0) },
              { field: 'docxUrl', headerName: 'DOCX', flex: 0.5, minWidth: 80, renderCell: params => (
                <Tooltip title="Download DOCX">
                  <span>
                    <IconButton color="primary" size="small" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} onClick={async () => {
                      if (params.row.docxUrl) {
                        window.open(params.row.docxUrl, '_blank');
                      } else {
                        const { generateInvoiceDocx } = await import('@/utils/invoice/generateInvoiceDocx');
                        const { blob, filename } = await generateInvoiceDocx(params.row);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}>
                      <DescriptionIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              ) },
              { field: 'pdfUrl', headerName: 'PDF', flex: 0.5, minWidth: 80, renderCell: params => (
                <Tooltip title="Download PDF">
                  <span>
                    <IconButton color="primary" size="small" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} onClick={async () => {
                      if (params.row.pdfUrl) {
                        window.open(params.row.pdfUrl, '_blank');
                      } else {
                        const { generateInvoicePdfBlob } = await import('@/utils/invoice/generateInvoicePdf');
                        const { blob, filename } = await generateInvoicePdfBlob(params.row);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}>
                      <PictureAsPdfIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              ) },
              { field: 'actions', headerName: 'Actions', flex: 1, minWidth: 120, sortable: false, renderCell: params => (
                <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <IconButton component={Link} href={`/invoices/${params.row.id}/edit`} color="primary" size="small"><EditIcon /></IconButton>
                  <IconButton color="error" size="small" onClick={() => setDeleteId(params.row.id)}><DeleteIcon /></IconButton>
                </Box>
              ) },
            ]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, minWidth: { xs: 400, sm: 'auto' } }}
          />
        </Box>
      )}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete this invoice?</DialogTitle>
        <DialogContent>This will also delete stored files.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={() => handleDelete(deleteId!)}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar('')} message={snackbar} />
    </Box>
  );
}
